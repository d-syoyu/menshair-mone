// src/app/api/admin/menus/route.ts
// Hair Salon White - Menus Admin API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

// メニュー作成スキーマ
const createMenuSchema = z.object({
  name: z.string().min(1, "メニュー名は必須です"),
  categoryId: z.string().min(1, "カテゴリは必須です"),
  price: z.number().int().positive("価格は正の整数で入力してください"),
  duration: z.number().int().positive("所要時間は正の整数で入力してください"),
  lastBookingTime: z.string().regex(/^\d{2}:\d{2}$/, "時間の形式が正しくありません（例: 19:00）"),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

// GET /api/admin/menus - メニュー一覧取得
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get("categoryId");
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where: { categoryId?: string; isActive?: boolean } = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (!includeInactive) {
      where.isActive = true;
    }

    const menus = await prisma.menu.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            color: true,
          },
        },
      },
      orderBy: [
        { category: { displayOrder: "asc" } },
        { displayOrder: "asc" },
      ],
    });

    return NextResponse.json(menus);
  } catch (error) {
    console.error("Get menus error:", error);
    return NextResponse.json(
      { error: "メニュー一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST /api/admin/menus - メニュー作成
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = createMenuSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, categoryId, price, duration, lastBookingTime, displayOrder, isActive } = validationResult.data;

    // カテゴリ存在チェック
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "指定されたカテゴリが見つかりません" },
        { status: 400 }
      );
    }

    const menu = await prisma.menu.create({
      data: {
        name,
        categoryId,
        price,
        duration,
        lastBookingTime,
        displayOrder,
        isActive,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            nameEn: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json(menu, { status: 201 });
  } catch (error) {
    console.error("Create menu error:", error);
    return NextResponse.json(
      { error: "メニューの作成に失敗しました" },
      { status: 500 }
    );
  }
}
