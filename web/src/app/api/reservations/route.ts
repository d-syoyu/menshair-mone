// src/app/api/reservations/route.ts
// MONË - Reservations API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createReservationSchema } from "@/lib/validations";
import { CLOSED_DAY, getBusinessHours } from "@/constants/salon";
import { isWithinBookingWindow } from "@/constants/booking";
import { parseLocalDate } from "@/lib/date-utils";
import { validateCoupon } from "@/lib/coupon-validation";
import { sendReservationConfirmationEmail, sendAdminNewReservationEmail } from "@/lib/email";

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

// GET /api/reservations - 予約一覧取得
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);

    const where: Record<string, unknown> = {};
    if (session.user.role !== "ADMIN") {
      where.userId = session.user.id;
    }
    if (status) {
      where.status = status;
    }

    // 日付フィルタリング
    const date = searchParams.get("date");
    if (date) {
      const targetDate = new Date(date + "T00:00:00");
      const nextDate = new Date(date + "T00:00:00");
      nextDate.setDate(nextDate.getDate() + 1);
      where.date = {
        gte: targetDate,
        lt: nextDate,
      };
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

// POST /api/reservations - 予約作成（複数メニュー対応 + 顧客情報更新）
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

    const { menuIds, date: dateStr, startTime, note, couponCode, customerName, customerPhone } =
      validationResult.data;

    // DBからメニュー取得（UUID配列で検索）
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

    // メニュー存在チェック
    if (menus.length !== menuIds.length) {
      return NextResponse.json(
        { error: "指定されたメニューが見つかりません" },
        { status: 400 }
      );
    }

    // 同じカテゴリのメニュー複数選択は許可

    // 日付パース
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

    // 不定休チェック（終日休業のみ - 時間帯休業はavailability APIでブロック済み）
    const holidays = await prisma.holiday.findMany({
      where: { date },
    });

    for (const holiday of holidays) {
      // 終日休業
      if (!holiday.startTime || !holiday.endTime) {
        return NextResponse.json(
          { error: `申し訳ございません。この日は休業日です${holiday.reason ? `（${holiday.reason}）` : ""}` },
          { status: 400 }
        );
      }
    }

    // 合計計算（DBメニューから直接計算）
    const totalPrice = menus.reduce((sum, menu) => sum + menu.price, 0);
    const totalDuration = menus.reduce((sum, menu) => sum + menu.duration, 0);
    const menuSummary = menus.map((m) => m.name).join("、");
    // 営業時間を取得（曜日別）
    const businessHours = getBusinessHours(date);

    // 最終受付時間チェック
    if (startTime > businessHours.lastBooking) {
      return NextResponse.json(
        { error: `最終受付は${businessHours.lastBooking}です` },
        { status: 400 }
      );
    }

    // 終了時間計算
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const endMinutes = startHours * 60 + startMinutes + totalDuration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${endHours.toString().padStart(2, "0")}:${endMins
      .toString()
      .padStart(2, "0")}`;
    const weekday = date.getDay();

    // クーポン検証（任意）
    let appliedCouponId: string | null = null;
    let appliedCouponCode: string | null = null;
    let appliedCouponDiscount = 0;
    if (couponCode) {
      const couponResult = await validateCoupon({
        code: couponCode,
        subtotal: totalPrice,
        customerId: session.user.id,
        menuIds,
        categories: menus.map((m) => m.categoryId),
        weekday,
        time: startTime,
      });

      if (!couponResult.valid) {
        return NextResponse.json(
          { error: couponResult.error },
          { status: 400 }
        );
      }

      appliedCouponId = couponResult.coupon.id;
      appliedCouponCode = couponResult.coupon.code;
      appliedCouponDiscount = couponResult.discountAmount;
    }

    // 営業時間チェック（開店・閉店時間）
    if (startTime < businessHours.open) {
      return NextResponse.json(
        { error: "営業時間外のため予約できません" },
        { status: 400 }
      );
    }
    if (endTime > businessHours.close) {
      return NextResponse.json(
        { error: "営業時間外のため予約できません" },
        { status: 400 }
      );
    }

    // 同日・同時間帯の重複チェック
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

    // 予約作成（トランザクション）- 顧客情報も更新
    const reservation = await prisma.$transaction(async (tx) => {
      // 顧客情報を更新
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          name: customerName,
          phone: customerPhone,
        },
      });

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

      await tx.reservationItem.createMany({
        data: menus.map((menu, index) => ({
          reservationId: newReservation.id,
          menuId: menu.id,
          menuName: menu.name,
          category: menu.category.name,
          price: menu.price,
          duration: menu.duration,
          orderIndex: index,
        })),
      });

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

    // 予約完了メール送信（並列で実行し、完了を待つ）
    const emailPromises: Promise<{ success: boolean; error?: string }>[] = [];

    if (reservation?.user?.email) {
      emailPromises.push(
        sendReservationConfirmationEmail(reservation.user.email, {
          reservationId: reservation.id,
          customerName: reservation.user.name || 'お客様',
          date: new Date(reservation.date),
          startTime: reservation.startTime,
          endTime: reservation.endTime,
          menuSummary: reservation.menuSummary,
          totalPrice: reservation.totalPrice,
          couponDiscount: reservation.couponDiscount,
          note: reservation.note || undefined,
        }).catch((err) => {
          console.error('Failed to send reservation confirmation email:', err);
          return { success: false, error: String(err) };
        })
      );
    }

    // 管理者への新規予約通知メール
    if (reservation) {
      emailPromises.push(
        sendAdminNewReservationEmail({
          reservationId: reservation.id,
          customerName: reservation.user?.name || 'お客様',
          customerEmail: reservation.user?.email,
          customerPhone: customerPhone || null,
          date: new Date(reservation.date),
          startTime: reservation.startTime,
          endTime: reservation.endTime,
          menuSummary: reservation.menuSummary,
          totalPrice: reservation.totalPrice,
          note: reservation.note,
          isPhoneReservation: false,
        }).catch((err) => {
          console.error('Failed to send admin notification email:', err);
          return { success: false, error: String(err) };
        })
      );
    }

    // すべてのメール送信を待つ（エラー時もAPIは成功扱い）
    await Promise.all(emailPromises);

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
