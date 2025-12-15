// src/app/api/news/route.ts
// News list API

import { NextResponse } from "next/server";
import { getNews } from "@/lib/notion";

// 動的レンダリング（キャッシュなし）
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const news = await getNews();
    return NextResponse.json(news);
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "お知らせの取得に失敗しました" },
      { status: 500 }
    );
  }
}
