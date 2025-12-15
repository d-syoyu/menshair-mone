// src/app/api/notion-webhook/route.ts
// Notion Automation Webhook - ニュースメール送信用

import { NextRequest, NextResponse } from "next/server";
import { getNewsPageById, updateNewsPageStatus, getNewsletterTargets } from "@/lib/notion";
import { sendEmail, createNewsletterHtml, createNewsletterText } from "@/lib/email";
import { filterCustomersByTargets } from "@/lib/customer-filter";

// ステータス定数
const STATUS = {
  DRAFT: "下書き",
  SENDING: "送信中",
  SENT: "送信済み",
  FAILED: "送信失敗",
} as const;

// POST /api/notion-webhook
// Notionのボタンオートメーションから呼び出される
export async function POST(request: NextRequest) {
  try {
    // 1. リクエストの検証
    const body = await request.json();
    const { pageId, secret } = body;

    // シークレットキーの検証（環境変数で設定）
    const webhookSecret = process.env.NOTION_WEBHOOK_SECRET;
    if (webhookSecret && secret !== webhookSecret) {
      console.error("Invalid webhook secret");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!pageId) {
      return NextResponse.json(
        { error: "pageId is required" },
        { status: 400 }
      );
    }

    console.log(`[Notion Webhook] Processing page: ${pageId}`);

    // 2. ステータスを「送信中」に更新
    await updateNewsPageStatus(pageId, STATUS.SENDING);

    // 3. ニュースページの情報を取得
    const news = await getNewsPageById(pageId);
    if (!news) {
      await updateNewsPageStatus(pageId, STATUS.FAILED);
      return NextResponse.json(
        { error: "News page not found" },
        { status: 404 }
      );
    }

    console.log(`[Notion Webhook] News title: ${news.title}`);

    // 4. 配信先を取得
    const targets = await getNewsletterTargets(pageId);
    console.log(`[Notion Webhook] Targets: ${targets.join(", ") || "(none - sending to all)"}`);

    // 5. 配信対象の顧客を取得
    let customers: { email: string; name: string | null }[];

    if (targets.length === 0) {
      // 配信先が指定されていない場合は「すべて」として扱う
      customers = await filterCustomersByTargets({ targets: ["すべて"] });
    } else {
      customers = await filterCustomersByTargets({ targets });
    }

    if (customers.length === 0) {
      console.log("[Notion Webhook] No customers to send to");
      await updateNewsPageStatus(pageId, STATUS.SENT);
      return NextResponse.json({
        success: true,
        message: "No customers matched the target criteria",
        targets,
        sentCount: 0,
      });
    }

    const emailAddresses = customers.map((c) => c.email);
    console.log(`[Notion Webhook] Sending to ${emailAddresses.length} customers`);

    // 6. メールを送信
    const html = createNewsletterHtml({
      title: news.title,
      subtitle: news.subtitle || undefined,
      excerpt: news.excerpt || undefined,
      slug: news.slug,
      publishedAt: news.publishedAt || undefined,
    });

    const text = createNewsletterText({
      title: news.title,
      subtitle: news.subtitle || undefined,
      excerpt: news.excerpt || undefined,
      slug: news.slug,
      publishedAt: news.publishedAt || undefined,
    });

    // 一括送信（BCCで送信）
    const result = await sendEmail({
      to: emailAddresses,
      subject: `【MONË】${news.title}`,
      html,
      text,
    });

    // 7. ステータスを更新
    if (result.success) {
      await updateNewsPageStatus(pageId, STATUS.SENT);
      console.log(`[Notion Webhook] Email sent to ${emailAddresses.length} customers`);

      return NextResponse.json({
        success: true,
        message: "Newsletter sent successfully",
        targets,
        sentCount: emailAddresses.length,
      });
    } else {
      await updateNewsPageStatus(pageId, STATUS.FAILED);
      console.error("[Notion Webhook] Email send failed:", result.error);

      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Notion Webhook] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Webhook動作確認用
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/notion-webhook",
    method: "POST",
    body: {
      pageId: "Notion page ID (required)",
      secret: "Webhook secret (optional, if NOTION_WEBHOOK_SECRET is set)",
    },
    targets: [
      "すべて - 全顧客",
      "新規顧客 - 30日以内に初来店",
      "リピーター - 2回以上来店",
      "最近来店 - 60日以内に来店",
      "休眠顧客 - 90日以上未来店",
      "予約あり - 今後の予約がある",
      "[カテゴリ名]利用あり - そのカテゴリを利用したことがある",
      "[カテゴリ名]利用なし - そのカテゴリを利用したことがない",
    ],
    note: "配信先が未指定の場合は「すべて」として扱われます",
  });
}
