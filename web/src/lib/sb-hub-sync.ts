// src/lib/sb-hub-sync.ts
// MONËの予約をSOGAの共通窓口へ伝える（設計 docs/salonboard-hub-design-2026-11-12.md 5-3）。
// 連携が無効（sbHubConfig() が null）の間は、どの関数も何もしない。

import { prisma } from "@/lib/db";
import { dbDateToJstDateString } from "@/lib/date-utils";
import {
  deleteSbBooking,
  putSbBooking,
  sbHubConfig,
  type SbHubBookingAnswer,
  type SbHubConfig,
  type SbHubOrigin,
} from "@/lib/sb-hub";

type ReservationForSb = {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: string;
  sbState: string;
  sbVersion: number;
  user: { name: string | null } | null;
};

const select = {
  id: true, date: true, startTime: true, endTime: true, status: true, sbState: true, sbVersion: true,
  user: { select: { name: true } },
} as const;

/** 版を1つ上げて返す。同じ予約を同時に変えても、版は重ならない。 */
async function nextVersion(id: string): Promise<number> {
  const row = await prisma.reservation.update({ where: { id }, data: { sbVersion: { increment: 1 } }, select: { sbVersion: true } });
  return row.sbVersion;
}

async function put(reservation: ReservationForSb, origin: SbHubOrigin, config: SbHubConfig): Promise<SbHubBookingAnswer> {
  const version = await nextVersion(reservation.id);
  return putSbBooking({
    reservationId: reservation.id,
    version,
    date: dbDateToJstDateString(reservation.date),
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    customerName: reservation.user?.name ?? null,
    origin,
  }, { config });
}

/**
 * お客様の予約（受け口 PUBLIC）。MONËのDBに作った直後に呼ぶ。
 * CONFIRMED・REQUESTED は予約を残す。それ以外は呼び出し元が予約を消し、お客様に答えを返す。
 */
export async function admitPublicReservation(reservationId: string): Promise<SbHubBookingAnswer | "DISABLED"> {
  const config = sbHubConfig();
  if (!config) return "DISABLED";
  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId }, select });
  if (!reservation) return "UNREACHABLE";
  const answer = await put(reservation, "PUBLIC", config);
  if (answer === "CONFIRMED" || answer === "REQUESTED") {
    await prisma.reservation.update({
      where: { id: reservationId },
      data: { sbState: "PENDING", sbRequested: answer === "REQUESTED" },
    });
  }
  return answer;
}

/**
 * 管理画面での作成・変更・取り消しのあと、予約の今の状態をSOGAに伝える（受け口 ADMIN）。
 * 管理画面の予約は、SOGAに送れなくても残す。送れなかった時は「SBへ手で入れる」と「要確認」にする。
 */
export async function syncReservationToSb(reservationId: string, origin: SbHubOrigin = "ADMIN"): Promise<void> {
  const config = sbHubConfig();
  if (!config) return;
  try {
    const reservation = await prisma.reservation.findUnique({ where: { id: reservationId }, select });
    if (!reservation) return;
    if (reservation.status === "CONFIRMED") {
      const answer = await put(reservation, origin, config);
      const ok = answer === "CONFIRMED" || answer === "REQUESTED";
      await prisma.reservation.update({
        where: { id: reservationId },
        data: ok
          ? { sbState: "PENDING", sbRequested: answer === "REQUESTED" }
          : { sbState: "MANUAL_REQUIRED", sbNeedsReview: true },
      });
      return;
    }
    if (reservation.status === "CANCELLED" && reservation.sbState !== "NONE") {
      await cancelOnSb(reservation.id, config);
    }
    // 完了・無断キャンセルは、SBの予約をそのまま残す（過ぎた予約を消さない）。
  } catch (error) {
    console.error("[SB hub] sync failed", { reservationId, error: error instanceof Error ? error.name : "unknown" });
  }
}

async function cancelOnSb(reservationId: string, config: SbHubConfig) {
  const version = await nextVersion(reservationId);
  const ok = await deleteSbBooking(reservationId, version, { config });
  await prisma.reservation.update({
    where: { id: reservationId },
    data: ok ? { sbState: "NONE", sbRequested: false } : { sbState: "MANUAL_REQUIRED", sbNeedsReview: true },
  });
}

/** お客様の取り消し。予約を CANCELLED にしたあとに呼ぶ。 */
export async function cancelReservationOnSb(reservationId: string): Promise<void> {
  const config = sbHubConfig();
  if (!config) return;
  try {
    const row = await prisma.reservation.findUnique({ where: { id: reservationId }, select: { sbState: true } });
    if (row && row.sbState !== "NONE") await cancelOnSb(reservationId, config);
  } catch (error) {
    console.error("[SB hub] cancel failed", { reservationId, error: error instanceof Error ? error.name : "unknown" });
  }
}

/**
 * 予約の行を消す前に呼ぶ（管理画面の削除、SOGAが受けなかったお客様の予約）。
 * false は、SOGAにある予約を取り消せなかった（SBに残る）こと。
 */
export async function withdrawReservationFromSb(reservationId: string, currentVersion: number, sbState: string): Promise<boolean> {
  const config = sbHubConfig();
  if (!config || (sbState === "NONE" && currentVersion === 0)) return true;
  return deleteSbBooking(reservationId, currentVersion + 1, { config });
}
