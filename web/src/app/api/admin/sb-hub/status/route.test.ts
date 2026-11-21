// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const updateMany = vi.fn();
const findUnique = vi.fn();
const findMany = vi.fn();
const sendConfirmed = vi.fn();
const checkAdminAuth = vi.fn();
const settle = vi.fn();
let hubEnabled = true;

vi.mock("@/lib/db", () => ({
  prisma: {
    reservation: {
      updateMany: (...a: unknown[]) => updateMany(...a),
      findUnique: (...a: unknown[]) => findUnique(...a),
      findMany: (...a: unknown[]) => findMany(...a),
    },
  },
}));
vi.mock("@/lib/auth", () => ({ checkAdminAuth: () => checkAdminAuth() }));
vi.mock("@/lib/sb-hub", () => ({
  getSbShopStatus: vi.fn(),
  sbHubEnabled: () => hubEnabled,
  settleSbBooking: (...a: unknown[]) => settle(...a),
  SB_RESERVATION_NO: /^YH\d{8}$/,
}));
vi.mock("@/lib/sb-hub-review", async (original) => ({
  ...(await original<typeof import("@/lib/sb-hub-review")>()),
  sendRequestConfirmedEmail: (...a: unknown[]) => sendConfirmed(...a),
}));

const { PATCH } = await import("./route");
const { sbReviewWhere } = await import("@/lib/sb-hub-review");

function patch(body: unknown, origin = "https://mone.example.com") {
  return PATCH(new Request("https://mone.example.com/api/admin/sb-hub/status", {
    method: "PATCH",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify(body),
  }));
}

beforeEach(() => {
  for (const fn of [updateMany, findUnique, findMany, sendConfirmed, checkAdminAuth, settle]) fn.mockReset();
  hubEnabled = true;
  checkAdminAuth.mockResolvedValue({ error: null, user: { id: "admin", email: "owner@mone.example", role: "ADMIN" } });
  settle.mockResolvedValue({ kind: "SETTLED", sbReservationNo: "YH71841322" });
  sendConfirmed.mockResolvedValue(true);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("PATCH /api/admin/sb-hub/status", () => {
  const confirmed = { status: "CONFIRMED", sbVersion: 1, sbState: "VERIFY_REQUIRED" };
  const cancelled = { status: "CANCELLED", sbVersion: 2, sbState: "APPLIED" };
  const inSb = { reservationId: "res_1", action: "in_sb", sbReservationNo: "YH71841322" };

  it("tells SOGA first, then confirms a request once and emails the customer", async () => {
    findUnique.mockResolvedValue(confirmed);
    updateMany.mockResolvedValueOnce({ count: 1 });
    const res = await patch(inSb);
    expect(await res.json()).toEqual({ success: true, confirmedRequest: true, emailSent: true });
    expect(settle).toHaveBeenCalledWith({ reservationId: "res_1", version: 1, outcome: "IN_SB", sbReservationNo: "YH71841322",
      actor: "owner@mone.example" });
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "res_1", status: "CONFIRMED", sbRequested: true },
      data: { sbNeedsReview: false, sbRequested: false, sbState: "APPLIED", sbReservationNo: "YH71841322" },
    });
    expect(sendConfirmed).toHaveBeenCalledWith("res_1");
  });

  it("marks a confirmed (not requested) booking as in SB without emailing", async () => {
    findUnique.mockResolvedValue(confirmed);
    updateMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 1 });
    expect(await (await patch(inSb)).json()).toEqual({ success: true, confirmedRequest: false });
    expect(sendConfirmed).not.toHaveBeenCalled();
  });

  it("says when the confirmation email could not be sent", async () => {
    findUnique.mockResolvedValue(confirmed);
    updateMany.mockResolvedValueOnce({ count: 1 });
    sendConfirmed.mockResolvedValue(false);
    expect(await (await patch(inSb)).json()).toEqual({ success: true, confirmedRequest: true, emailSent: false });
  });

  it("changes nothing when SOGA cannot be reached, so the owner can press again", async () => {
    findUnique.mockResolvedValue(confirmed);
    settle.mockResolvedValue({ kind: "UNREACHABLE" });
    expect((await patch(inSb)).status).toBe(503);
    expect(updateMany).not.toHaveBeenCalled();
    expect(sendConfirmed).not.toHaveBeenCalled();
  });

  it("shows SOGA's refusal and changes nothing", async () => {
    findUnique.mockResolvedValue(confirmed);
    settle.mockResolvedValue({ kind: "REFUSED", reason: "NUMBER_IN_USE" });
    const res = await patch(inSb);
    expect(res.status).toBe(409);
    expect((await res.json()).reason).toBe("NUMBER_IN_USE");
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("needs the SB number while connected", async () => {
    findUnique.mockResolvedValue(confirmed);
    expect((await patch({ reservationId: "res_1", action: "in_sb" })).status).toBe(400);
    expect((await patch({ ...inSb, sbReservationNo: "12345678" })).status).toBe(400);
    expect(settle).not.toHaveBeenCalled();
  });

  it("records locally only when SOGA never had the booking, or the hub is off", async () => {
    findUnique.mockResolvedValue({ ...confirmed, sbVersion: 0, sbState: "NONE" });
    updateMany.mockResolvedValue({ count: 0 });
    expect((await patch({ reservationId: "res_1", action: "in_sb" })).status).toBe(200);
    hubEnabled = false;
    findUnique.mockResolvedValue(confirmed);
    expect((await patch({ reservationId: "res_1", action: "in_sb" })).status).toBe(200);
    expect(settle).not.toHaveBeenCalled();
  });

  it("settles a cancelled booking gone from SB through SOGA", async () => {
    findUnique.mockResolvedValue(cancelled);
    updateMany.mockResolvedValue({ count: 1 });
    expect((await patch({ reservationId: "res_1", action: "not_in_sb" })).status).toBe(200);
    expect(settle).toHaveBeenCalledWith(expect.objectContaining({ version: 2, outcome: "NOT_IN_SB" }));
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "res_1", status: "CANCELLED" },
      data: { sbNeedsReview: false, sbRequested: false, sbState: "NONE" },
    });
  });

  it("refuses an action that does not match the reservation's status", async () => {
    findUnique.mockResolvedValue(cancelled);
    expect((await patch(inSb)).status).toBe(409);
    findUnique.mockResolvedValue(null);
    expect((await patch(inSb)).status).toBe(404);
    expect(settle).not.toHaveBeenCalled();
  });

  it("keeps the old 'reviewed' behaviour when no action is given", async () => {
    updateMany.mockResolvedValue({ count: 1 });
    expect((await patch({ reservationId: "res_1" })).status).toBe(200);
    expect(updateMany).toHaveBeenCalledWith({ where: { id: "res_1" }, data: { sbNeedsReview: false } });
    expect(settle).not.toHaveBeenCalled();
  });

  it("refuses other origins and unknown actions", async () => {
    expect((await patch(inSb, "https://evil.example.com")).status).toBe(403);
    expect((await patch({ reservationId: "res_1", action: "delete" })).status).toBe(400);
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("requires an admin", async () => {
    checkAdminAuth.mockResolvedValue({ error: new Response(null, { status: 401 }), user: null });
    expect((await patch(inSb)).status).toBe(401);
    expect(settle).not.toHaveBeenCalled();
  });
});

describe("sbReviewWhere", () => {
  it("lists stuck PENDING only after 30 minutes, and unknown results only from today on", () => {
    const now = new Date("2026-11-21T22:00:00Z"); // JST 11/22 07:00
    const where = sbReviewWhere(now);
    const pending = where.OR[3] as { date: { gte: Date }; createdAt: { lt: Date } };
    expect(pending.createdAt.lt.toISOString()).toBe("2026-11-21T21:30:00.000Z");
    expect(pending.date.gte.toISOString()).toBe("2026-11-22T00:00:00.000Z");
  });
});
