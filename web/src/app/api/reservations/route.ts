// src/app/api/reservations/route.ts
// MONË - Reservations API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createReservationSchema } from "@/lib/validations";
import { MENU_ITEMS, calculateMenuTotals, hasDuplicateCategories, getMenuById } from "@/constants/menu";
import { CLOSED_DAY, BUSINESS_HOURS } from "@/constants/salon";
import { isWithinBookingWindow } from "@/constants/booking";
import { parseLocalDate } from "@/lib/date-utils";

// クーポン検証（予約時点。利用回数の更新は会計時に実施）
async function validateCouponForReservation({
  code,
  subtotal,
  customerId,
  menuIds = [],
  categories = [],
  weekday,
  time,
}: {
  code: string;
  subtotal: number;
  customerId: string;
  menuIds?: string[];
  categories?: string[];
  weekday?: number;
  time?: string;
}) {
  const normalizedCode = code.toUpperCase();
  const coupon = await prisma.coupon.findUnique({
    where: { code: normalizedCode },
  });

  if (!coupon) {
    throw new Error("クーポンが見つかりません");
  }

  const now = new Date();
  const currentWeekday = typeof weekday === "number" ? weekday : now.getDay();
  const currentTime = time || now.toTimeString().slice(0, 5);
  if (!coupon.isActive) {
    throw new Error("このクーポンは現在無効です");
  }
  if (now < coupon.validFrom) {
    throw new Error("このクーポンはまだ利用開始前です");
  }
  if (now > coupon.validUntil) {
    throw new Error("このクーポンの有効期限が切れています");
  }
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    throw new Error("このクーポンは利用上限に達しています");
  }
  if (coupon.minimumAmount !== null && subtotal < coupon.minimumAmount) {
    throw new Error(`このクーポンは¥${coupon.minimumAmount.toLocaleString()}以上のご利用で適用できます`);
  }
  if (coupon.applicableMenuIds.length > 0 && !menuIds.every((id) => coupon.applicableMenuIds.includes(id))) {
    throw new Error("対象メニューにのみ利用できます");
  }
  if (coupon.applicableCategoryIds.length > 0 && !categories.every((c) => coupon.applicableCategoryIds.includes(c))) {
    throw new Error("対象カテゴリにのみ利用できます");
  }
  if (coupon.applicableWeekdays.length > 0 && !coupon.applicableWeekdays.includes(currentWeekday)) {
    throw new Error("利用できない曜日です");
  }
  if (coupon.startTime && coupon.endTime) {
    if (currentTime < coupon.startTime || currentTime > coupon.endTime) {
      throw new Error(`利用可能時間は${coupon.startTime}〜${coupon.endTime}です`);
    }
  }
  if (coupon.usageLimitPerCustomer !== null) {
    const usageCount = await prisma.couponUsage.count({
      where: { couponId: coupon.id, customerId },
    });
    if (usageCount >= coupon.usageLimitPerCustomer) {
      throw new Error("このお客様はクーポンの利用上限に達しています");
    }
  }
  if (coupon.onlyFirstTime) {
    const saleCount = await prisma.sale.count({ where: { userId: customerId } });
    if (saleCount > 0) {
      throw new Error("初回来店限定のクーポンです");
    }
  }
  if (coupon.onlyReturning) {
    const saleCount = await prisma.sale.count({ where: { userId: customerId } });
    if (saleCount === 0) {
      throw new Error("リピーター限定のクーポンです");
    }
  }

  const discount =
    coupon.type === "PERCENTAGE"
      ? Math.floor((subtotal * coupon.value) / 100)
      : Math.min(coupon.value, subtotal);

  return { coupon, discount };
}

// GET /api/reservations - 予約一覧取得
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");

    // 管理者の場合は全予約、顧客の場合は自分の予約のみ
    const where: Record<string, unknown> = {};
    if (session.user.role !== "ADMIN") {
      where.userId = session.user.id;
    }
    if (status) {
      where.status = status;
    }

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          coupon: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
              value: true,
            },
          },
          items: {
            orderBy: { orderIndex: "asc" },
          },
        },
        orderBy: [{ date: "desc" }, { startTime: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.reservation.count({ where }),
    ]);

    return NextResponse.json({
      reservations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get reservations error:", error);
    return NextResponse.json(
      { error: "予約一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST /api/reservations - 予約作成（複数メニュー対応）
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = createReservationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { menuIds, date: dateStr, startTime, note, couponCode } = validationResult.data;

    // 全メニューが存在するか確認
    const menus = menuIds.map(id => getMenuById(id)).filter((m): m is NonNullable<typeof m> => m !== undefined);
    if (menus.length !== menuIds.length) {
      return NextResponse.json(
        { error: "指定されたメニューが見つかりません" },
        { status: 400 }
      );
    }

    // カテゴリ重複チェック
    if (hasDuplicateCategories(menuIds)) {
      return NextResponse.json(
        { error: "同じカテゴリのメニューは複数選択できません" },
        { status: 400 }
      );
    }

    // 日付パース（タイムゾーン対応）
    const date = parseLocalDate(dateStr);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: "日付の形式が正しくありません" },
        { status: 400 }
      );
    }

    // 定休日チェック
    if (date.getDay() === CLOSED_DAY) {
      return NextResponse.json(
        { error: "申し訳ございません。定休日のため予約できません" },
        { status: 400 }
      );
    }

    // 予約可能期間チェック
    if (!isWithinBookingWindow(date)) {
      return NextResponse.json(
        { error: "この日付は予約できません" },
        { status: 400 }
      );
    }

    // 合計計算
    const { totalPrice, totalDuration, menuSummary, earliestLastBookingTime } = calculateMenuTotals(menuIds);

    // 最終受付時間チェック
    if (startTime >= earliestLastBookingTime) {
      return NextResponse.json(
        { error: `選択されたメニューの最終受付は${earliestLastBookingTime}です` },
        { status: 400 }
      );
    }

    // 終了時刻計算
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const endMinutes = startHours * 60 + startMinutes + totalDuration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;
    const weekday = date.getDay();

    // クーポン検証（任意）
    let appliedCouponId: string | null = null;
    let appliedCouponCode: string | null = null;
    let appliedCouponDiscount = 0;
    if (couponCode) {
      try {
        const { coupon, discount } = await validateCouponForReservation({
          code: couponCode,
          subtotal: totalPrice,
          customerId: session.user.id,
          menuIds,
          categories: menus.map((m) => m.category),
          weekday,
          time: startTime,
        });
        appliedCouponId = coupon.id;
        appliedCouponCode = coupon.code;
        appliedCouponDiscount = discount;
      } catch (err) {
        const message = err instanceof Error ? err.message : "クーポンの検証に失敗しました";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    // 営業時間内チェック
    if (endTime > BUSINESS_HOURS.close) {
      return NextResponse.json(
        { error: "営業時間外のため予約できません" },
        { status: 400 }
      );
    }

    // 重複チェック
    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    const existingReservations = await prisma.reservation.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: "CONFIRMED",
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    const hasConflict = existingReservations.some((reservation) => {
      return startTime < reservation.endTime && endTime > reservation.startTime;
    });

    if (hasConflict) {
      return NextResponse.json(
        { error: "申し訳ございません。この時間帯は既に予約が入っています" },
        { status: 409 }
      );
    }

    // 予約作成（トランザクション）
    const reservation = await prisma.$transaction(async (tx) => {
      // 予約を作成
      const newReservation = await tx.reservation.create({
        data: {
          userId: session.user.id,
          totalPrice,
          totalDuration,
          menuSummary,
          couponId: appliedCouponId,
          couponCode: appliedCouponCode,
          couponDiscount: appliedCouponDiscount,
          date: parseLocalDate(dateStr),
          startTime,
          endTime,
          note: note || null,
          status: "CONFIRMED",
        },
      });

      // 予約アイテムを作成
      await tx.reservationItem.createMany({
        data: menus.map((menu, index) => ({
          reservationId: newReservation.id,
          menuId: menu.id,
          menuName: menu.name,
          category: menu.category,
          price: menu.price,
          duration: menu.duration,
          orderIndex: index,
        })),
      });

      // 作成した予約を取得して返す
      return tx.reservation.findUnique({
        where: { id: newReservation.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          coupon: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
              value: true,
            },
          },
          items: {
            orderBy: { orderIndex: "asc" },
          },
        },
      });
    });

    // TODO: 予約確認メール送信

    return NextResponse.json(
      {
        message: "予約が完了しました",
        reservation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create reservation error:", error);
    return NextResponse.json(
      { error: "予約の作成に失敗しました" },
      { status: 500 }
    );
  }
}
