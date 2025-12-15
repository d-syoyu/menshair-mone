// src/app/api/admin/sync-newsletter-options/route.ts
// カテゴリをNotionのニュースレター配信先オプションに同期

import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth";
import { syncNewsletterTargetOptions } from "@/lib/notion";
import { getActiveCategories } from "@/lib/customer-filter";

// POST /api/admin/sync-newsletter-options
// DBのカテゴリをNotionのマルチセレクトオプションに同期
export async function POST() {
  // 管理者認証チェック
  const { error } = await checkAdminAuth();
  if (error) return error;

  try {
    // DBからアクティブなカテゴリを取得
    const categories = await getActiveCategories();

    if (categories.length === 0) {
      return NextResponse.json({
        success: true,
        message: "同期するカテゴリがありません",
        categories: [],
        added: [],
      });
    }

    // Notionに同期
    const result = await syncNewsletterTargetOptions(categories);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.added.length > 0
        ? `${result.added.length}件のオプションを追加しました`
        : "すべてのオプションは既に同期済みです",
      categories: categories.map((c) => c.name),
      added: result.added,
    });
  } catch (error) {
    console.error("[Sync Newsletter Options] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "同期中にエラーが発生しました",
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/sync-newsletter-options
// 現在のカテゴリ一覧を取得
export async function GET() {
  // 管理者認証チェック
  const { error } = await checkAdminAuth();
  if (error) return error;

  try {
    const categories = await getActiveCategories();

    return NextResponse.json({
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        options: [
          `${c.name}利用あり`,
          `${c.name}利用なし`,
        ],
      })),
    });
  } catch (error) {
    console.error("[Get Categories] Error:", error);
    return NextResponse.json(
      {
        error: "カテゴリの取得に失敗しました",
      },
      { status: 500 }
    );
  }
}
