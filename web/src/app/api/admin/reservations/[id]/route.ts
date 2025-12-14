// src/app/api/admin/reservations/[id]/route.ts
// MONË - Reservation Edit API (Admin)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { getMenuById, calculateMenuTotals } from "@/constants/menu";
import { parseLocalDate } from "@/lib/date-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// 予約更新スキーマ
const updateReservationSchema = z.object({
  menuIds: z.array(z.string()).min(1, "メニューを1つ以上選択してください").optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付の形式が正しくありません").optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "時間の形式が正しくありません").optional(),
  note: z.string().optional().nullable(),
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]).optional(),
  couponCode: z.string().max(50, "クーポンコードは50文字以内で入力してください").optional().nullable(),
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

// GET /api/admin/reservations/[id] - 予約詳細取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const { id } = await params;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
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
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "予約が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(reservation);
  } catch (error) {
    console.error("Get reservation error:", error);
    return NextResponse.json(
      { error: "予約情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/reservations/[id] - 予約更新
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validationResult = updateReservationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { menuIds, date, startTime, note, status, couponCode } = validationResult.data;

    // 予約が存在するか確認
    const existingReservation = await prisma.reservation.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingReservation) {
      return NextResponse.json(
        { error: "予約が見つかりません" },
        { status: 404 }
      );
    }

    // 更新データを構築
    const updateData: {
      date?: Date;
      startTime?: string;
      endTime?: string;
      totalPrice?: number;
      totalDuration?: number;
      menuSummary?: string;
      note?: string | null;
      status?: "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
      couponId?: string | null;
      couponCode?: string | null;
      couponDiscount?: number;
    } = {};

    // メニューが変更された場合
    let newMenus: { id: string; name: string; category: string; price: number; duration: number }[] | null = null;
    let totalDuration = existingReservation.totalDuration;

    if (menuIds) {
      const menus = menuIds
        .map((menuId) => getMenuById(menuId))
        .filter((m): m is NonNullable<typeof m> => m !== undefined);

      if (menus.length !== menuIds.length) {
        return NextResponse.json(
          { error: "無効なメニューが含まれています" },
          { status: 400 }
        );
      }

      const totals = calculateMenuTotals(menuIds);
      updateData.totalPrice = totals.totalPrice;
      updateData.totalDuration = totals.totalDuration;
      updateData.menuSummary = totals.menuSummary;
      totalDuration = totals.totalDuration;
      newMenus = menus;
    }

    // 日時の更新（タイムゾーン対応）
    const newDate = date ? parseLocalDate(date) : existingReservation.date;
    const newStartTime = startTime || existingReservation.startTime;

    if (date) {
      updateData.date = parseLocalDate(date);
    }

    if (startTime) {
      updateData.startTime = startTime;
    }

    // 終了時間を再計算（日時またはメニューが変更された場合）
    if (startTime || menuIds) {
      const startMinutes = timeToMinutes(newStartTime);
      const endMinutes = startMinutes + totalDuration;
      updateData.endTime = minutesToTime(endMinutes);
    }

    // 備考の更新
    if (note !== undefined) {
      updateData.note = note;
    }

    // ステータスの更新
    if (status) {
      updateData.status = status;
    }

    // 日時が変更された場合、重複チェック
    if (date || startTime || menuIds) {
      const checkDate = updateData.date || existingReservation.date;
      const checkStartTime = updateData.startTime || existingReservation.startTime;
      const checkEndTime = updateData.endTime || existingReservation.endTime;

      const conflictingReservation = await prisma.reservation.findFirst({
        where: {
          id: { not: id },
          date: checkDate,
          status: "CONFIRMED",
          OR: [
            {
              AND: [
                { startTime: { gte: checkStartTime } },
                { startTime: { lt: checkEndTime } },
              ],
            },
            {
              AND: [
                { endTime: { gt: checkStartTime } },
                { endTime: { lte: checkEndTime } },
              ],
            },
            {
              AND: [
                { startTime: { lte: checkStartTime } },
                { endTime: { gte: checkEndTime } },
              ],
            },
          ],
        },
      });

      if (conflictingReservation) {
        return NextResponse.json(
          { error: `この時間帯は既に予約があります（${conflictingReservation.startTime}〜${conflictingReservation.endTime}）` },
          { status: 409 }
        );
      }
    }

    // クーポン（任意）: 入力がある場合やメニュー変更時は割引額を再計算
    const effectiveTotalPrice = updateData.totalPrice ?? existingReservation.totalPrice;
    const nextCouponCode = couponCode !== undefined ? couponCode : existingReservation.couponCode ?? undefined;
    const effectiveDate = updateData.date || existingReservation.date;
    const effectiveStartTime = updateData.startTime || existingReservation.startTime;
    const effectiveWeekday = effectiveDate.getDay();
    const effectiveMenuIds = menuIds ?? existingReservation.items.map((i) => i.menuId);
    const effectiveCategories =
      newMenus?.map((m) => m.category) ?? existingReservation.items.map((i) => i.category);

    if (nextCouponCode !== undefined) {
      if (!nextCouponCode || nextCouponCode.trim() === "") {
        updateData.couponId = null;
        updateData.couponCode = null;
        updateData.couponDiscount = 0;
      } else {
        try {
          const { coupon, discount } = await validateCouponForReservation({
            code: nextCouponCode,
            subtotal: effectiveTotalPrice,
            customerId: existingReservation.userId,
            menuIds: effectiveMenuIds,
            categories: effectiveCategories,
            weekday: effectiveWeekday,
            time: effectiveStartTime,
          });
          updateData.couponId = coupon.id;
          updateData.couponCode = coupon.code;
          updateData.couponDiscount = discount;
        } catch (err) {
          const message = err instanceof Error ? err.message : "クーポンの検証に失敗しました";
          return NextResponse.json({ error: message }, { status: 400 });
        }
      }
    }

    // トランザクションで予約を更新
    const updatedReservation = await prisma.$transaction(async (tx) => {
      // メニューが変更された場合、既存のアイテムを削除して新規作成
      if (newMenus) {
        await tx.reservationItem.deleteMany({
          where: { reservationId: id },
        });

        await tx.reservationItem.createMany({
          data: newMenus.map((menu, index) => ({
            reservationId: id,
            menuId: menu.id,
            menuName: menu.name,
            category: menu.category,
            price: menu.price,
            duration: menu.duration,
            orderIndex: index,
          })),
        });
      }

      // 予約本体を更新
      return tx.reservation.update({
        where: { id },
        data: updateData,
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
      });
    });

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error("Update reservation error:", error);
    return NextResponse.json(
      { error: "予約の更新に失敗しました" },
      { status: 500 }
    );
  }
}
