// src/app/api/news/[slug]/route.ts
// News detail API

import { NextResponse } from "next/server";
import { getNewsBySlug } from "@/lib/notion";

export const revalidate = 60; // Revalidate every 60 seconds

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const post = await getNewsBySlug(slug);

    if (!post) {
      return NextResponse.json(
        { error: "お知らせが見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "お知らせの取得に失敗しました" },
      { status: 500 }
    );
  }
}
