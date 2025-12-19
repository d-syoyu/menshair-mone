// src/app/api/admin/reservations/route.ts
// MONË - Reservations Admin API (電話予約対応)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { parseLocalDate } from "@/lib/date-utils";

// DB Menuの型定義
interface DbMenu {
  id: string;
  name: string;
  price: number;
  duration: number;
  lastBookingTime: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
}

// 予約作成スキーマ
const createReservationSchema = z.object({
  userId: z.string().min(1, "顧客IDは必須です"),
  menuIds: z.array(z.string()).min(1, "メニューを1つ以上選択してください"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付の形式が正しくありません（例: 2024-01-15）"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "時間の形式が正しくありません（例: 10:00）"),
  note: z.string().optional(),
  couponCode: z.string().max(50, "クーポンコードは50文字以内で入力してください").optional(),
});

// 時間を分に変換
const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

// 分を時間文字列に変換
const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

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
  customerId?: string;
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
  if (customerId && coupon.usageLimitPerCustomer !== null) {
    const usageCount = await prisma.couponUsage.count({
      where: { couponId: coupon.id, customerId },
    });
    if (usageCount >= coupon.usageLimitPerCustomer) {
      throw new Error("このお客様はクーポンの利用上限に達しています");
    }
  }
  if (customerId && coupon.onlyFirstTime) {
    const saleCount = await prisma.sale.count({ where: { userId: customerId } });
    if (saleCount > 0) {
      throw new Error("初回来店限定のクーポンです");
    }
  }
  if (customerId && coupon.onlyReturning) {
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

// GET /api/admin/reservations - 予約一覧取得
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const status = searchParams.get("status");

    // クエリ条件を構築
    const where: Record<string, unknown> = {};

    if (date) {
      const reservationDate = parseLocalDate(date);
      where.date = reservationDate;
    }

    if (status) {
      where.status = status;
    }

    // 予約一覧を取得
    const reservations = await prisma.reservation.findMany({
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
      orderBy: [
        { date: "asc" },
        { startTime: "asc" },
      ],
    });

    return NextResponse.json({ reservations });
  } catch (error) {
    console.error("Get reservations error:", error);
    return NextResponse.json(
      { error: "予約の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST /api/admin/reservations - 予約作成（電話予約用）
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = createReservationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { userId, menuIds, date, startTime, note, couponCode } = validationResult.data;

    // 顧客存在チェック
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "指定された顧客が見つかりません" },
        { status: 400 }
      );
    }

    // DBからメニュー情報を取得
    const menus = await prisma.menu.findMany({
      where: {
        id: { in: menuIds },
        isActive: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }) as DbMenu[];

    if (menus.length !== menuIds.length) {
      return NextResponse.json(
        { error: "無効なメニューが含まれています" },
        { status: 400 }
      );
    }

    // 合計計算（DBメニューから直接）
    const totalPrice = menus.reduce((sum, menu) => sum + menu.price, 0);
    const totalDuration = menus.reduce((sum, menu) => sum + menu.duration, 0);
    const menuSummary = menus.map((m) => m.name).join("、");

    // 終了時間を計算
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + totalDuration;
    const endTime = minutesToTime(endMinutes);

    // 予約日時を作成（タイムゾーン対応）
    const reservationDate = parseLocalDate(date);
    const weekday = reservationDate.getDay();

    // 不定休チェック
    const holidays = await prisma.holiday.findMany({
      where: { date: reservationDate },
    });

    for (const holiday of holidays) {
      // 終日休業
      if (!holiday.startTime || !holiday.endTime) {
        return NextResponse.json(
          { error: `${date}は終日休業です${holiday.reason ? `（${holiday.reason}）` : ""}` },
          { status: 400 }
        );
      }
      // 時間帯休業 - 予約時間と重複チェック
      const holidayStart = timeToMinutes(holiday.startTime);
      const holidayEnd = timeToMinutes(holiday.endTime);
      const reservationStart = startMinutes;
      const reservationEnd = endMinutes;

      // 時間帯が重複しているかチェック
      if (reservationStart < holidayEnd && reservationEnd > holidayStart) {
        return NextResponse.json(
          { error: `${holiday.startTime}〜${holiday.endTime}は休業時間です${holiday.reason ? `（${holiday.reason}）` : ""}` },
          { status: 400 }
        );
      }
    }

    // クーポン検証（任意）
    let appliedCouponId: string | null = null;
    let appliedCouponCode: string | null = null;
    let appliedCouponDiscount = 0;
    if (couponCode) {
      try {
        const { coupon, discount } = await validateCouponForReservation({
          code: couponCode,
          subtotal: totalPrice,
          customerId: userId,
          menuIds,
          categories: menus.map((m) => m.category.name),
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

    // 同日同時間の予約重複チェック
    const existingReservation = await prisma.reservation.findFirst({
      where: {
        date: reservationDate,
        status: "CONFIRMED",
        OR: [
          // 既存予約の開始時間が新規予約の時間範囲内
          {
            AND: [
              { startTime: { gte: startTime } },
              { startTime: { lt: endTime } },
            ],
          },
          // 既存予約の終了時間が新規予約の時間範囲内
          {
            AND: [
              { endTime: { gt: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
          // 新規予約が既存予約の時間範囲内に完全に含まれる
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gte: endTime } },
            ],
          },
        ],
      },
    });

    if (existingReservation) {
      return NextResponse.json(
        { error: `この時間帯は既に予約があります（${existingReservation.startTime}〜${existingReservation.endTime}）` },
        { status: 409 }
      );
    }

    // 予約作成
    const reservation = await prisma.reservation.create({
      data: {
        userId,
        date: reservationDate,
        startTime,
        endTime,
        totalPrice,
        totalDuration,
        menuSummary,
        couponId: appliedCouponId,
        couponCode: appliedCouponCode,
        couponDiscount: appliedCouponDiscount,
        status: "CONFIRMED",
        note: note || null,
        items: {
          create: menus.map((menu, index) => ({
            menuId: menu.id,
            menuName: menu.name,
            category: menu.category.name,
            price: menu.price,
            duration: menu.duration,
            orderIndex: index,
          })),
        },
      },
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
        items: true,
      },
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    console.error("Create reservation error:", error);
    return NextResponse.json(
      { error: "予約の作成に失敗しました" },
      { status: 500 }
    );
  }
}
