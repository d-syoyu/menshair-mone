// src/app/api/cron/send-reminders/route.ts
// MONË - 前日リマインダーメール送信 Cron API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendReminderEmail } from "@/lib/email";

// Cron secret for authentication (set in environment variables)
const CRON_SECRET = process.env.CRON_SECRET;

// GET /api/cron/send-reminders - 翌日の予約に対してリマインダーメール送信
export async function GET(request: NextRequest) {
  try {
    // Cron認証チェック（Vercel Cronまたは手動実行用）
    const authHeader = request.headers.get("authorization");
    const cronSecret = request.nextUrl.searchParams.get("secret");

    // 認証: Authorizationヘッダーまたはクエリパラメータで認証
    if (CRON_SECRET) {
      const isValidAuth =
        authHeader === `Bearer ${CRON_SECRET}` ||
        cronSecret === CRON_SECRET;

      if (!isValidAuth) {
        console.log("[Reminder Cron] Unauthorized access attempt");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    console.log("[Reminder Cron] Starting reminder email job...");

    // 明日の日付を取得（日本時間）
    const now = new Date();
    const jstOffset = 9 * 60 * 60 * 1000; // JST = UTC+9
    const jstNow = new Date(now.getTime() + jstOffset);

    // 明日の開始と終了を計算
    const tomorrow = new Date(jstNow);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    console.log(`[Reminder Cron] Looking for reservations on: ${tomorrow.toISOString().split('T')[0]}`);

    // 明日のCONFIRMED予約を取得（メールアドレスがある顧客のみ）
    const reservations = await prisma.reservation.findMany({
      where: {
        date: {
          gte: tomorrow,
          lt: dayAfterTomorrow,
        },
        status: "CONFIRMED",
        user: {
          email: {
            not: null,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    console.log(`[Reminder Cron] Found ${reservations.length} reservations for tomorrow`);

    // 各予約に対してリマインダーメール送信
    const results: { success: number; failed: number; skipped: number } = {
      success: 0,
      failed: 0,
      skipped: 0,
    };

    for (const reservation of reservations) {
      if (!reservation.user?.email) {
        console.log(`[Reminder Cron] Skipping reservation ${reservation.id} - no email`);
        results.skipped++;
        continue;
      }

      try {
        const result = await sendReminderEmail(reservation.user.email, {
          reservationId: reservation.id,
          customerName: reservation.user.name || 'お客様',
          date: new Date(reservation.date),
          startTime: reservation.startTime,
          endTime: reservation.endTime,
          menuSummary: reservation.menuSummary,
          totalPrice: reservation.totalPrice,
          note: reservation.note,
        });

        if (result.success) {
          console.log(`[Reminder Cron] Sent reminder to ${reservation.user.email} for reservation ${reservation.id}`);
          results.success++;
        } else {
          console.error(`[Reminder Cron] Failed to send reminder to ${reservation.user.email}: ${result.error}`);
          results.failed++;
        }
      } catch (error) {
        console.error(`[Reminder Cron] Error sending reminder for reservation ${reservation.id}:`, error);
        results.failed++;
      }
    }

    console.log(`[Reminder Cron] Completed. Success: ${results.success}, Failed: ${results.failed}, Skipped: ${results.skipped}`);

    return NextResponse.json({
      message: "Reminder job completed",
      date: tomorrow.toISOString().split('T')[0],
      totalReservations: reservations.length,
      results,
    });
  } catch (error) {
    console.error("[Reminder Cron] Error:", error);
    return NextResponse.json(
      { error: "Failed to run reminder job" },
      { status: 500 }
    );
  }
}

// POST も許可（Vercel Cron は GET を使用するが、他のサービスは POST を使う場合がある）
export async function POST(request: NextRequest) {
  return GET(request);
}
