// src/app/api/admin/newsletter/send/route.ts
// ニュースレター送信API（管理画面用）

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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

// POST /api/admin/newsletter/send
// { pageId: string } を受け取り、ニュースレターを送信
export async function POST(request: NextRequest) {
  try {
    // 管理者認証チェック
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // リクエストボディからpageIdを取得
    const body = await request.json();
    const { pageId } = body;

    if (!pageId) {
      return NextResponse.json(
        { error: "pageId is required" },
        { status: 400 }
      );
    }

    console.log(`[Newsletter Send] Processing page: ${pageId}`);

    // 1. ステータスを「送信中」に更新
    await updateNewsPageStatus(pageId, STATUS.SENDING);

    // 2. ニュースページの情報を取得
    const news = await getNewsPageById(pageId);
    if (!news) {
      await updateNewsPageStatus(pageId, STATUS.FAILED);
      return NextResponse.json(
        { error: "News page not found" },
        { status: 404 }
      );
    }

    console.log(`[Newsletter Send] News title: ${news.title}`);

    // 3. 配信先を取得
    const targets = await getNewsletterTargets(pageId);
    console.log(`[Newsletter Send] Targets: ${targets.join(", ") || "(none - sending to all)"}`);

    // 4. 配信対象の顧客を取得
    let customers: { email: string; name: string | null }[];

    if (targets.length === 0) {
      // 配信先が指定されていない場合は「すべて」として扱う
      customers = await filterCustomersByTargets({ targets: ["すべて"] });
    } else {
      customers = await filterCustomersByTargets({ targets });
    }

    if (customers.length === 0) {
      console.log("[Newsletter Send] No customers to send to");
      await updateNewsPageStatus(pageId, STATUS.SENT);
      return NextResponse.json({
        success: true,
        message: "No customers matched the target criteria",
        targets,
        sentCount: 0,
      });
    }

    const emailAddresses = customers.map((c) => c.email);
    console.log(`[Newsletter Send] Sending to ${emailAddresses.length} customers`);

    // 5. メールを送信
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

    // 一括送信（BCCで送信）
    const result = await sendEmail({
      to: emailAddresses,
      subject: `【MONË】${news.title}`,
      html,
      text,
    });

    // 6. ステータスを更新
    if (result.success) {
      await updateNewsPageStatus(pageId, STATUS.SENT);
      console.log(`[Newsletter Send] Email sent to ${emailAddresses.length} customers`);

      return NextResponse.json({
        success: true,
        message: "Newsletter sent successfully",
        targets,
        sentCount: emailAddresses.length,
      });
    } else {
      await updateNewsPageStatus(pageId, STATUS.FAILED);
      console.error("[Newsletter Send] Email send failed:", result.error);

      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Newsletter Send] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
