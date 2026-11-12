// src/app/api/products/route.ts
// Products list API

import { NextResponse } from "next/server";
import { getCachedProducts } from "@/lib/notion-public-cache";

export const revalidate = 86400; // 内容の変更は cron / webhook のタグ破棄で即時に反映。これは1日ごとの予備

export async function GET() {
  try {
    const products = await getCachedProducts();
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "商品の取得に失敗しました" },
      { status: 500 }
    );
  }
}
