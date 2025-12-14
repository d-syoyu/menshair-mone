// src/app/api/reservations/[id]/route.ts
// MONË - Individual Reservation API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canCancelReservation } from "@/constants/booking";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/reservations/[id] - 予約詳細取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
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
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "予約が見つかりません" },
        { status: 404 }
      );
    }

    // 顧客は自分の予約のみ閲覧可能
    if (
      session.user.role !== "ADMIN" &&
      reservation.userId !== session.user.id
    ) {
      return NextResponse.json({ error: "アクセス権限がありません" }, { status: 403 });
    }

    return NextResponse.json({ reservation });
  } catch (error) {
    console.error("Get reservation error:", error);
    return NextResponse.json(
      { error: "予約情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PATCH /api/reservations/[id] - 予約ステータス更新（管理者用）
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!["CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"].includes(status)) {
      return NextResponse.json(
        { error: "無効なステータスです" },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "予約が見つかりません" },
        { status: 404 }
      );
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "予約ステータスを更新しました",
      reservation: updatedReservation,
    });
  } catch (error) {
    console.error("Update reservation error:", error);
    return NextResponse.json(
      { error: "予約の更新に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE /api/reservations/[id] - 予約キャンセル
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { id } = await params;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "予約が見つかりません" },
        { status: 404 }
      );
    }

    // 顧客は自分の予約のみキャンセル可能
    if (
      session.user.role !== "ADMIN" &&
      reservation.userId !== session.user.id
    ) {
      return NextResponse.json({ error: "アクセス権限がありません" }, { status: 403 });
    }

    // 既にキャンセル済みの場合
    if (reservation.status === "CANCELLED") {
      return NextResponse.json(
        { error: "この予約は既にキャンセルされています" },
        { status: 400 }
      );
    }

    // 完了済みの場合
    if (reservation.status === "COMPLETED") {
      return NextResponse.json(
        { error: "完了済みの予約はキャンセルできません" },
        { status: 400 }
      );
    }

    // キャンセル期限チェック（顧客のみ、管理者はいつでもキャンセル可能）
    if (session.user.role !== "ADMIN") {
      if (!canCancelReservation(reservation.date)) {
        return NextResponse.json(
          {
            error:
              "キャンセル期限を過ぎています。お電話でお問い合わせください。",
          },
          { status: 400 }
        );
      }
    }

    // キャンセル処理
    const cancelledReservation = await prisma.reservation.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    // TODO: キャンセル確認メール送信

    return NextResponse.json({
      message: "予約をキャンセルしました",
      reservation: cancelledReservation,
    });
  } catch (error) {
    console.error("Cancel reservation error:", error);
    return NextResponse.json(
      { error: "予約のキャンセルに失敗しました" },
      { status: 500 }
    );
  }
}
