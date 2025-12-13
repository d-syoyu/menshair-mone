// src/app/api/blog/route.ts
// Blog posts list API

import { NextResponse } from "next/server";
import { getBlogPosts } from "@/lib/notion";

export const revalidate = 60; // Revalidate every 60 seconds

export async function GET() {
  try {
    const posts = await getBlogPosts();
    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { error: "ブログ記事の取得に失敗しました" },
      { status: 500 }
    );
  }
}
