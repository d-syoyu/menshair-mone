// src/app/api/admin/reservations/route.ts
// MONË - Reservations Admin API (電話予約対応)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { MENUS, getMenuById, calculateMenuTotals } from "@/constants/menu";
import { parseLocalDate } from "@/lib/date-utils";

// 予約作成スキーマ
const createReservationSchema = z.object({
  userId: z.string().min(1, "顧客IDは必須です"),
  menuIds: z.array(z.string()).min(1, "メニューを1つ以上選択してください"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付の形式が正しくありません（例: 2024-01-15）"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "時間の形式が正しくありません（例: 10:00）"),
  note: z.string().optional(),
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
    const where: any = {};

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

    const { userId, menuIds, date, startTime, note } = validationResult.data;

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

    // メニュー情報を取得
    const menus = menuIds
      .map((id) => getMenuById(id))
      .filter((m): m is NonNullable<typeof m> => m !== undefined);

    if (menus.length !== menuIds.length) {
      return NextResponse.json(
        { error: "無効なメニューが含まれています" },
        { status: 400 }
      );
    }

    // 合計計算
    const { totalPrice, totalDuration, menuSummary } = calculateMenuTotals(menuIds);

    // 終了時間を計算
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + totalDuration;
    const endTime = minutesToTime(endMinutes);

    // 予約日時を作成（タイムゾーン対応）
    const reservationDate = parseLocalDate(date);

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
        status: "CONFIRMED",
        note: note || null,
        items: {
          create: menus.map((menu, index) => ({
            menuId: menu.id,
            menuName: menu.name,
            category: menu.category,
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
