// src/app/api/admin/categories/route.ts
// MONË - Categories Admin API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { syncNewsletterTargetOptions } from "@/lib/notion";

// Notion配信先オプション同期（バックグラウンド実行）
async function syncNewsletterOptionsBackground() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { displayOrder: "asc" },
    });
    const result = await syncNewsletterTargetOptions(categories);
    if (result.success) {
      console.log(`[Category API] Notion同期完了: 追加${result.added.length}件, 削除${result.removed.length}件`);
    } else {
      console.warn(`[Category API] Notion同期失敗: ${result.error}`);
    }
  } catch (error) {
    console.error("[Category API] Notion同期エラー:", error);
  }
}

// カテゴリ作成スキーマ
const createCategorySchema = z.object({
  name: z.string().min(1, "カテゴリ名は必須です"),
  nameEn: z.string().min(1, "英語名は必須です"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "カラーコードの形式が正しくありません"),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

// GET /api/admin/categories - カテゴリ一覧取得
export async function GET() {
  try {
    const session = await auth();
    console.log('[Categories API] Session:', { exists: !!session, user: session?.user });

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const categories = await prisma.category.findMany({
      include: {
        menus: {
          where: { isActive: true },
          select: { id: true },
        },
      },
      orderBy: { displayOrder: "asc" },
    });

    // メニュー数を追加
    const categoriesWithCount = categories.map((cat) => ({
      ...cat,
      menuCount: cat.menus.length,
      menus: undefined,
    }));

    return NextResponse.json(categoriesWithCount);
  } catch (error) {
    console.error("Get categories error:", error);
    return NextResponse.json(
      { error: "カテゴリ一覧の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// POST /api/admin/categories - カテゴリ作成
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = createCategorySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, nameEn, color, displayOrder, isActive } = validationResult.data;

    // 同名カテゴリチェック
    const existing = await prisma.category.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "同じ名前のカテゴリが既に存在します" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name,
        nameEn,
        color,
        displayOrder,
        isActive,
      },
    });

    // Notion配信先オプションを自動同期（バックグラウンドで実行）
    syncNewsletterOptionsBackground();

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json(
      { error: "カテゴリの作成に失敗しました" },
      { status: 500 }
    );
  }
}
