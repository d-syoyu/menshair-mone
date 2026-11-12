// @vitest-environment node
import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { verifySbHubSignature } from "@/lib/sb-hub-webhook";

const eventCreate = vi.fn();
const findUnique = vi.fn();
const update = vi.fn();
const updateMany = vi.fn();
const sendConfirmation = vi.fn();
const sendEmail = vi.fn();

const tx = {
  sbHubEvent: { create: (...a: unknown[]) => eventCreate(...a) },
  reservation: {
    findUnique: (...a: unknown[]) => findUnique(...a),
    update: (...a: unknown[]) => update(...a),
    updateMany: (...a: unknown[]) => updateMany(...a),
  },
};
vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: async (fn: (t: typeof tx) => unknown) => fn(tx),
    reservation: { findUnique: (...a: unknown[]) => findUnique(...a) },
  },
}));
vi.mock("@/lib/email", () => ({
  sendReservationConfirmationEmail: (...a: unknown[]) => sendConfirmation(...a),
  sendEmail: (...a: unknown[]) => sendEmail(...a),
}));

const { POST } = await import("./route");

const SECRET = "whsec_test_0123456789";

function sign(body: string, t = Math.floor(Date.now() / 1000), secret = SECRET) {
  return `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${body}`).digest("hex")}`;
}

function deliver(event: unknown, signature?: string) {
  const body = JSON.stringify(event);
  return POST(new Request("https://mone.example.com/api/sb-hub/webhook", {
    method: "POST",
    headers: { "content-type": "application/json", "x-sb-hub-signature": signature ?? sign(body) },
    body,
  }) as never);
}

const stateChanged = (state: string, version = 1) => ({
  id: "evt_1", type: "booking.state_changed", data: { externalId: "res_1", version, state, sbReservationNo: "BE123" },
});

beforeEach(() => {
  vi.stubEnv("SB_HUB_WEBHOOK_SECRET", SECRET);
  for (const fn of [eventCreate, findUnique, update, updateMany, sendConfirmation, sendEmail]) fn.mockReset();
  eventCreate.mockResolvedValue({});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("verifySbHubSignature", () => {
  it("accepts the right signature and refuses old, wrong or missing ones", () => {
    const now = 1_800_000_000;
    expect(verifySbHubSignature("{}", sign("{}", now), SECRET, now)).toBe(true);
    expect(verifySbHubSignature("{}", sign("{}", now - 301), SECRET, now)).toBe(false);
    expect(verifySbHubSignature("{}", sign("{}", now, "other"), SECRET, now)).toBe(false);
    expect(verifySbHubSignature("{ }", sign("{}", now), SECRET, now)).toBe(false);
    expect(verifySbHubSignature("{}", null, SECRET, now)).toBe(false);
    expect(verifySbHubSignature("{}", `t=${now},v1=zz`, SECRET, now)).toBe(false);
  });

  it("accepts either signature while the secret is being replaced", () => {
    const now = 1_800_000_000;
    const old = sign("{}", now, "old-secret").split(",")[1];
    expect(verifySbHubSignature("{}", `${sign("{}", now)},${old}`, "old-secret", now)).toBe(true);
  });
});

describe("POST /api/sb-hub/webhook", () => {
  it("does not exist while the hub is not configured", async () => {
    vi.stubEnv("SB_HUB_WEBHOOK_SECRET", "");
    expect((await deliver(stateChanged("APPLIED"))).status).toBe(404);
  });

  it("refuses a bad signature without touching the database", async () => {
    const res = await deliver(stateChanged("APPLIED"), sign("other body"));
    expect(res.status).toBe(401);
    expect(eventCreate).not.toHaveBeenCalled();
  });

  it("records the state and the SB reservation number", async () => {
    findUnique.mockResolvedValue({ id: "res_1", sbVersion: 1, sbRequested: false, status: "CONFIRMED" });
    expect((await deliver(stateChanged("APPLIED"))).status).toBe(200);
    expect(eventCreate).toHaveBeenCalledWith({ data: { id: "evt_1", type: "booking.state_changed" } });
    expect(update).toHaveBeenCalledWith({ where: { id: "res_1" }, data: { sbState: "APPLIED", sbReservationNo: "BE123", sbRequested: false } });
    expect(sendConfirmation).not.toHaveBeenCalled();
  });

  it("confirms a request once SB has it, and tells the customer", async () => {
    findUnique
      .mockResolvedValueOnce({ id: "res_1", sbVersion: 1, sbRequested: true, status: "CONFIRMED" })
      .mockResolvedValueOnce({ id: "res_1", date: new Date("2026-11-20"), startTime: "10:00", endTime: "11:00", menuSummary: "カット",
        totalPrice: 5000, couponDiscount: 0, note: null, user: { name: "山田", email: "c@example.com" } });
    expect((await deliver(stateChanged("APPLIED"))).status).toBe(200);
    expect(sendConfirmation).toHaveBeenCalledWith("c@example.com", expect.objectContaining({ reservationId: "res_1" }));
  });

  it("cancels a declined request and tells the customer", async () => {
    findUnique
      .mockResolvedValueOnce({ id: "res_1", sbVersion: 1, sbRequested: true, status: "CONFIRMED" })
      .mockResolvedValueOnce({ id: "res_1", date: new Date("2026-11-20"), startTime: "10:00", menuSummary: "カット", user: { name: "<b>", email: "c@example.com" } });
    expect((await deliver(stateChanged("DECLINED"))).status).toBe(200);
    expect(update).toHaveBeenCalledWith({ where: { id: "res_1" }, data: { status: "CANCELLED", sbState: "NONE", sbRequested: false } });
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "c@example.com", html: expect.stringContaining("&lt;b&gt;") }));
  });

  it("ignores news about an older version", async () => {
    findUnique.mockResolvedValue({ id: "res_1", sbVersion: 3, sbRequested: false, status: "CONFIRMED" });
    expect((await deliver(stateChanged("APPLIED", 2))).status).toBe(200);
    expect(update).not.toHaveBeenCalled();
  });

  it("marks a booking changed in SB for review without changing it", async () => {
    const res = await deliver({ id: "evt_2", type: "booking.changed_in_sb", data: { externalId: "res_1", removed: true } });
    expect(res.status).toBe(200);
    expect(updateMany).toHaveBeenCalledWith({ where: { id: "res_1" }, data: { sbNeedsReview: true } });
    expect(update).not.toHaveBeenCalled();
  });

  it("answers a repeated event without applying it again", async () => {
    eventCreate.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "x" }));
    const res = await deliver(stateChanged("APPLIED"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, duplicate: true });
    expect(update).not.toHaveBeenCalled();
  });

  it("asks SOGA to send again when applying fails", async () => {
    findUnique.mockRejectedValue(new Error("db down"));
    expect((await deliver(stateChanged("APPLIED"))).status).toBe(500);
  });
});
