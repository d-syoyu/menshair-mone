// src/app/api/admin/menus/[id]/route.ts
// MONË - Single Menu Admin API

import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { MENU_CACHE_TAG } from "@/lib/menu-cache";

// メニュー更新スキーマ
const updateMenuSchema = z.object({
  name: z.string().min(1, "メニュー名は必須です").optional(),
  categoryId: z.string().min(1, "カテゴリは必須です").optional(),
  price: z.number().int().positive("価格は正の整数で入力してください").optional(),
  priceVariable: z.boolean().optional(), // 価格変動あり
  duration: z.number().int().nonnegative("所要時間は0以上の整数で入力してください").optional(),
  lastBookingTime: z.string().regex(/^\d{2}:\d{2}$/, "時間の形式が正しくありません（例: 19:00）").optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/admin/menus/[id] - メニュー詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const { id } = await params;

    const menu = await prisma.menu.findUnique({
      where: { id },
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

    if (!menu) {
      return NextResponse.json(
        { error: "メニューが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(menu);
  } catch (error) {
    console.error("Get menu error:", error);
    return NextResponse.json(
      { error: "メニューの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/menus/[id] - メニュー更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validationResult = updateMenuSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    // メニュー存在チェック
    const existing = await prisma.menu.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "メニューが見つかりません" },
        { status: 404 }
      );
    }

    // カテゴリ変更時の存在チェック
    if (validationResult.data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: validationResult.data.categoryId },
      });
      if (!category) {
        return NextResponse.json(
          { error: "指定されたカテゴリが見つかりません" },
          { status: 400 }
        );
      }
    }

    const menu = await prisma.menu.update({
      where: { id },
      data: validationResult.data,
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

    // メニューキャッシュを無効化
    revalidateTag(MENU_CACHE_TAG, "max");

    return NextResponse.json(menu);
  } catch (error) {
    console.error("Update menu error:", error);
    return NextResponse.json(
      { error: "メニューの更新に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/menus/[id] - メニュー削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const { id } = await params;

    // メニュー存在チェック
    const existing = await prisma.menu.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "メニューが見つかりません" },
        { status: 404 }
      );
    }

    await prisma.menu.delete({
      where: { id },
    });

    // メニューキャッシュを無効化
    revalidateTag(MENU_CACHE_TAG, "max");

    return NextResponse.json({ message: "メニューを削除しました" });
  } catch (error) {
    console.error("Delete menu error:", error);
    return NextResponse.json(
      { error: "メニューの削除に失敗しました" },
      { status: 500 }
    );
  }
}
