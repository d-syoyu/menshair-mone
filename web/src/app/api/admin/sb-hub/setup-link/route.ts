// src/app/api/admin/sb-hub/setup-link/route.ts
// 「SBの設定を開く」：SOGAのSB設定画面に入る一度きりのリンクを出す（設計 3-4）。
// リンクは管理者のブラウザに返すだけで、保存もログ出力もしない。

import { NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth";
import { sameOriginRequest } from "@/lib/login-guard";
import { createSbSetupLink, sbHubEnabled } from "@/lib/sb-hub";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOriginRequest(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // 管理者のログインが新しい（12時間以内の）時だけ通る（auth.ts の jwt で古いログインは切れる）。
  const { error, user } = await checkAdminAuth();
  if (error) return error;
  if (!user) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  if (!sbHubEnabled()) return NextResponse.json({ error: "SB連携は設定されていません" }, { status: 404 });

  const url = await createSbSetupLink(user.email ?? user.id);
  if (!url) {
    return NextResponse.json({ error: "SOGAの設定画面を開けませんでした。少し時間をおいてもう一度お試しください" }, { status: 503 });
  }
  return NextResponse.json({ url }, { headers: { "Cache-Control": "no-store" } });
}
