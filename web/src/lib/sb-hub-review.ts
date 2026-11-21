// src/lib/sb-hub-review.ts
// SBの反映をオーナーが確かめる予約の決まりと、申込（SBで確かめてから確定する予約）が確定した時の確定メール。
// 確定メールは、SOGAから「SBに反映した」と届いた時（Webhook）と、オーナーがSBで確かめた時（管理画面）の両方で使う。

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendReservationConfirmationEmail } from "@/lib/email";
import { getJstTodayDbDate } from "@/lib/date-utils";

/** SOGAに送ってからこれだけ経っても「反映待ち」のままなら、止まっているとみなして確認一覧に出す。 */
const PENDING_STUCK_MS = 30 * 60_000;

/** オーナーが確かめる予約。過ぎた日の「反映待ち・不明」は出さない（要確認の印と申込は日付に関係なく出す）。 */
export function sbReviewWhere(now = new Date()): Prisma.ReservationWhereInput & { OR: Prisma.ReservationWhereInput[] } {
  const today = getJstTodayDbDate(now);
  return {
    OR: [
      { sbNeedsReview: true },
      { sbRequested: true, status: "CONFIRMED" },
      {
        date: { gte: today },
        status: { in: ["CONFIRMED", "CANCELLED"] },
        sbState: { in: ["VERIFY_REQUIRED", "MANUAL_REQUIRED"] },
      },
      {
        date: { gte: today },
        status: { in: ["CONFIRMED", "CANCELLED"] },
        sbState: "PENDING",
        createdAt: { lt: new Date(now.getTime() - PENDING_STUCK_MS) },
      },
    ],
  };
}

/** 送れた時 true。メールアドレスのないお客様・送信の失敗は false。 */
export async function sendRequestConfirmedEmail(reservationId: string): Promise<boolean> {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { user: { select: { name: true, email: true } } },
  });
  const email = reservation?.user?.email;
  if (!reservation || !email) return false;
  const result = await sendReservationConfirmationEmail(email, {
    reservationId: reservation.id,
    customerName: reservation.user?.name || "お客様",
    date: new Date(reservation.date),
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    menuSummary: reservation.menuSummary,
    totalPrice: reservation.totalPrice,
    couponDiscount: reservation.couponDiscount,
    note: reservation.note || undefined,
  });
  return result.success;
}
