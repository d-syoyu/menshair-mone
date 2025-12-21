// src/app/api/admin/business-settings/route.ts
// MONË - Business Settings API (定休日設定など)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

// 営業設定更新スキーマ
const updateBusinessSettingsSchema = z.object({
  closedDays: z.array(z.number().min(0).max(6)), // 0=日, 1=月, ..., 6=土
});

// GET /api/admin/business-settings - 営業設定取得
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    // 定休日設定を取得
    const closedDaysSetting = await prisma.settings.findUnique({
      where: { key: "closed_days" },
    });

    // デフォルトは月曜日
    const closedDays = closedDaysSetting
      ? JSON.parse(closedDaysSetting.value)
      : [1];

    return NextResponse.json({
      closedDays,
    });
  } catch (error) {
    console.error("Get business settings error:", error);
    return NextResponse.json(
      { error: "営業設定の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/business-settings - 営業設定更新
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = updateBusinessSettingsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { closedDays } = validationResult.data;

    // upsert で定休日設定を更新
    await prisma.settings.upsert({
      where: { key: "closed_days" },
      update: { value: JSON.stringify(closedDays) },
      create: { key: "closed_days", value: JSON.stringify(closedDays) },
    });

    return NextResponse.json({
      closedDays,
      message: "営業設定を更新しました",
    });
  } catch (error) {
    console.error("Update business settings error:", error);
    return NextResponse.json(
      { error: "営業設定の更新に失敗しました" },
      { status: 500 }
    );
  }
}
