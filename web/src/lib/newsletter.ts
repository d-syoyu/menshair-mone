// src/lib/newsletter.ts
// ニュースレター関連ユーティリティ

import crypto from 'crypto';

const SECRET = process.env.AUTH_SECRET || 'newsletter-secret';

/**
 * メールアドレスから配信停止用トークンを生成
 * HMACを使用して署名（改ざん防止）
 */
export function generateUnsubscribeToken(email: string): string {
  const hmac = crypto.createHmac('sha256', SECRET);
  hmac.update(email.toLowerCase());
  return hmac.digest('hex');
}

/**
 * トークンを検証
 */
export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expectedToken = generateUnsubscribeToken(email);
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(expectedToken)
  );
}

/**
 * 配信停止リンクを生成
 */
export function generateUnsubscribeUrl(email: string): string {
  const token = generateUnsubscribeToken(email);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mone0601.com';
  const params = new URLSearchParams({
    email: email,
    token: token,
  });
  return `${siteUrl}/unsubscribe?${params.toString()}`;
}
