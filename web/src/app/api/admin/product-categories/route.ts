// src/app/api/admin/product-categories/route.ts
// MONË Salon - Product Categories Admin API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth";
import { z } from "zod";

// 商品カテゴリ作成スキーマ
const createProductCategorySchema = z.object({
  name: z.string().min(1, "カテゴリ名は必須です"),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

// GET /api/admin/product-categories - 商品カテゴリ一覧取得
export async function GET() {
  try {
    // 管理者権限チェック
    const { error } = await checkAdminAuth();
    if (error) return error;

    const categories = await prisma.productCategory.findMany({
      include: {
        products: {
          where: { isActive: true },
          select: { id: true },
        },
      },
      orderBy: { displayOrder: "asc" },
    });

    // 商品数を追加
    const categoriesWithCount = categories.map((cat) => ({
      ...cat,
      productCount: cat.products.length,
      products: undefined,
    }));

    return NextResponse.json(categoriesWithCount);
  } catch (error) {
    console.error("Get product categories error:", error);
    return NextResponse.json(
      { error: "商品カテゴリ一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST /api/admin/product-categories - 商品カテゴリ作成
export async function POST(request: NextRequest) {
  try {
    // 管理者権限チェック
    const { error } = await checkAdminAuth();
    if (error) return error;

    const body = await request.json();
    const validationResult = createProductCategorySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, displayOrder, isActive } = validationResult.data;

    // 同名カテゴリチェック
    const existing = await prisma.productCategory.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "同じ名前のカテゴリが既に存在します" },
        { status: 400 }
      );
    }

    const category = await prisma.productCategory.create({
      data: {
        name,
        displayOrder,
        isActive,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Create product category error:", error);
    return NextResponse.json(
      { error: "商品カテゴリの作成に失敗しました" },
      { status: 500 }
    );
  }
}
