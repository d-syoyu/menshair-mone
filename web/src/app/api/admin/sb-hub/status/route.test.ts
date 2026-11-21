// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const updateMany = vi.fn();
const findUnique = vi.fn();
const findMany = vi.fn();
const sendConfirmed = vi.fn();
const checkAdminAuth = vi.fn();

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
vi.mock("@/lib/sb-hub", () => ({ getSbShopStatus: vi.fn(), sbHubEnabled: () => true }));
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
  for (const fn of [updateMany, findUnique, findMany, sendConfirmed, checkAdminAuth]) fn.mockReset();
  checkAdminAuth.mockResolvedValue({ error: null, user: { id: "admin", role: "ADMIN" } });
  sendConfirmed.mockResolvedValue(true);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("PATCH /api/admin/sb-hub/status", () => {
  it("confirms a request the owner found in SB, and sends the confirmation once", async () => {
    updateMany.mockResolvedValueOnce({ count: 1 });
    const res = await patch({ reservationId: "res_1", action: "in_sb" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, confirmedRequest: true, emailSent: true });
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "res_1", status: "CONFIRMED", sbRequested: true },
      data: { sbNeedsReview: false, sbRequested: false, sbState: "APPLIED" },
    });
    expect(sendConfirmed).toHaveBeenCalledWith("res_1");
  });

  it("marks a confirmed (not requested) booking as in SB without emailing", async () => {
    updateMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 1 });
    const res = await patch({ reservationId: "res_1", action: "in_sb" });
    expect(await res.json()).toEqual({ success: true, confirmedRequest: false });
    expect(updateMany).toHaveBeenLastCalledWith({
      where: { id: "res_1", status: "CONFIRMED" },
      data: { sbNeedsReview: false, sbRequested: false, sbState: "APPLIED" },
    });
    expect(sendConfirmed).not.toHaveBeenCalled();
  });

  it("says when the confirmation email could not be sent", async () => {
    updateMany.mockResolvedValueOnce({ count: 1 });
    sendConfirmed.mockResolvedValue(false);
    expect(await (await patch({ reservationId: "res_1", action: "in_sb" })).json()).toEqual({ success: true, confirmedRequest: true, emailSent: false });
  });

  it("refuses 'in SB' for a reservation that is no longer confirmed", async () => {
    updateMany.mockResolvedValue({ count: 0 });
    findUnique.mockResolvedValue({ id: "res_1" });
    expect((await patch({ reservationId: "res_1", action: "in_sb" })).status).toBe(409);
    expect(sendConfirmed).not.toHaveBeenCalled();
  });

  it("records a cancelled booking as gone from SB", async () => {
    updateMany.mockResolvedValue({ count: 1 });
    expect((await patch({ reservationId: "res_1", action: "not_in_sb" })).status).toBe(200);
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: "res_1", status: "CANCELLED" },
      data: { sbNeedsReview: false, sbRequested: false, sbState: "NONE" },
    });
  });

  it("keeps the old 'reviewed' behaviour when no action is given", async () => {
    updateMany.mockResolvedValue({ count: 1 });
    expect((await patch({ reservationId: "res_1" })).status).toBe(200);
    expect(updateMany).toHaveBeenCalledWith({ where: { id: "res_1" }, data: { sbNeedsReview: false } });
  });

  it("refuses other origins and unknown actions", async () => {
    expect((await patch({ reservationId: "res_1", action: "in_sb" }, "https://evil.example.com")).status).toBe(403);
    expect((await patch({ reservationId: "res_1", action: "delete" })).status).toBe(400);
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("requires an admin", async () => {
    checkAdminAuth.mockResolvedValue({ error: new Response(null, { status: 401 }), user: null });
    expect((await patch({ reservationId: "res_1", action: "in_sb" })).status).toBe(401);
    expect(updateMany).not.toHaveBeenCalled();
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
