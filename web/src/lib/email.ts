// src/lib/email.ts
// MONË - Email Utility using Resend

import { Resend } from 'resend';
import { SALON_INFO } from '@/constants/salon';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = "Men's hair MONE <noreply@mone.hair>";
const SALON_NAME = "MONË";
const SALON_ADDRESS = SALON_INFO.address;
const SALON_PHONE = SALON_INFO.phone;
const ADMIN_EMAIL = "mo.0816.ne@gmail.com";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

// Resend APIの制限: toフィールドは最大50件まで
const RESEND_MAX_RECIPIENTS = 50;

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const toAddresses = Array.isArray(to) ? to : [to];
  console.log(`[Email] Attempting to send email to ${toAddresses.length} recipient(s), subject: ${subject}`);

  if (!resend) {
    console.error('[Email] Resend API key not configured - RESEND_API_KEY is missing');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    // 単一受信者の場合
    if (toAddresses.length === 1) {
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: toAddresses[0],
        subject,
        html,
        text,
      });

      if (result.error) {
        console.error(`[Email] Failed to send email to: ${toAddresses[0]}, error:`, result.error);
        return { success: false, error: result.error.message || 'Unknown error' };
      }

      console.log(`[Email] Successfully sent email to: ${toAddresses[0]}, id: ${result.data?.id}`);
      return { success: true, data: result.data };
    }

    // 複数受信者の場合は各受信者に個別送信（プライバシー保護のため）
    console.log(`[Email] Sending individually to ${toAddresses.length} recipients to protect privacy`);

    const results: { email: string; success: boolean; id?: string; error?: string }[] = [];

    for (let i = 0; i < toAddresses.length; i++) {
      const email = toAddresses[i];
      console.log(`[Email] Sending to ${i + 1}/${toAddresses.length}: ${email}`);

      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject,
        html,
        text,
      });

      if (result.error) {
        console.error(`[Email] Failed to send to ${email}:`, result.error);
        results.push({ email, success: false, error: result.error.message || 'Unknown error' });
      } else {
        console.log(`[Email] Successfully sent to ${email}, id: ${result.data?.id}`);
        results.push({ email, success: true, id: result.data?.id });
      }
    }

    // 結果集計
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    if (failCount === 0) {
      console.log(`[Email] All ${toAddresses.length} emails sent successfully`);
      return { success: true, data: { results, totalRecipients: toAddresses.length } };
    } else if (successCount > 0) {
      console.warn(`[Email] Partial success: ${successCount}/${toAddresses.length} emails sent`);
      return {
        success: false,
        error: `Partial failure: ${failCount}/${toAddresses.length} emails failed`,
        data: { results, totalRecipients: toAddresses.length }
      };
    } else {
      console.error(`[Email] All ${toAddresses.length} emails failed`);
      return { success: false, error: 'All emails failed', data: { results } };
    }
  } catch (error) {
    console.error('[Email] Failed to send email:', error);
    return { success: false, error: String(error) };
  }
}

// 画像URLを絶対URLに変換（メール用）
function getAbsoluteImageUrl(imageUrl: string | undefined, siteUrl: string): string | null {
  if (!imageUrl) return null;

  // すでに絶対URLの場合はそのまま返す
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // 相対URLの場合は絶対URLに変換
  if (imageUrl.startsWith('/')) {
    return `${siteUrl}${imageUrl}`;
  }

  return imageUrl;
}

// ニュースレター用のHTMLテンプレート（画像対応）
export function createNewsletterHtml(news: {
  title: string;
  subtitle?: string;
  excerpt?: string;
  slug: string;
  publishedAt?: string;
  coverImage?: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mone.hair';
  const newsUrl = `${siteUrl}/news/${news.slug}`;
  const coverImageUrl = getAbsoluteImageUrl(news.coverImage, siteUrl);

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

          ${coverImageUrl ? `
          <!-- Cover Image -->
          <tr>
            <td style="padding: 0; background-color: #242424;">
              <img src="${coverImageUrl}" alt="${news.title}" style="width: 100%; max-width: 600px; height: auto; display: block;">
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
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mone.hair';
  const newsUrl = `${siteUrl}/news/${news.slug}`;
  const coverImageUrl = getAbsoluteImageUrl(news.coverImage, siteUrl);

  let text = `${SALON_NAME} からのお知らせ\n\n`;
  text += `${news.title}\n`;
  if (news.subtitle) text += `${news.subtitle}\n`;
  text += '\n';
  if (coverImageUrl) text += `[画像] ${coverImageUrl}\n\n`;
  if (news.excerpt) text += `${news.excerpt}\n\n`;
  if (news.publishedAt) text += `${news.publishedAt}\n\n`;
  text += `詳細はこちら: ${newsUrl}\n\n`;
  text += `---\n`;
  text += `${SALON_NAME}\n`;
  text += `${SALON_ADDRESS}\n`;
  text += `Tel: ${SALON_PHONE}\n`;

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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mone.hair';
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
                <ul style="margin: 0; padding: 0 0 0 16px; color: #888888; font-size: 13px; line-height: 1.8;">
                  <li>オンラインでのキャンセル・変更は前日19:00までにお願いいたします。</li>
                  <li>遅れられる場合は、事前にご連絡をお願いします。</li>
                  <li>ご連絡無く10分経過致しましたら無断キャンセル扱いとさせていただきます。</li>
                  <li>無断キャンセル及び当日キャンセルに対しキャンセル料をお支払いいただく事もございますのでご注意ください。</li>
                </ul>
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mone.hair';
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
  text += `・オンラインでのキャンセル・変更は前日19:00までにお願いいたします。\n`;
  text += `・遅れられる場合は、事前にご連絡をお願いします。\n`;
  text += `・ご連絡無く10分経過致しましたら無断キャンセル扱いとさせていただきます。\n`;
  text += `・無断キャンセル及び当日キャンセルに対しキャンセル料をお支払いいただく事もございますのでご注意ください。\n\n`;
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mone.hair';
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mone.hair';
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

// ==========================================
// 管理者への通知メール
// ==========================================

// 管理者への新規予約通知用データ型
export interface AdminNewReservationData {
  reservationId: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  date: Date;
  startTime: string;
  endTime: string;
  menuSummary: string;
  totalPrice: number;
  note?: string | null;
  isPhoneReservation?: boolean;
}

// 管理者への新規予約通知HTML
export function createAdminNewReservationHtml(data: AdminNewReservationData) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mone.hair';
  const adminUrl = `${siteUrl}/admin/reservations`;
  const dateStr = formatReservationDate(data.date);
  const reservationType = data.isPhoneReservation ? '電話予約' : 'Web予約';

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>新規予約のお知らせ</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">

          <!-- Header -->
          <tr>
            <td style="padding: 20px 30px; background-color: #2d5a27; color: white;">
              <h1 style="margin: 0; font-size: 18px; font-weight: 500;">
                📅 新規${reservationType}が入りました
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px; background-color: #ffffff;">
              <!-- 予約詳細 -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; font-size: 13px; width: 100px;">予約番号</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333; font-size: 14px; font-weight: 500;">${data.reservationId}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; font-size: 13px;">お客様名</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333; font-size: 14px; font-weight: 500;">${data.customerName}</td>
                </tr>
                ${data.customerPhone ? `
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; font-size: 13px;">電話番号</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333; font-size: 14px;">${data.customerPhone}</td>
                </tr>
                ` : ''}
                ${data.customerEmail ? `
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; font-size: 13px;">メール</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333; font-size: 14px;">${data.customerEmail}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; font-size: 13px;">日時</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333; font-size: 14px; font-weight: 500;">${dateStr} ${data.startTime}〜${data.endTime}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; font-size: 13px;">メニュー</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333; font-size: 14px;">${data.menuSummary}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; font-size: 13px;">料金</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #2d5a27; font-size: 16px; font-weight: 600;">${formatPrice(data.totalPrice)}</td>
                </tr>
                ${data.note ? `
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; font-size: 13px;">備考</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333; font-size: 14px;">${data.note}</td>
                </tr>
                ` : ''}
              </table>

              <!-- CTA -->
              <table style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${adminUrl}" style="display: inline-block; padding: 12px 30px; background-color: #2d5a27; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
                      管理画面で確認
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

// 管理者への新規予約通知テキスト
export function createAdminNewReservationText(data: AdminNewReservationData) {
  const dateStr = formatReservationDate(data.date);
  const reservationType = data.isPhoneReservation ? '電話予約' : 'Web予約';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mone.hair';

  let text = `【${SALON_NAME}】新規${reservationType}のお知らせ\n\n`;
  text += `新しい予約が入りました。\n\n`;
  text += `予約番号: ${data.reservationId}\n`;
  text += `お客様名: ${data.customerName}\n`;
  if (data.customerPhone) text += `電話番号: ${data.customerPhone}\n`;
  if (data.customerEmail) text += `メール: ${data.customerEmail}\n`;
  text += `日時: ${dateStr} ${data.startTime}〜${data.endTime}\n`;
  text += `メニュー: ${data.menuSummary}\n`;
  text += `料金: ${formatPrice(data.totalPrice)}\n`;
  if (data.note) text += `備考: ${data.note}\n`;
  text += `\n管理画面: ${siteUrl}/admin/reservations\n`;

  return text;
}

// 管理者への新規予約通知メール送信
export async function sendAdminNewReservationEmail(data: AdminNewReservationData) {
  const reservationType = data.isPhoneReservation ? '電話予約' : 'Web予約';
  const html = createAdminNewReservationHtml(data);
  const text = createAdminNewReservationText(data);

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `【${SALON_NAME}】新規${reservationType}: ${data.customerName}様 ${formatReservationDate(data.date)} ${data.startTime}`,
    html,
    text,
  });
}

// 管理者へのキャンセル通知用データ型
export interface AdminCancellationData {
  reservationId: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  date: Date;
  startTime: string;
  menuSummary: string;
  totalPrice: number;
  cancelledByAdmin?: boolean;
}

// 管理者へのキャンセル通知HTML
export function createAdminCancellationHtml(data: AdminCancellationData) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mone.hair';
  const adminUrl = `${siteUrl}/admin/reservations`;
  const dateStr = formatReservationDate(data.date);
  const cancelType = data.cancelledByAdmin ? '管理者によるキャンセル' : 'お客様によるキャンセル';

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>予約キャンセルのお知らせ</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">

          <!-- Header -->
          <tr>
            <td style="padding: 20px 30px; background-color: #dc2626; color: white;">
              <h1 style="margin: 0; font-size: 18px; font-weight: 500;">
                ❌ 予約がキャンセルされました
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px; background-color: #ffffff;">
              <p style="margin: 0 0 20px; color: #666; font-size: 14px;">
                ${cancelType}
              </p>

              <!-- 予約詳細 -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; font-size: 13px; width: 100px;">予約番号</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333; font-size: 14px;">${data.reservationId}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; font-size: 13px;">お客様名</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333; font-size: 14px; font-weight: 500;">${data.customerName}</td>
                </tr>
                ${data.customerPhone ? `
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; font-size: 13px;">電話番号</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #333; font-size: 14px;">${data.customerPhone}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; font-size: 13px;">日時</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #999; font-size: 14px; text-decoration: line-through;">${dateStr} ${data.startTime}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; font-size: 13px;">メニュー</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #999; font-size: 14px; text-decoration: line-through;">${data.menuSummary}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #666; font-size: 13px;">料金</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #999; font-size: 14px; text-decoration: line-through;">${formatPrice(data.totalPrice)}</td>
                </tr>
              </table>

              <!-- CTA -->
              <table style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${adminUrl}" style="display: inline-block; padding: 12px 30px; background-color: #666; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
                      管理画面で確認
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

// 管理者へのキャンセル通知テキスト
export function createAdminCancellationText(data: AdminCancellationData) {
  const dateStr = formatReservationDate(data.date);
  const cancelType = data.cancelledByAdmin ? '管理者によるキャンセル' : 'お客様によるキャンセル';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mone.hair';

  let text = `【${SALON_NAME}】予約キャンセルのお知らせ\n\n`;
  text += `${cancelType}\n\n`;
  text += `予約番号: ${data.reservationId}\n`;
  text += `お客様名: ${data.customerName}\n`;
  if (data.customerPhone) text += `電話番号: ${data.customerPhone}\n`;
  text += `日時: ${dateStr} ${data.startTime}\n`;
  text += `メニュー: ${data.menuSummary}\n`;
  text += `料金: ${formatPrice(data.totalPrice)}\n`;
  text += `\n管理画面: ${siteUrl}/admin/reservations\n`;

  return text;
}

// 管理者へのキャンセル通知メール送信
export async function sendAdminCancellationEmail(data: AdminCancellationData) {
  const html = createAdminCancellationHtml(data);
  const text = createAdminCancellationText(data);

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `【${SALON_NAME}】キャンセル: ${data.customerName}様 ${formatReservationDate(data.date)} ${data.startTime}`,
    html,
    text,
  });
}

// ==========================================
// 顧客への予約変更通知メール
// ==========================================

// 予約変更通知用データ型
export interface ReservationChangeData {
  reservationId: string;
  customerName: string;
  oldDate: Date;
  oldStartTime: string;
  oldEndTime: string;
  oldMenuSummary: string;
  oldTotalPrice: number;
  newDate: Date;
  newStartTime: string;
  newEndTime: string;
  newMenuSummary: string;
  newTotalPrice: number;
  note?: string | null;
}

// 予約変更通知HTML
export function createReservationChangeHtml(data: ReservationChangeData) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mone.hair';
  const mypageUrl = `${siteUrl}/mypage/reservations`;
  const oldDateStr = formatReservationDate(data.oldDate);
  const newDateStr = formatReservationDate(data.newDate);

  const dateChanged = oldDateStr !== newDateStr || data.oldStartTime !== data.newStartTime;
  const menuChanged = data.oldMenuSummary !== data.newMenuSummary;
  const priceChanged = data.oldTotalPrice !== data.newTotalPrice;

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ご予約内容変更のお知らせ</title>
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
                Reservation Changed
              </p>

              <h2 style="margin: 0 0 24px; color: #ffffff; font-size: 22px; font-weight: 500; line-height: 1.4;">
                ご予約内容変更のお知らせ
              </h2>

              <p style="margin: 0 0 30px; color: #b0b0b0; font-size: 15px; line-height: 1.6;">
                ${data.customerName} 様<br>
                ご予約内容を変更いたしました。
              </p>

              <!-- 変更後の予約詳細 -->
              <p style="margin: 0 0 10px; color: #c4a77d; font-size: 14px; font-weight: 500;">変更後のご予約</p>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; background-color: #2a3a2a; border-radius: 8px;">
                <tr>
                  <td style="padding: 12px 16px; color: #888888; font-size: 13px; width: 80px;">予約番号</td>
                  <td style="padding: 12px 16px; color: #ffffff; font-size: 14px; font-weight: 500;">${data.reservationId}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-top: 1px solid #3a4a3a; color: #888888; font-size: 13px;">日時</td>
                  <td style="padding: 12px 16px; border-top: 1px solid #3a4a3a; color: #ffffff; font-size: 14px; font-weight: 500;">
                    ${newDateStr} ${data.newStartTime}〜${data.newEndTime}
                    ${dateChanged ? '<span style="color: #c4a77d; font-size: 12px; margin-left: 8px;">変更</span>' : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-top: 1px solid #3a4a3a; color: #888888; font-size: 13px;">メニュー</td>
                  <td style="padding: 12px 16px; border-top: 1px solid #3a4a3a; color: #ffffff; font-size: 14px;">
                    ${data.newMenuSummary}
                    ${menuChanged ? '<span style="color: #c4a77d; font-size: 12px; margin-left: 8px;">変更</span>' : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-top: 1px solid #3a4a3a; color: #888888; font-size: 13px;">料金</td>
                  <td style="padding: 12px 16px; border-top: 1px solid #3a4a3a; color: #c4a77d; font-size: 16px; font-weight: 600;">
                    ${formatPrice(data.newTotalPrice)}
                    ${priceChanged ? '<span style="color: #888888; font-size: 12px; margin-left: 8px;">変更</span>' : ''}
                  </td>
                </tr>
                ${data.note ? `
                <tr>
                  <td style="padding: 12px 16px; border-top: 1px solid #3a4a3a; color: #888888; font-size: 13px;">備考</td>
                  <td style="padding: 12px 16px; border-top: 1px solid #3a4a3a; color: #b0b0b0; font-size: 14px;">${data.note}</td>
                </tr>
                ` : ''}
              </table>

              <!-- 変更前の予約詳細 -->
              <p style="margin: 0 0 10px; color: #666666; font-size: 12px;">変更前</p>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 8px 0; color: #666666; font-size: 12px; width: 80px;">日時</td>
                  <td style="padding: 8px 0; color: #666666; font-size: 12px; text-decoration: line-through;">${oldDateStr} ${data.oldStartTime}〜${data.oldEndTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666666; font-size: 12px;">メニュー</td>
                  <td style="padding: 8px 0; color: #666666; font-size: 12px; text-decoration: line-through;">${data.oldMenuSummary}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666666; font-size: 12px;">料金</td>
                  <td style="padding: 8px 0; color: #666666; font-size: 12px; text-decoration: line-through;">${formatPrice(data.oldTotalPrice)}</td>
                </tr>
              </table>

              <!-- CTA -->
              <table style="width: 100%; margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="${mypageUrl}" style="display: inline-block; padding: 14px 36px; background-color: #c4a77d; color: #1a1a1a; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 600; letter-spacing: 1px;">
                      マイページで確認
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px; color: #888888; font-size: 13px; line-height: 1.6;">
                ご不明な点がございましたら、お気軽にお問い合わせください。
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #1a1a1a; border-top: 1px solid #3a3a3a;">
              <p style="margin: 0; color: #666666; font-size: 12px; line-height: 1.8;">
                ${SALON_NAME}<br>
                ${SALON_ADDRESS}<br>
                Tel: ${SALON_PHONE}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

// 予約変更通知テキスト
export function createReservationChangeText(data: ReservationChangeData) {
  const oldDateStr = formatReservationDate(data.oldDate);
  const newDateStr = formatReservationDate(data.newDate);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mone.hair';

  let text = `${SALON_NAME} - ご予約内容変更のお知らせ\n\n`;
  text += `${data.customerName} 様\n\n`;
  text += `ご予約内容を変更いたしました。\n\n`;
  text += `【変更後のご予約】\n`;
  text += `予約番号: ${data.reservationId}\n`;
  text += `日時: ${newDateStr} ${data.newStartTime}〜${data.newEndTime}\n`;
  text += `メニュー: ${data.newMenuSummary}\n`;
  text += `料金: ${formatPrice(data.newTotalPrice)}\n`;
  if (data.note) text += `備考: ${data.note}\n`;
  text += `\n【変更前】\n`;
  text += `日時: ${oldDateStr} ${data.oldStartTime}〜${data.oldEndTime}\n`;
  text += `メニュー: ${data.oldMenuSummary}\n`;
  text += `料金: ${formatPrice(data.oldTotalPrice)}\n`;
  text += `\nマイページ: ${siteUrl}/mypage/reservations\n\n`;
  text += `---\n`;
  text += `${SALON_NAME}\n`;
  text += `${SALON_ADDRESS}\n`;
  text += `Tel: ${SALON_PHONE}\n`;

  return text;
}

// 予約変更通知メール送信
export async function sendReservationChangeEmail(
  toEmail: string,
  data: ReservationChangeData
): Promise<{ success: boolean; error?: string }> {
  const html = createReservationChangeHtml(data);
  const text = createReservationChangeText(data);

  return sendEmail({
    to: toEmail,
    subject: `【${SALON_NAME}】ご予約内容変更のお知らせ`,
    html,
    text,
  });
}

// ==========================================
// 前日リマインダーメール
// ==========================================

// 前日リマインダー用データ型
export interface ReminderData {
  reservationId: string;
  customerName: string;
  date: Date;
  startTime: string;
  endTime: string;
  menuSummary: string;
  totalPrice: number;
  note?: string | null;
}

// 前日リマインダーHTML
export function createReminderHtml(data: ReminderData) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mone.hair';
  const mypageUrl = `${siteUrl}/mypage/reservations`;
  const dateStr = formatReservationDate(data.date);

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>明日のご予約のお知らせ</title>
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
                Reservation Reminder
              </p>

              <h2 style="margin: 0 0 24px; color: #ffffff; font-size: 22px; font-weight: 500; line-height: 1.4;">
                明日のご予約のお知らせ
              </h2>

              <p style="margin: 0 0 30px; color: #b0b0b0; font-size: 15px; line-height: 1.6;">
                ${data.customerName} 様<br>
                明日のご来店をお待ちしております。
              </p>

              <!-- 予約詳細 -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #3a3a3a; color: #888888; font-size: 13px; width: 100px;">予約番号</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #3a3a3a; color: #ffffff; font-size: 14px; font-weight: 500;">${data.reservationId}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #3a3a3a; color: #888888; font-size: 13px;">日時</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #3a3a3a; color: #ffffff; font-size: 16px; font-weight: 600;">${dateStr} ${data.startTime}〜${data.endTime}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #3a3a3a; color: #888888; font-size: 13px;">メニュー</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #3a3a3a; color: #ffffff; font-size: 14px;">${data.menuSummary}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #3a3a3a; color: #888888; font-size: 13px;">料金</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #3a3a3a; color: #c4a77d; font-size: 16px; font-weight: 600;">${formatPrice(data.totalPrice)}</td>
                </tr>
                ${data.note ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #3a3a3a; color: #888888; font-size: 13px;">備考</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #3a3a3a; color: #b0b0b0; font-size: 14px;">${data.note}</td>
                </tr>
                ` : ''}
              </table>

              <!-- アクセス情報 -->
              <div style="padding: 20px; background-color: #1a1a1a; border-radius: 8px; margin-bottom: 30px;">
                <p style="margin: 0 0 12px; color: #c4a77d; font-size: 13px; font-weight: 500;">アクセス</p>
                <p style="margin: 0; color: #b0b0b0; font-size: 14px; line-height: 1.6;">
                  ${SALON_ADDRESS}<br>
                  Tel: ${SALON_PHONE}
                </p>
              </div>

              <!-- キャンセルポリシー -->
              <p style="margin: 0 0 20px; color: #888888; font-size: 13px; line-height: 1.6;">
                ご予約の変更・キャンセルをご希望の場合は、お電話にてご連絡ください。
              </p>

              <!-- CTA -->
              <table style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${mypageUrl}" style="display: inline-block; padding: 14px 36px; background-color: #c4a77d; color: #1a1a1a; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 600; letter-spacing: 1px;">
                      マイページで確認
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #1a1a1a; border-top: 1px solid #3a3a3a;">
              <p style="margin: 0; color: #666666; font-size: 12px; line-height: 1.8;">
                ${SALON_NAME}<br>
                ${SALON_ADDRESS}<br>
                Tel: ${SALON_PHONE}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

// 前日リマインダーテキスト
export function createReminderText(data: ReminderData) {
  const dateStr = formatReservationDate(data.date);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mone.hair';

  let text = `${SALON_NAME} - 明日のご予約のお知らせ\n\n`;
  text += `${data.customerName} 様\n\n`;
  text += `明日のご来店をお待ちしております。\n\n`;
  text += `【ご予約内容】\n`;
  text += `予約番号: ${data.reservationId}\n`;
  text += `日時: ${dateStr} ${data.startTime}〜${data.endTime}\n`;
  text += `メニュー: ${data.menuSummary}\n`;
  text += `料金: ${formatPrice(data.totalPrice)}\n`;
  if (data.note) text += `備考: ${data.note}\n`;
  text += `\n【アクセス】\n`;
  text += `${SALON_ADDRESS}\n`;
  text += `Tel: ${SALON_PHONE}\n\n`;
  text += `ご予約の変更・キャンセルをご希望の場合は、お電話にてご連絡ください。\n\n`;
  text += `マイページ: ${siteUrl}/mypage/reservations\n\n`;
  text += `---\n`;
  text += `${SALON_NAME}\n`;

  return text;
}

// 前日リマインダーメール送信
export async function sendReminderEmail(
  toEmail: string,
  data: ReminderData
): Promise<{ success: boolean; error?: string }> {
  const html = createReminderHtml(data);
  const text = createReminderText(data);

  return sendEmail({
    to: toEmail,
    subject: `【${SALON_NAME}】明日のご予約のお知らせ`,
    html,
    text,
  });
}
