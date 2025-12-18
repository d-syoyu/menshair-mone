// src/app/api/admin/categories/[id]/route.ts
// MONË - Single Category Admin API

import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { syncNewsletterTargetOptions } from "@/lib/notion";
import { MENU_CACHE_TAG } from "@/lib/menu-cache";

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

// カテゴリ更新スキーマ
const updateCategorySchema = z.object({
  name: z.string().min(1, "カテゴリ名は必須です").optional(),
  nameEn: z.string().min(1, "英語名は必須です").optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "カラーコードの形式が正しくありません").optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/admin/categories/[id] - カテゴリ詳細取得
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

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        menus: {
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "カテゴリが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Get category error:", error);
    return NextResponse.json(
      { error: "カテゴリの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/categories/[id] - カテゴリ更新
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
    const validationResult = updateCategorySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    // カテゴリ存在チェック
    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "カテゴリが見つかりません" },
        { status: 404 }
      );
    }

    // 名前変更時の重複チェック
    if (validationResult.data.name && validationResult.data.name !== existing.name) {
      const duplicate = await prisma.category.findUnique({
        where: { name: validationResult.data.name },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "同じ名前のカテゴリが既に存在します" },
          { status: 400 }
        );
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: validationResult.data,
    });

    // メニューキャッシュを無効化
    revalidateTag(MENU_CACHE_TAG, "max");

    // 名前またはisActiveが変更された場合、Notion配信先オプションを同期
    if (validationResult.data.name !== undefined || validationResult.data.isActive !== undefined) {
      syncNewsletterOptionsBackground();
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Update category error:", error);
    return NextResponse.json(
      { error: "カテゴリの更新に失敗しました" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/categories/[id] - カテゴリ削除
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

    // カテゴリ存在チェック
    const existing = await prisma.category.findUnique({
      where: { id },
      include: {
        menus: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "カテゴリが見つかりません" },
        { status: 404 }
      );
    }

    // アクティブなメニューがある場合は削除不可
    if (existing.menus.length > 0) {
      return NextResponse.json(
        { error: "このカテゴリには有効なメニューが存在するため削除できません" },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    // メニューキャッシュを無効化
    revalidateTag(MENU_CACHE_TAG, "max");

    // Notion配信先オプションを同期（削除されたカテゴリのオプションを削除）
    syncNewsletterOptionsBackground();

    return NextResponse.json({ message: "カテゴリを削除しました" });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json(
      { error: "カテゴリの削除に失敗しました" },
      { status: 500 }
    );
  }
}
