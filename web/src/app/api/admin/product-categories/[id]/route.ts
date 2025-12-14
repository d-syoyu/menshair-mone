// src/app/api/admin/product-categories/[id]/route.ts
// MONË Salon - Product Category Individual API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth";
import { z } from "zod";

// 商品カテゴリ更新スキーマ
const updateProductCategorySchema = z.object({
  name: z.string().min(1).optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// PUT /api/admin/product-categories/[id] - 商品カテゴリ更新
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
    const validationResult = updateProductCategorySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // カテゴリ存在チェック
    const existing = await prisma.productCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "カテゴリが見つかりません" },
        { status: 404 }
      );
    }

    // 名前変更時の重複チェック
    if (data.name && data.name !== existing.name) {
      const duplicate = await prisma.productCategory.findUnique({
        where: { name: data.name },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "同じ名前のカテゴリが既に存在します" },
          { status: 400 }
        );
      }
    }

    const category = await prisma.productCategory.update({
      where: { id },
      data,
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Update product category error:", error);
    return NextResponse.json(
      { error: "商品カテゴリの更新に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/product-categories/[id] - 商品カテゴリ削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 管理者権限チェック
    const { error } = await checkAdminAuth();
    if (error) return error;

    const { id } = await params;

    // カテゴリ存在チェック
    const category = await prisma.productCategory.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "カテゴリが見つかりません" },
        { status: 404 }
      );
    }

    // 商品が紐付いている場合は削除不可
    if (category.products.length > 0) {
      return NextResponse.json(
        { error: "このカテゴリに商品が登録されているため削除できません" },
        { status: 400 }
      );
    }

    await prisma.productCategory.delete({
      where: { id },
    });

    return NextResponse.json({ message: "商品カテゴリを削除しました" });
  } catch (error) {
    console.error("Delete product category error:", error);
    return NextResponse.json(
      { error: "商品カテゴリの削除に失敗しました" },
      { status: 500 }
    );
  }
}
