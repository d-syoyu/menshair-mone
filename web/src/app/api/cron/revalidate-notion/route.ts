// src/app/api/cron/revalidate-notion/route.ts
// Notion-backed public pages cache refresh.

import { NextRequest, NextResponse } from "next/server";
import { revalidateNotionPublicContent } from "@/lib/notion-public-revalidation";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error("[Notion Revalidate Cron] Invalid authorization");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await revalidateNotionPublicContent({
      origin: request.nextUrl.origin,
      warm: true,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("[Notion Revalidate Cron] Error:", error);
    return NextResponse.json(
      { error: "Failed to revalidate Notion-backed pages" },
      { status: 500 }
    );
  }
}
