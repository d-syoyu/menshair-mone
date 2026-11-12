// src/app/api/news/route.ts
// News list API

import { NextResponse } from "next/server";
import { getCachedNews } from "@/lib/notion-public-cache";

export const revalidate = 86400; // 内容の変更は cron / webhook のタグ破棄で即時に反映。これは1日ごとの予備

export async function GET() {
  try {
    const news = await getCachedNews();
    return NextResponse.json(news);
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "お知らせの取得に失敗しました" },
      { status: 500 }
    );
  }
}
