// src/app/api/gallery/route.ts
// Gallery items API

import { NextResponse } from "next/server";
import { getGalleryItems } from "@/lib/notion";

// 動的レンダリング（キャッシュなし）
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const items = await getGalleryItems();
    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching gallery items:", error);
    return NextResponse.json(
      { error: "ギャラリーの取得に失敗しました" },
      { status: 500 }
    );
  }
}
