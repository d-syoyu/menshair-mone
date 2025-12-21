// src/app/api/cron/newsletter/route.ts
// Vercel Cron Job - ニュースレター自動送信

import { NextRequest, NextResponse } from "next/server";
import {
  getPendingNewsletters,
  getNewsletterTargets,
  updateNewsPageStatus,
  clearSendFlag,
} from "@/lib/notion";
import { sendEmail, createNewsletterHtml, createNewsletterText } from "@/lib/email";
import { filterCustomersByTargets } from "@/lib/customer-filter";

// ステータス定数
const STATUS = {
  SENDING: "送信中",
  SENT: "送信済み",
  FAILED: "送信失敗",
} as const;

// GET /api/cron/newsletter
// Vercel Cron Jobから5分ごとに呼び出される
export async function GET(request: NextRequest) {
  try {
    // 1. Cron認証（Vercelからの呼び出しを検証）
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.error("[Newsletter Cron] Invalid authorization");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[Newsletter Cron] Starting newsletter check...");

    // 2. 送信待ちのニュースを取得
    const pendingNewsletters = await getPendingNewsletters();

    if (pendingNewsletters.length === 0) {
      console.log("[Newsletter Cron] No pending newsletters");
      return NextResponse.json({
        success: true,
        message: "No pending newsletters",
        processed: 0,
      });
    }

    console.log(`[Newsletter Cron] Found ${pendingNewsletters.length} pending newsletter(s)`);

    // 3. 各ニュースを処理
    const results: { id: string; title: string; success: boolean; sentCount?: number; error?: string }[] = [];

    for (const news of pendingNewsletters) {
      try {
        console.log(`[Newsletter Cron] Processing: ${news.title}`);

        // ステータスを「送信中」に更新
        await updateNewsPageStatus(news.id, STATUS.SENDING);

        // 配信先を取得
        const targets = await getNewsletterTargets(news.id);
        console.log(`[Newsletter Cron] Targets: ${targets.join(", ") || "(all)"}`);

        // 顧客を取得
        let customers: { email: string; name: string | null }[];
        if (targets.length === 0) {
          customers = await filterCustomersByTargets({ targets: ["すべて"] });
        } else {
          customers = await filterCustomersByTargets({ targets });
        }

        if (customers.length === 0) {
          console.log(`[Newsletter Cron] No customers for: ${news.title}`);
          await updateNewsPageStatus(news.id, STATUS.SENT);
          await clearSendFlag(news.id);
          results.push({
            id: news.id,
            title: news.title,
            success: true,
            sentCount: 0,
          });
          continue;
        }

        const emailAddresses = customers.map((c) => c.email);
        console.log(`[Newsletter Cron] Sending to ${emailAddresses.length} customers`);

        // メール送信
        const html = createNewsletterHtml({
          title: news.title,
          subtitle: news.subtitle || undefined,
          excerpt: news.excerpt || undefined,
          slug: news.slug,
          publishedAt: news.publishedAt || undefined,
          coverImage: news.coverImage || undefined,
        });

        const text = createNewsletterText({
          title: news.title,
          subtitle: news.subtitle || undefined,
          excerpt: news.excerpt || undefined,
          slug: news.slug,
          publishedAt: news.publishedAt || undefined,
          coverImage: news.coverImage || undefined,
        });

        const result = await sendEmail({
          to: emailAddresses,
          subject: `【MONË】${news.title}`,
          html,
          text,
        });

        if (result.success) {
          // 成功: ステータスを「送信済み」に、フラグをOFFに
          await updateNewsPageStatus(news.id, STATUS.SENT);
          await clearSendFlag(news.id);
          console.log(`[Newsletter Cron] Sent: ${news.title} to ${emailAddresses.length} customers`);
          results.push({
            id: news.id,
            title: news.title,
            success: true,
            sentCount: emailAddresses.length,
          });
        } else {
          // 失敗: ステータスを「送信失敗」に
          await updateNewsPageStatus(news.id, STATUS.FAILED);
          console.error(`[Newsletter Cron] Failed: ${news.title} - ${result.error}`);
          results.push({
            id: news.id,
            title: news.title,
            success: false,
            error: result.error,
          });
        }
      } catch (error) {
        // 個別エラー
        await updateNewsPageStatus(news.id, STATUS.FAILED);
        console.error(`[Newsletter Cron] Error processing ${news.title}:`, error);
        results.push({
          id: news.id,
          title: news.title,
          success: false,
          error: String(error),
        });
      }
    }

    // 結果サマリー
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;
    console.log(`[Newsletter Cron] Complete: ${successCount} success, ${failCount} failed`);

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} newsletter(s)`,
      processed: results.length,
      successCount,
      failCount,
      results,
    });
  } catch (error) {
    console.error("[Newsletter Cron] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
