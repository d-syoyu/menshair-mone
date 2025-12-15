// src/app/api/admin/settings/route.ts
// MONË Salon - Settings Admin API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth";
import { z } from "zod";

// 設定更新スキーマ
const updateSettingsSchema = z.object({
  tax_rate: z.number().int().min(0).max(100).optional(),
});

// GET /api/admin/settings - 設定取得
export async function GET() {
  try {
    // 管理者権限チェック
    const { error } = await checkAdminAuth();
    if (error) return error;

    const settings = await prisma.settings.findMany();

    // キーバリュー形式に変換
    const settingsObject = settings.reduce<Record<string, string>>((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    return NextResponse.json(settingsObject);
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { error: "設定の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - 設定更新
export async function PUT(request: NextRequest) {
  try {
    // 管理者権限チェック
    const { error } = await checkAdminAuth();
    if (error) return error;

    const body = await request.json();
    const validationResult = updateSettingsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 税率更新
    if (data.tax_rate !== undefined) {
      await prisma.settings.upsert({
        where: { key: "tax_rate" },
        update: { value: data.tax_rate.toString() },
        create: { key: "tax_rate", value: data.tax_rate.toString() },
      });
    }

    // 更新後の設定を取得
    const settings = await prisma.settings.findMany();
    const settingsObject = settings.reduce<Record<string, string>>((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    return NextResponse.json(settingsObject);
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { error: "設定の更新に失敗しました" },
      { status: 500 }
    );
  }
}
