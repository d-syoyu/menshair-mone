// src/app/api/notion-image/[kind]/[id]/[version]/route.ts
// Notion の公開画像を、変わらないURLで配信する。
//
// URL は「ページ（またはブロック）の ID」と「最終更新日時」で決まるので、内容が変わらない限り同じ。
// そのため CDN と next/image（縮小・WebP 化）のキャッシュがそのまま効く。
// キャッシュに無いときだけ、ここで Notion から最新の署名付きURLを取り直して画像を返す。
// 公開中のニュース・ギャラリー・商品のページにある画像以外は返さない。

import { NextResponse } from "next/server";
import { resolvePublicBlockImageUrl, resolvePublicPageImageUrl } from "@/lib/notion";

const NOTION_ID = /^[0-9a-f]{32}$/i;
const VERSION = /^\d{1,20}$/;
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

function notFound() {
  return new NextResponse("Not found", {
    status: 404,
    headers: { "Cache-Control": "public, max-age=300" },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string; id: string; version: string }> }
) {
  const { kind, id, version } = await params;

  if (!NOTION_ID.test(id) || !VERSION.test(version)) {
    return notFound();
  }

  try {
    const sourceUrl =
      kind === "page"
        ? await resolvePublicPageImageUrl(id)
        : kind === "block"
          ? await resolvePublicBlockImageUrl(id)
          : null;

    if (!sourceUrl || !/^https:\/\//i.test(sourceUrl)) {
      return notFound();
    }

    const upstream = await fetch(sourceUrl, { cache: "no-store" });
    const contentType = upstream.headers.get("content-type") ?? "";
    const contentLength = Number(upstream.headers.get("content-length") ?? "0");

    if (!upstream.ok || !upstream.body) {
      console.error(`[Notion Image] Upstream ${upstream.status} for ${kind}/${id}`);
      return new NextResponse("Failed to fetch image", {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      });
    }

    if (!contentType.startsWith("image/") || contentLength > MAX_IMAGE_BYTES) {
      return new NextResponse("Unsupported image", {
        status: 415,
        headers: { "Cache-Control": "no-store" },
      });
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // URL に最終更新日時が入っているので、同じURLの中身は変わらない
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    // Notion の 404（削除・権限なし）は存在しない扱い
    if (error && typeof error === "object" && "status" in error && error.status === 404) {
      return notFound();
    }
    console.error(`[Notion Image] Failed for ${kind}/${id}:`, error);
    return new NextResponse("Internal Server Error", {
      status: 500,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
