// src/lib/email.ts
// MONË - Email Utility using Resend

import { Resend } from 'resend';
import { SALON_INFO } from '@/constants/salon';
import { generateUnsubscribeUrl } from './newsletter';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = "Men's hair MONE <noreply@mone0601.com>";
const SALON_NAME = "MONË";
const SALON_ADDRESS = SALON_INFO.address;
const SALON_PHONE = SALON_INFO.phone;

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

// ニュースレター用のHTMLテンプレート（画像対応）
export function createNewsletterHtml(news: {
  title: string;
  subtitle?: string;
  excerpt?: string;
  slug: string;
  publishedAt?: string;
  coverImage?: string;
  recipientEmail?: string; // 配信停止リンク用
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mone0601.com';
  const newsUrl = `${siteUrl}/news/${news.slug}`;
  const unsubscribeUrl = news.recipientEmail ? generateUnsubscribeUrl(news.recipientEmail) : null;

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

          ${news.coverImage ? `
          <!-- Cover Image -->
          <tr>
            <td style="padding: 0; background-color: #242424;">
              <img src="${news.coverImage}" alt="${news.title}" style="width: 100%; max-width: 600px; height: auto; display: block;">
            </td>
          </tr>
          ` : ''}

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
                ${SALON_ADDRESS}<br>
                Tel: ${SALON_PHONE}
              </p>
              <p style="margin: 0; color: #666666; font-size: 11px;">
                このメールはサロンからのお知らせです。
              </p>
              ${unsubscribeUrl ? `
              <p style="margin: 15px 0 0; padding-top: 15px; border-top: 1px solid #333333;">
                <a href="${unsubscribeUrl}" style="color: #666666; font-size: 11px; text-decoration: underline;">
                  配信停止はこちら
                </a>
              </p>
              ` : ''}
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

// プレーンテキスト版（画像対応）
export function createNewsletterText(news: {
  title: string;
  subtitle?: string;
  excerpt?: string;
  slug: string;
  publishedAt?: string;
  coverImage?: string;
  recipientEmail?: string; // 配信停止リンク用
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mone0601.com';
  const newsUrl = `${siteUrl}/news/${news.slug}`;
  const unsubscribeUrl = news.recipientEmail ? generateUnsubscribeUrl(news.recipientEmail) : null;

  let text = `${SALON_NAME} からのお知らせ\n\n`;
  text += `${news.title}\n`;
  if (news.subtitle) text += `${news.subtitle}\n`;
  text += '\n';
  if (news.coverImage) text += `[画像] ${news.coverImage}\n\n`;
  if (news.excerpt) text += `${news.excerpt}\n\n`;
  if (news.publishedAt) text += `${news.publishedAt}\n\n`;
  text += `詳細はこちら: ${newsUrl}\n\n`;
  text += `---\n`;
  text += `${SALON_NAME}\n`;
  text += `${SALON_ADDRESS}\n`;
  text += `Tel: ${SALON_PHONE}\n`;
  if (unsubscribeUrl) {
    text += `\n配信停止: ${unsubscribeUrl}\n`;
  }

  return text;
}

// ============================================
// 予約関連メールテンプレート
// ============================================

// 日付フォーマット（例: 2025年1月15日（水））
export function formatReservationDate(date: Date): string {
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = weekdays[date.getDay()];
  return `${year}年${month}月${day}日（${weekday}）`;
}

// 金額フォーマット
function formatPrice(price: number): string {
  return `¥${price.toLocaleString()}`;
}

// 予約完了メール用データ型
export interface ReservationConfirmationData {
  reservationId: string;
  customerName: string;
  date: Date;
  startTime: string;
  endTime: string;
  menuSummary: string;
  totalPrice: number;
  couponDiscount: number;
  note?: string;
}

// 予約完了メールHTML
export function createReservationConfirmationHtml(data: ReservationConfirmationData) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mone0601.com';
  const mypageUrl = `${siteUrl}/mypage/reservations`;
  const dateStr = formatReservationDate(data.date);
  const finalPrice = data.totalPrice - data.couponDiscount;

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ご予約完了のお知らせ</title>
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
                Reservation Confirmed
              </p>

              <h2 style="margin: 0 0 24px; color: #ffffff; font-size: 22px; font-weight: 500; line-height: 1.4;">
                ご予約ありがとうございます
              </h2>

              <p style="margin: 0 0 30px; color: #b0b0b0; font-size: 15px; line-height: 1.6;">
                ${data.customerName} 様<br>
                以下の内容でご予約を承りました。
              </p>

              <!-- 予約詳細 -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #3a3a3a; color: #888888; font-size: 13px; width: 100px;">予約番号</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #3a3a3a; color: #ffffff; font-size: 14px; font-weight: 500;">${data.reservationId}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #3a3a3a; color: #888888; font-size: 13px;">日時</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #3a3a3a; color: #ffffff; font-size: 14px;">${dateStr} ${data.startTime}〜${data.endTime}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #3a3a3a; color: #888888; font-size: 13px;">メニュー</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #3a3a3a; color: #ffffff; font-size: 14px;">${data.menuSummary}</td>
                </tr>
                ${data.couponDiscount > 0 ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #3a3a3a; color: #888888; font-size: 13px;">小計</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #3a3a3a; color: #888888; font-size: 14px; text-decoration: line-through;">${formatPrice(data.totalPrice)}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #3a3a3a; color: #888888; font-size: 13px;">クーポン割引</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #3a3a3a; color: #4a7c59; font-size: 14px;">-${formatPrice(data.couponDiscount)}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #3a3a3a; color: #888888; font-size: 13px;">料金</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #3a3a3a; color: #ffffff; font-size: 16px; font-weight: 600;">${formatPrice(finalPrice)}</td>
                </tr>
                ${data.note ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #3a3a3a; color: #888888; font-size: 13px;">備考</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #3a3a3a; color: #b0b0b0; font-size: 14px;">${data.note}</td>
                </tr>
                ` : ''}
              </table>

              <!-- キャンセルポリシー -->
              <div style="padding: 20px; background-color: #1f1f1f; border-radius: 4px; margin-bottom: 30px;">
                <p style="margin: 0 0 10px; color: #c4a77d; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">
                  キャンセルポリシー
                </p>
                <p style="margin: 0; color: #888888; font-size: 13px; line-height: 1.6;">
                  キャンセル・変更は前日19:00までにお願いいたします。<br>
                  それ以降のキャンセルはご遠慮ください。
                </p>
              </div>

              <a href="${mypageUrl}" style="display: inline-block; padding: 14px 32px; background-color: #4a7c59; color: #ffffff; text-decoration: none; font-size: 14px; letter-spacing: 1px; border-radius: 0;">
                マイページで確認
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #1f1f1f; border-top: 1px solid #3a3a3a;">
              <p style="margin: 0 0 10px; color: #888888; font-size: 12px; line-height: 1.6;">
                ${SALON_NAME}<br>
                ${SALON_ADDRESS}<br>
                Tel: ${SALON_PHONE}
              </p>
              <p style="margin: 0; color: #666666; font-size: 11px;">
                このメールはご予約確認のため自動送信されています。
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

// 予約完了メール プレーンテキスト版
export function createReservationConfirmationText(data: ReservationConfirmationData) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mone0601.com';
  const mypageUrl = `${siteUrl}/mypage/reservations`;
  const dateStr = formatReservationDate(data.date);
  const finalPrice = data.totalPrice - data.couponDiscount;

  let text = `${SALON_NAME} - ご予約完了のお知らせ\n\n`;
  text += `${data.customerName} 様\n`;
  text += `以下の内容でご予約を承りました。\n\n`;
  text += `--- 予約詳細 ---\n`;
  text += `予約番号: ${data.reservationId}\n`;
  text += `日時: ${dateStr} ${data.startTime}〜${data.endTime}\n`;
  text += `メニュー: ${data.menuSummary}\n`;
  if (data.couponDiscount > 0) {
    text += `小計: ${formatPrice(data.totalPrice)}\n`;
    text += `クーポン割引: -${formatPrice(data.couponDiscount)}\n`;
  }
  text += `料金: ${formatPrice(finalPrice)}\n`;
  if (data.note) text += `備考: ${data.note}\n`;
  text += `\n--- キャンセルポリシー ---\n`;
  text += `キャンセル・変更は前日19:00までにお願いいたします。\n`;
  text += `それ以降のキャンセルはご遠慮ください。\n\n`;
  text += `マイページで確認: ${mypageUrl}\n\n`;
  text += `---\n`;
  text += `${SALON_NAME}\n`;
  text += `${SALON_ADDRESS}\n`;
  text += `Tel: ${SALON_PHONE}\n`;

  return text;
}

// 予約完了メール送信
export async function sendReservationConfirmationEmail(
  toEmail: string,
  data: ReservationConfirmationData
): Promise<{ success: boolean; error?: string }> {
  const html = createReservationConfirmationHtml(data);
  const text = createReservationConfirmationText(data);

  return sendEmail({
    to: toEmail,
    subject: `【${SALON_NAME}】ご予約ありがとうございます`,
    html,
    text,
  });
}

// 予約キャンセル確認メール用データ型
export interface ReservationCancellationData {
  reservationId: string;
  customerName: string;
  date: Date;
  startTime: string;
  menuSummary: string;
}

// キャンセル確認メールHTML
export function createReservationCancellationHtml(data: ReservationCancellationData) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mone0601.com';
  const bookingUrl = `${siteUrl}/booking`;
  const dateStr = formatReservationDate(data.date);

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ご予約キャンセルのお知らせ</title>
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
                Reservation Cancelled
              </p>

              <h2 style="margin: 0 0 24px; color: #ffffff; font-size: 22px; font-weight: 500; line-height: 1.4;">
                ご予約キャンセルのお知らせ
              </h2>

              <p style="margin: 0 0 30px; color: #b0b0b0; font-size: 15px; line-height: 1.6;">
                ${data.customerName} 様<br>
                以下のご予約をキャンセルいたしました。
              </p>

              <!-- キャンセル詳細 -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #3a3a3a; color: #888888; font-size: 13px; width: 100px;">予約番号</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #3a3a3a; color: #ffffff; font-size: 14px;">${data.reservationId}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #3a3a3a; color: #888888; font-size: 13px;">日時</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #3a3a3a; color: #ffffff; font-size: 14px;">${dateStr} ${data.startTime}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #3a3a3a; color: #888888; font-size: 13px;">メニュー</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #3a3a3a; color: #ffffff; font-size: 14px;">${data.menuSummary}</td>
                </tr>
              </table>

              <p style="margin: 0 0 30px; color: #888888; font-size: 14px; line-height: 1.6;">
                またのご予約をお待ちしております。
              </p>

              <a href="${bookingUrl}" style="display: inline-block; padding: 14px 32px; background-color: #4a7c59; color: #ffffff; text-decoration: none; font-size: 14px; letter-spacing: 1px; border-radius: 0;">
                再度予約する
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #1f1f1f; border-top: 1px solid #3a3a3a;">
              <p style="margin: 0 0 10px; color: #888888; font-size: 12px; line-height: 1.6;">
                ${SALON_NAME}<br>
                ${SALON_ADDRESS}<br>
                Tel: ${SALON_PHONE}
              </p>
              <p style="margin: 0; color: #666666; font-size: 11px;">
                このメールはキャンセル確認のため自動送信されています。
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

// キャンセル確認メール プレーンテキスト版
export function createReservationCancellationText(data: ReservationCancellationData) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mone0601.com';
  const bookingUrl = `${siteUrl}/booking`;
  const dateStr = formatReservationDate(data.date);

  let text = `${SALON_NAME} - ご予約キャンセルのお知らせ\n\n`;
  text += `${data.customerName} 様\n`;
  text += `以下のご予約をキャンセルいたしました。\n\n`;
  text += `--- キャンセル詳細 ---\n`;
  text += `予約番号: ${data.reservationId}\n`;
  text += `日時: ${dateStr} ${data.startTime}\n`;
  text += `メニュー: ${data.menuSummary}\n\n`;
  text += `またのご予約をお待ちしております。\n`;
  text += `再度予約: ${bookingUrl}\n\n`;
  text += `---\n`;
  text += `${SALON_NAME}\n`;
  text += `${SALON_ADDRESS}\n`;
  text += `Tel: ${SALON_PHONE}\n`;

  return text;
}

// キャンセル確認メール送信
export async function sendReservationCancellationEmail(
  toEmail: string,
  data: ReservationCancellationData
): Promise<{ success: boolean; error?: string }> {
  const html = createReservationCancellationHtml(data);
  const text = createReservationCancellationText(data);

  return sendEmail({
    to: toEmail,
    subject: `【${SALON_NAME}】ご予約キャンセルのお知らせ`,
    html,
    text,
  });
}

// ============================================
// 認証メール（マジックリンク）テンプレート
// ============================================

// マジックリンクメールHTML
export function createMagicLinkHtml(params: {
  url: string;
  host: string;
}) {
  const { url } = params;

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ログイン認証</title>
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
                Login Authentication
              </p>

              <h2 style="margin: 0 0 24px; color: #ffffff; font-size: 22px; font-weight: 500; line-height: 1.4;">
                ログイン認証
              </h2>

              <p style="margin: 0 0 30px; color: #b0b0b0; font-size: 15px; line-height: 1.6;">
                以下のボタンをクリックしてログインしてください。<br>
                このリンクは24時間有効です。
              </p>

              <a href="${url}" style="display: inline-block; padding: 14px 32px; background-color: #4a7c59; color: #ffffff; text-decoration: none; font-size: 14px; letter-spacing: 1px; border-radius: 0;">
                ログインする
              </a>

              <p style="margin: 30px 0 0; color: #666666; font-size: 12px; line-height: 1.6;">
                このメールに心当たりがない場合は、無視していただいて問題ありません。
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #1f1f1f; border-top: 1px solid #3a3a3a;">
              <p style="margin: 0 0 10px; color: #888888; font-size: 12px; line-height: 1.6;">
                ${SALON_NAME}<br>
                ${SALON_ADDRESS}<br>
                Tel: ${SALON_PHONE}
              </p>
              <p style="margin: 0; color: #666666; font-size: 11px;">
                このメールはログイン認証のため自動送信されています。
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

// マジックリンクメール プレーンテキスト版
export function createMagicLinkText(params: {
  url: string;
  host: string;
}) {
  const { url } = params;

  let text = `${SALON_NAME} - ログイン認証\n\n`;
  text += `以下のリンクをクリックしてログインしてください。\n`;
  text += `このリンクは24時間有効です。\n\n`;
  text += `${url}\n\n`;
  text += `このメールに心当たりがない場合は、無視していただいて問題ありません。\n\n`;
  text += `---\n`;
  text += `${SALON_NAME}\n`;
  text += `${SALON_ADDRESS}\n`;
  text += `Tel: ${SALON_PHONE}\n`;

  return text;
}
