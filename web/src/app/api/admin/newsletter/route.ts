// src/app/api/admin/newsletter/route.ts
// ニュースレター一覧API（管理画面用）

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getNewsWithStatus } from "@/lib/notion";

// GET /api/admin/newsletter
// Notionからニュース一覧を取得（ステータス・配信先付き）
export async function GET() {
  try {
    // 管理者認証チェック
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const news = await getNewsWithStatus();

    return NextResponse.json({
      success: true,
      news,
    });
  } catch (error) {
    console.error("[Newsletter API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
