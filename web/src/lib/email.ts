// src/lib/email.ts
// MONË - Email Utility using Resend

import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = "Men's hair MONE <noreply@mone0601.com>";
const SALON_NAME = "MONË";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  if (!resend) {
    console.error('Resend API key not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: String(error) };
  }
}

// ニュースレター用のHTMLテンプレート
export function createNewsletterHtml(news: {
  title: string;
  subtitle?: string;
  excerpt?: string;
  slug: string;
  publishedAt?: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mone0601.com';
  const newsUrl = `${siteUrl}/news/${news.slug}`;

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${news.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a1a; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">

          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; background-color: #242424; border-bottom: 1px solid #3a3a3a;">
              <h1 style="margin: 0; color: #c4a77d; font-size: 24px; font-weight: 300; letter-spacing: 4px;">
                ${SALON_NAME}
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px; background-color: #242424;">
              <p style="margin: 0 0 20px; color: #c4a77d; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">
                お知らせ
              </p>

              <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 22px; font-weight: 500; line-height: 1.4;">
                ${news.title}
              </h2>

              ${news.subtitle ? `
              <p style="margin: 0 0 24px; color: #b0b0b0; font-size: 15px; line-height: 1.6;">
                ${news.subtitle}
              </p>
              ` : ''}

              ${news.excerpt ? `
              <p style="margin: 0 0 30px; color: #888888; font-size: 14px; line-height: 1.8;">
                ${news.excerpt}
              </p>
              ` : ''}

              ${news.publishedAt ? `
              <p style="margin: 0 0 30px; color: #666666; font-size: 12px;">
                ${news.publishedAt}
              </p>
              ` : ''}

              <a href="${newsUrl}" style="display: inline-block; padding: 14px 32px; background-color: #4a7c59; color: #ffffff; text-decoration: none; font-size: 14px; letter-spacing: 1px; border-radius: 0;">
                詳細を見る
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #1f1f1f; border-top: 1px solid #3a3a3a;">
              <p style="margin: 0 0 10px; color: #888888; font-size: 12px; line-height: 1.6;">
                ${SALON_NAME}<br>
                〒570-0028 大阪府守口市本町2丁目1-15 ミリオンコーポ守口 2階<br>
                Tel: 06-6908-4859
              </p>
              <p style="margin: 0; color: #666666; font-size: 11px;">
                このメールはサロンからのお知らせです。
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// プレーンテキスト版
export function createNewsletterText(news: {
  title: string;
  subtitle?: string;
  excerpt?: string;
  slug: string;
  publishedAt?: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mone0601.com';
  const newsUrl = `${siteUrl}/news/${news.slug}`;

  let text = `${SALON_NAME} からのお知らせ\n\n`;
  text += `${news.title}\n`;
  if (news.subtitle) text += `${news.subtitle}\n`;
  text += '\n';
  if (news.excerpt) text += `${news.excerpt}\n\n`;
  if (news.publishedAt) text += `${news.publishedAt}\n\n`;
  text += `詳細はこちら: ${newsUrl}\n\n`;
  text += `---\n`;
  text += `${SALON_NAME}\n`;
  text += `〒570-0028 大阪府守口市本町2丁目1-15 ミリオンコーポ守口 2階\n`;
  text += `Tel: 06-6908-4859\n`;

  return text;
}
