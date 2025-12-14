// src/app/api/products/route.ts
// Products list API

import { NextResponse } from "next/server";
import { getProducts } from "@/lib/notion";

export const revalidate = 60; // Revalidate every 60 seconds

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
