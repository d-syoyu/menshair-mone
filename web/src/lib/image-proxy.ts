// src/lib/image-proxy.ts
// Notion画像URLをプロキシURLに変換

/**
 * Notion画像URLをプロキシURLに変換
 * @param notionImageUrl - Notionの元画像URL
 * @returns プロキシ経由の永続的なURL
 */
export function getProxiedImageUrl(notionImageUrl: string | null): string | null {
  if (!notionImageUrl) return null;

  // すでにプロキシURLの場合はそのまま返す
  if (notionImageUrl.startsWith("/api/image-proxy")) {
    return notionImageUrl;
  }

  // Notion画像URLでない場合はそのまま返す
  const isNotionUrl =
    notionImageUrl.includes("prod-files-secure.s3.us-west-2.amazonaws.com") ||
    notionImageUrl.includes(".notion.so");

  if (!isNotionUrl) {
    return notionImageUrl;
  }

  // プロキシURL経由に変換
  const encodedUrl = encodeURIComponent(notionImageUrl);
  return `/api/image-proxy?url=${encodedUrl}`;
}
