// src/app/api/products/route.ts
// Products list API

import { NextResponse } from "next/server";
import { getProducts } from "@/lib/notion";

// 動的レンダリング（キャッシュなし）
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const products = await getProducts();
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "商品の取得に失敗しました" },
      { status: 500 }
    );
  }
}
