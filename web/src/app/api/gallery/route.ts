// src/app/api/gallery/route.ts
// Gallery items API

import { NextResponse } from "next/server";
import { getCachedGalleryItems } from "@/lib/notion-public-cache";

export const revalidate = 86400; // 内容の変更は cron / webhook のタグ破棄で即時に反映。これは1日ごとの予備

export async function GET() {
  try {
    const items = await getCachedGalleryItems();
    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching gallery items:", error);
    return NextResponse.json(
      { error: "ギャラリーの取得に失敗しました" },
      { status: 500 }
    );
  }
}
