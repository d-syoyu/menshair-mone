// src/app/api/admin/products/route.ts
// MONË Salon - Products Admin API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth";
import { z } from "zod";

// 商品作成スキーマ
const createProductSchema = z.object({
  name: z.string().min(1, "商品名は必須です"),
  categoryId: z.string().min(1, "カテゴリは必須です"),
  price: z.number().int().positive("価格は正の整数である必要があります"),
  cost: z.number().int().positive().optional(),
  stock: z.number().int().min(0).optional(),
  code: z.string().optional(),
  description: z.string().optional(),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

// GET /api/admin/products - 商品一覧取得
export async function GET(request: NextRequest) {
  try {
    // 管理者権限チェック
    const { error } = await checkAdminAuth();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where: any = {};
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (!includeInactive) {
      where.isActive = true;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { category: { displayOrder: "asc" } },
        { displayOrder: "asc" },
      ],
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Get products error:", error);
    return NextResponse.json(
      { error: "商品一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST /api/admin/products - 商品作成
export async function POST(request: NextRequest) {
  try {
    // 管理者権限チェック
    const { error } = await checkAdminAuth();
    if (error) return error;

    const body = await request.json();
    const validationResult = createProductSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // カテゴリ存在チェック
    const category = await prisma.productCategory.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "指定されたカテゴリが見つかりません" },
        { status: 400 }
      );
    }

    // 商品コード重複チェック（指定時）
    if (data.code) {
      const existing = await prisma.product.findUnique({
        where: { code: data.code },
      });

      if (existing) {
        return NextResponse.json(
          { error: "同じ商品コードが既に存在します" },
          { status: 400 }
        );
      }
    }

    const product = await prisma.product.create({
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

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: "商品の作成に失敗しました" },
      { status: 500 }
    );
  }
}
