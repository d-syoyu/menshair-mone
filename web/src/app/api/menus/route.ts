// src/app/api/menus/route.ts
// MONË Salon - 公開用メニューAPI

import { NextResponse } from "next/server";
import { getCachedBookingMenus } from "@/lib/menu-cache";

// GET /api/menus - 有効なメニュー一覧を取得（公開API）
// キャッシュ（タグ menus）から返す。管理画面でメニューを変えると破棄される。
export async function GET() {
  try {
    return NextResponse.json(await getCachedBookingMenus());
  } catch (error) {
    console.error("Get menus error:", error);
    return NextResponse.json(
      { error: "メニューの取得に失敗しました" },
      { status: 500 }
    );
  }
}
