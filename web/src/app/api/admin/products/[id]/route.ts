// src/app/api/admin/products/[id]/route.ts
// MONË Salon - Product Individual API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth";
import { z } from "zod";

// 商品更新スキーマ
const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  price: z.number().int().positive().optional(),
  cost: z.number().int().positive().nullable().optional(),
  stock: z.number().int().min(0).nullable().optional(),
  code: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// PUT /api/admin/products/[id] - 商品更新
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
    const validationResult = updateProductSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 商品存在チェック
    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "商品が見つかりません" },
        { status: 404 }
      );
    }

    // カテゴリ変更時の存在チェック
    if (data.categoryId) {
      const category = await prisma.productCategory.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        return NextResponse.json(
          { error: "指定されたカテゴリが見つかりません" },
          { status: 400 }
        );
      }
    }

    // 商品コード変更時の重複チェック
    if (data.code && data.code !== existing.code) {
      const duplicate = await prisma.product.findUnique({
        where: { code: data.code },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "同じ商品コードが既に存在します" },
          { status: 400 }
        );
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { error: "商品の更新に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products/[id] - 商品削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 管理者権限チェック
    const { error } = await checkAdminAuth();
    if (error) return error;

    const { id } = await params;

    // 商品存在チェック
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json(
        { error: "商品が見つかりません" },
        { status: 404 }
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ message: "商品を削除しました" });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { error: "商品の削除に失敗しました" },
      { status: 500 }
    );
  }
}
