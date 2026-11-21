// src/app/api/admin/sb-hub/status/route.ts
// 管理画面の「SB連携」欄：連携の状態と要確認の予約。画面を開いた時だけ呼ぶ（定期的に読み直さない、設計 5-4）。
// オーナーがSBの予約表を見て確かめた結果も、ここで受ける（PATCH）。

import { NextResponse } from "next/server";
import { z } from "zod";
import { checkAdminAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSbShopStatus, sbHubEnabled } from "@/lib/sb-hub";
import { dbDateToJstDateString } from "@/lib/date-utils";
import { sameOriginRequest } from "@/lib/login-guard";
import { sbReviewWhere, sendRequestConfirmedEmail } from "@/lib/sb-hub-review";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await checkAdminAuth();
  if (error) return error;
  if (!sbHubEnabled()) return NextResponse.json({ enabled: false });

  const [status, review] = await Promise.all([
    getSbShopStatus(),
    prisma.reservation.findMany({
      where: sbReviewWhere(),
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 50,
      select: {
        id: true, date: true, startTime: true, endTime: true, status: true, sbState: true,
        sbRequested: true, sbNeedsReview: true, user: { select: { name: true } },
      },
    }),
  ]);
  return NextResponse.json({
    enabled: true,
    status,
    review: review.map((r) => ({ ...r, date: dbDateToJstDateString(r.date), customerName: r.user?.name ?? null, user: undefined })),
  });
}

const decisionSchema = z.object({
  reservationId: z.string().min(1).max(100),
  // in_sb：SBの予約表にこの予約がある（手で入れた時も含む）。確定待ちの申込は、これで確定してお客様に確定メールを送る。
  // not_in_sb：取り消した予約が、SBの予約表から消えている（手で消した時も含む）。
  // reviewed：SB上の予約を手で直した（これまでの「確認済みにする」。完了・無断キャンセルの予約など）。
  action: z.enum(["in_sb", "not_in_sb", "reviewed"]).default("reviewed"),
});

const cleared = { sbNeedsReview: false, sbRequested: false };

/** オーナーがSBで確かめた結果を残す。SOGAには伝えない（SOGAの窓口に、その口がないため）。 */
export async function PATCH(request: Request) {
  if (!sameOriginRequest(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { error } = await checkAdminAuth();
  if (error) return error;
  const parsed = decisionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "予約が指定されていません" }, { status: 400 });
  }
  const { reservationId: id, action } = parsed.data;

  if (action === "in_sb") {
    // 申込を確定した時だけ確定メールを送る。同時にSOGAから「反映した」が届いても、送るのはどちらか一方。
    const confirmed = await prisma.reservation.updateMany({
      where: { id, status: "CONFIRMED", sbRequested: true },
      data: { ...cleared, sbState: "APPLIED" },
    });
    if (confirmed.count === 0) {
      const result = await prisma.reservation.updateMany({
        where: { id, status: "CONFIRMED" },
        data: { ...cleared, sbState: "APPLIED" },
      });
      if (result.count === 0) return notConfirmable(id, "確定中の予約ではありません。画面を読み直してください");
      return NextResponse.json({ success: true, confirmedRequest: false });
    }
    const sent = await sendRequestConfirmedEmail(id).catch((err) => {
      console.error("[SB hub] failed to send confirmation email after owner check", { reservationId: id, err });
      return false;
    });
    return NextResponse.json({ success: true, confirmedRequest: true, emailSent: sent });
  }

  if (action === "not_in_sb") {
    const result = await prisma.reservation.updateMany({
      where: { id, status: "CANCELLED" },
      data: { ...cleared, sbState: "NONE" },
    });
    if (result.count === 0) return notConfirmable(id, "取り消した予約ではありません。画面を読み直してください");
    return NextResponse.json({ success: true });
  }

  const result = await prisma.reservation.updateMany({ where: { id }, data: { sbNeedsReview: false } });
  if (result.count === 0) return NextResponse.json({ error: "予約が見つかりません" }, { status: 404 });
  return NextResponse.json({ success: true });
}

async function notConfirmable(id: string, message: string) {
  const exists = await prisma.reservation.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "予約が見つかりません" }, { status: 404 });
  return NextResponse.json({ error: message }, { status: 409 });
}
