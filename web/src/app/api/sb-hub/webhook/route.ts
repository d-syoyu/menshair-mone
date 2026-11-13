// src/app/api/sb-hub/webhook/route.ts
// SOGAの共通窓口からのWebhook（設計 docs/salonboard-hub-design-2026-11-12.md 3-3・5-3の5）。
// 署名と時刻を確かめ、イベントIDで重複を除き、予約のSBへの反映の状態を更新する。
// SB上で手で変えられた予約は「要確認」にするだけで、MONËの予約を自動で変えない・消さない。

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { clearSbOccupancyCache } from "@/lib/sb-hub";
import { sbHubEventSchema, verifySbHubSignature, type SbHubEvent } from "@/lib/sb-hub-webhook";
import { sendEmail, sendReservationConfirmationEmail } from "@/lib/email";
import { formatJstDate } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 64 * 1024;

type Followup =
  | { kind: "confirmed"; reservationId: string }
  | { kind: "declined"; reservationId: string }
  | null;

async function apply(event: SbHubEvent, tx: Prisma.TransactionClient): Promise<Followup> {
  if (event.type === "booking.state_changed") {
    const { externalId, version, state, sbReservationNo } = event.data;
    const reservation = await tx.reservation.findUnique({
      where: { id: externalId },
      select: { id: true, sbVersion: true, sbRequested: true, status: true },
    });
    // 知らない予約、または古い版への知らせ（その後に変えている）は捨てる。
    if (!reservation || version < reservation.sbVersion) return null;
    if (state === "DECLINED") {
      if (!reservation.sbRequested || reservation.status !== "CONFIRMED") return null;
      await tx.reservation.update({
        where: { id: externalId },
        data: { status: "CANCELLED", sbState: "NONE", sbRequested: false },
      });
      return { kind: "declined", reservationId: externalId };
    }
    const confirmedNow = state === "APPLIED" && reservation.sbRequested;
    await tx.reservation.update({
      where: { id: externalId },
      data: {
        sbState: state,
        ...(sbReservationNo ? { sbReservationNo } : {}),
        ...(state === "APPLIED" ? { sbRequested: false } : {}),
        ...(state === "VERIFY_REQUIRED" || state === "MANUAL_REQUIRED" ? { sbNeedsReview: true } : {}),
      },
    });
    return confirmedNow && reservation.status === "CONFIRMED" ? { kind: "confirmed", reservationId: externalId } : null;
  }
  if (event.type === "booking.changed_in_sb") {
    await tx.reservation.updateMany({ where: { id: event.data.externalId }, data: { sbNeedsReview: true } });
    return null;
  }
  // shop.status_changed・occupancy.changed はここに来ない（POST でDBに触れずに受ける）。
  return null;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

async function followUp(followup: Followup) {
  if (!followup) return;
  const reservation = await prisma.reservation.findUnique({
    where: { id: followup.reservationId },
    include: { user: { select: { name: true, email: true } } },
  });
  const email = reservation?.user?.email;
  if (!reservation || !email) return;
  const name = reservation.user?.name || "お客様";
  if (followup.kind === "confirmed") {
    await sendReservationConfirmationEmail(email, {
      reservationId: reservation.id,
      customerName: name,
      date: new Date(reservation.date),
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      menuSummary: reservation.menuSummary,
      totalPrice: reservation.totalPrice,
      couponDiscount: reservation.couponDiscount,
      note: reservation.note || undefined,
    });
    return;
  }
  const when = `${formatJstDate(reservation.date, "jp")} ${reservation.startTime}`;
  const text = `${name} 様\n\nご予約の申込（${when}〜、${reservation.menuSummary}）は、空きを確認できなかったため、お受けできませんでした。\n申し訳ございません。お手数ですが、別の日時でお申込みいただくか、お店にご連絡ください。\n\nMen's hair MONË`;
  await sendEmail({
    to: email,
    subject: "【MONË】ご予約の申込についてのお知らせ",
    text,
    html: `<p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>`,
  });
}

export async function POST(request: NextRequest) {
  const secret = process.env.SB_HUB_WEBHOOK_SECRET;
  // 連携していない間は、受け口ごとないものとして答える。
  if (!secret) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return NextResponse.json({ error: "too_large" }, { status: 413 });
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ error: "too_large" }, { status: 413 });

  if (!verifySbHubSignature(raw, request.headers.get("x-sb-hub-signature"), secret)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const parsed = sbHubEventSchema.safeParse(json);
  if (!parsed.success) {
    // 知らない種類のイベントは、送り直されないよう受けたことにする。
    const eventId = (json as { id?: unknown })?.id;
    return NextResponse.json({ ok: true, ignored: typeof eventId === "string" }, { status: 200 });
  }
  const event = parsed.data;

  // shop.status_changed・occupancy.changed：覚えている空き枠を捨てるだけ（次に聞いた時に取り直す）。
  // 何度届いても同じ結果なので、イベントを記録せず、DB（Neon）を起こさない。
  if (event.type === "shop.status_changed" || event.type === "occupancy.changed") {
    clearSbOccupancyCache();
    return NextResponse.json({ ok: true });
  }

  let followup: Followup;
  try {
    // イベントの記録と反映を1つのトランザクションで行う。失敗すれば記録も残らず、SOGAが送り直す。
    followup = await prisma.$transaction(async (tx) => {
      await tx.sbHubEvent.create({ data: { id: event.id, type: event.type } });
      return apply(event, tx);
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    console.error("[SB hub] webhook failed", { type: event.type, error: error instanceof Error ? error.name : "unknown" });
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }

  await followUp(followup).catch((error) => {
    console.error("[SB hub] webhook email failed", { error: error instanceof Error ? error.name : "unknown" });
  });
  return NextResponse.json({ ok: true });
}
