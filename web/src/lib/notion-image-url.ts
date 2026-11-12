// src/lib/notion-image-url.ts
// Notion 画像の「変わらない配信URL」を作る（クライアントからも使うので Notion クライアントは読み込まない）。
// 配信は src/app/api/notion-image/[kind]/[id]/[version]/route.ts。

type NotionImageKind = "page" | "block";

export function buildNotionImageUrl(kind: NotionImageKind, id: string, lastEditedTime: string) {
  const compactId = id.replace(/-/g, "");
  const version = lastEditedTime.replace(/\D/g, "") || "0";
  return `/api/notion-image/${kind}/${compactId}/${version}`;
}

/** 記事本文の画像ブロック用 */
export function getStableBlockImageUrl(block: { id: string; last_edited_time: string }) {
  return buildNotionImageUrl("block", block.id, block.last_edited_time);
}
