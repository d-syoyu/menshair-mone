// src/app/api/admin/discounts/route.ts
// MONË Salon - Discounts Admin API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth";
import { z } from "zod";

// 割引作成スキーマ
const createDiscountSchema = z.object({
  name: z.string().min(1, "割引名は必須です"),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().int().positive("割引値は正の整数である必要があります"),
  description: z.string().optional(),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

// GET /api/admin/discounts - 割引一覧取得
export async function GET(request: NextRequest) {
  try {
    // 管理者権限チェック
    const { error } = await checkAdminAuth();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where: Record<string, unknown> = {};
    if (!includeInactive) {
      where.isActive = true;
    }

    const discounts = await prisma.discount.findMany({
      where,
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json(discounts);
  } catch (error) {
    console.error("Get discounts error:", error);
    return NextResponse.json(
      { error: "割引一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST /api/admin/discounts - 割引作成
export async function POST(request: NextRequest) {
  try {
    // 管理者権限チェック
    const { error } = await checkAdminAuth();
    if (error) return error;

    const body = await request.json();
    const validationResult = createDiscountSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // パーセンテージ割引の場合は100%以下をチェック
    if (data.type === "PERCENTAGE" && data.value > 100) {
      return NextResponse.json(
        { error: "パーセンテージ割引は100%以下である必要があります" },
        { status: 400 }
      );
    }

    const discount = await prisma.discount.create({
      data,
    });

    return NextResponse.json(discount, { status: 201 });
  } catch (error) {
    console.error("Create discount error:", error);
    return NextResponse.json(
      { error: "割引の作成に失敗しました" },
      { status: 500 }
    );
  }
}
