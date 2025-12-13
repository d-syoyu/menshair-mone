// src/app/api/admin/reservations/[id]/route.ts
// MONË - Reservation Edit API (Admin)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { getMenuById, calculateMenuTotals } from "@/constants/menu";

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

    const { menuIds, date, startTime, note, status } = validationResult.data;

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

    // 日時の更新
    const newDate = date ? new Date(date) : existingReservation.date;
    const newStartTime = startTime || existingReservation.startTime;

    if (date) {
      const reservationDate = new Date(date);
      reservationDate.setHours(0, 0, 0, 0);
      updateData.date = reservationDate;
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
