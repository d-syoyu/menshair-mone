// src/app/api/image-proxy/route.ts
// Notion画像をプロキシして永続的に配信

import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge"; // Edge Runtimeで高速化

export async function GET(request: NextRequest) {
  try {
    // URLパラメータから元の画像URLを取得
    const imageUrl = request.nextUrl.searchParams.get("url");

    if (!imageUrl) {
      return new NextResponse("Image URL is required", { status: 400 });
    }

    // Notion画像URLのみを許可（セキュリティ対策）
    const isNotionUrl =
      imageUrl.includes("prod-files-secure.s3.us-west-2.amazonaws.com") ||
      imageUrl.includes(".notion.so");

    if (!isNotionUrl) {
      return new NextResponse("Invalid image URL", { status: 403 });
    }

    // 画像を取得
    const response = await fetch(imageUrl, {
      // Notion APIからの画像取得にはヘッダーが必要な場合がある
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!response.ok) {
      return new NextResponse("Failed to fetch image", { status: 502 });
    }

    // 画像データを取得
    const imageBuffer = await response.arrayBuffer();

    // Content-Typeを取得（画像形式を保持）
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // 長期間キャッシュするヘッダーを設定
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable", // 1年間キャッシュ
        "CDN-Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error) {
    console.error("Error in image proxy:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
