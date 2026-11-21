// src/app/api/admin/sb-hub/status/route.ts
// 管理画面の「SB連携」欄：連携の状態と要確認の予約。画面を開いた時だけ呼ぶ（定期的に読み直さない、設計 5-4）。
// オーナーがSBの予約表を見て確かめた結果も、ここで受ける（PATCH）。

import { NextResponse } from "next/server";
import { z } from "zod";
import { checkAdminAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSbShopStatus, SB_RESERVATION_NO, sbHubEnabled, settleSbBooking, type SbHubSettlementRefusal } from "@/lib/sb-hub";
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
  // in_sb の時の、SBの予約番号。連携している間は必須（SOGAがこの番号の予約として覚える）。
  sbReservationNo: z.string().regex(SB_RESERVATION_NO).optional(),
});

const cleared = { sbNeedsReview: false, sbRequested: false };

const REFUSAL_MESSAGES: Record<SbHubSettlementRefusal, string> = {
  STALE_VERSION: "予約がSOGAに送った後に変わっています。画面を読み直してから、もう一度確かめてください",
  NOT_SETTLEABLE: "SOGAがまだこの予約を処理中か、すでに反映済みです。しばらくしてから画面を読み直してください",
  NUMBER_IN_USE: "その予約番号は、別の予約のものとしてSOGAに登録されています。番号を確かめてください",
};

/**
 * オーナーがSBで確かめた結果。連携している間は、まずSOGAに伝え（settlement）、SOGAが受けた時だけMONËの予約を変える。
 * SOGAに届かない時は何も変えない（一覧に残り、もう一度押せる）。SOGAが知らない予約・連携が無効の時は、MONËの中だけで残す。
 */
export async function PATCH(request: Request) {
  if (!sameOriginRequest(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { error, user } = await checkAdminAuth();
  if (error) return error;
  const parsed = decisionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "予約の指定かSBの予約番号（YHから始まる番号）が正しくありません" }, { status: 400 });
  }
  const { reservationId: id, action, sbReservationNo } = parsed.data;

  if (action === "reviewed") {
    const result = await prisma.reservation.updateMany({ where: { id }, data: { sbNeedsReview: false } });
    if (result.count === 0) return NextResponse.json({ error: "予約が見つかりません" }, { status: 404 });
    return NextResponse.json({ success: true });
  }

  const reservation = await prisma.reservation.findUnique({ where: { id }, select: { status: true, sbVersion: true, sbState: true } });
  if (!reservation) return NextResponse.json({ error: "予約が見つかりません" }, { status: 404 });
  const expected = action === "in_sb" ? "CONFIRMED" : "CANCELLED";
  if (reservation.status !== expected) {
    return NextResponse.json({
      error: action === "in_sb" ? "確定中の予約ではありません。画面を読み直してください" : "取り消した予約ではありません。画面を読み直してください",
    }, { status: 409 });
  }

  let number: string | null = action === "in_sb" ? sbReservationNo ?? null : null;
  // SOGAに一度も送っていない予約（版0）は、SOGAが知らないので伝えない。
  if (sbHubEnabled() && reservation.sbVersion > 0) {
    if (action === "in_sb" && !sbReservationNo) {
      return NextResponse.json({ error: "SBの予約番号（YHから始まる番号）を入れてください" }, { status: 400 });
    }
    const answer = await settleSbBooking({
      reservationId: id,
      version: reservation.sbVersion,
      outcome: action === "in_sb" ? "IN_SB" : "NOT_IN_SB",
      sbReservationNo,
      actor: user?.email ?? user?.id ?? "admin",
    });
    if (answer.kind === "UNREACHABLE") {
      return NextResponse.json({ error: "SOGAにつながりませんでした。何も変えていません。少し待ってから、もう一度押してください" }, { status: 503 });
    }
    if (answer.kind === "REFUSED") return NextResponse.json({ error: REFUSAL_MESSAGES[answer.reason], reason: answer.reason }, { status: 409 });
    if (answer.kind === "SETTLED") number = answer.sbReservationNo ?? number;
  }

  if (action === "in_sb") {
    const data = { ...cleared, sbState: "APPLIED" as const, ...(number ? { sbReservationNo: number } : {}) };
    // 申込を確定した時だけ確定メールを送る。SOGAからの「反映した」（Webhook）と重なっても、送るのはどちらか一方。
    const confirmed = await prisma.reservation.updateMany({ where: { id, status: "CONFIRMED", sbRequested: true }, data });
    if (confirmed.count === 0) {
      await prisma.reservation.updateMany({ where: { id, status: "CONFIRMED" }, data });
      return NextResponse.json({ success: true, confirmedRequest: false });
    }
    const sent = await sendRequestConfirmedEmail(id).catch((err) => {
      console.error("[SB hub] failed to send confirmation email after owner check", { reservationId: id, err });
      return false;
    });
    return NextResponse.json({ success: true, confirmedRequest: true, emailSent: sent });
  }

  await prisma.reservation.updateMany({ where: { id, status: "CANCELLED" }, data: { ...cleared, sbState: "NONE" } });
  return NextResponse.json({ success: true });
}

