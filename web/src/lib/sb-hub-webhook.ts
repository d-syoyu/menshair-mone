// src/lib/sb-hub-webhook.ts
// SOGAの共通窓口からのWebhook（設計 docs/salonboard-hub-design-2026-11-12.md 3-3・5-3の5）。
// 署名：X-Sb-Hub-Signature: t=<秒>,v1=<HMAC-SHA256(秘密, t + "." + 本文) の16進>

import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

/** これより古い署名は受けない。 */
export const SB_HUB_SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

export function verifySbHubSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): boolean {
  if (!header || !secret) return false;
  const parts = new Map<string, string[]>();
  for (const part of header.split(",")) {
    const index = part.indexOf("=");
    if (index <= 0) continue;
    const key = part.slice(0, index).trim();
    parts.set(key, [...(parts.get(key) ?? []), part.slice(index + 1).trim()]);
  }
  const t = parts.get("t")?.[0];
  if (!t || !/^\d{1,12}$/.test(t)) return false;
  if (Math.abs(nowSeconds - Number(t)) > SB_HUB_SIGNATURE_TOLERANCE_SECONDS) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest();
  // 秘密の入れ替えの間は、v1 が2つ届くことがある。どれか1つが合えばよい。
  return (parts.get("v1") ?? []).some((candidate) => {
    if (!/^[0-9a-f]{64}$/.test(candidate)) return false;
    return timingSafeEqual(Buffer.from(candidate, "hex"), expected);
  });
}

const id = z.string().min(1).max(100);

const bookingStateChanged = z.object({
  type: z.literal("booking.state_changed"),
  data: z.object({
    externalId: id,
    version: z.number().int().nonnegative(),
    // DECLINED：申込（REQUESTED）として受けた予約が、SBで確かめられず成り立たなかった。
    state: z.enum(["PENDING", "APPLIED", "VERIFY_REQUIRED", "MANUAL_REQUIRED", "DECLINED"]),
    sbReservationNo: z.string().max(40).nullish(),
  }),
});

const bookingChangedInSb = z.object({
  type: z.literal("booking.changed_in_sb"),
  data: z.object({ externalId: id }).passthrough(),
});

const shopStatusChanged = z.object({ type: z.literal("shop.status_changed"), data: z.object({}).passthrough() });
const occupancyChanged = z.object({
  type: z.literal("occupancy.changed"),
  data: z.object({ dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(400) }),
});

export const sbHubEventSchema = z.object({ id }).and(
  z.discriminatedUnion("type", [bookingStateChanged, bookingChangedInSb, shopStatusChanged, occupancyChanged])
);

export type SbHubEvent = z.infer<typeof sbHubEventSchema>;
