// src/app/api/admin/discounts/[id]/route.ts
// MONË Salon - Discount Individual API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth";
import { z } from "zod";

// 割引更新スキーマ
const updateDiscountSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  value: z.number().int().positive().optional(),
  description: z.string().nullable().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// PUT /api/admin/discounts/[id] - 割引更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 管理者権限チェック
    const { error } = await checkAdminAuth();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const validationResult = updateDiscountSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 割引存在チェック
    const existing = await prisma.discount.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "割引が見つかりません" },
        { status: 404 }
      );
    }

    // パーセンテージ割引の場合は100%以下をチェック
    const type = data.type || existing.type;
    const value = data.value || existing.value;
    if (type === "PERCENTAGE" && value > 100) {
      return NextResponse.json(
        { error: "パーセンテージ割引は100%以下である必要があります" },
        { status: 400 }
      );
    }

    const discount = await prisma.discount.update({
      where: { id },
      data,
    });

    return NextResponse.json(discount);
  } catch (error) {
    console.error("Update discount error:", error);
    return NextResponse.json(
      { error: "割引の更新に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/discounts/[id] - 割引削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 管理者権限チェック
    const { error } = await checkAdminAuth();
    if (error) return error;

    const { id } = await params;

    // 割引存在チェック
    const discount = await prisma.discount.findUnique({
      where: { id },
    });

    if (!discount) {
      return NextResponse.json(
        { error: "割引が見つかりません" },
        { status: 404 }
      );
    }

    await prisma.discount.delete({
      where: { id },
    });

    return NextResponse.json({ message: "割引を削除しました" });
  } catch (error) {
    console.error("Delete discount error:", error);
    return NextResponse.json(
      { error: "割引の削除に失敗しました" },
      { status: 500 }
    );
  }
}
