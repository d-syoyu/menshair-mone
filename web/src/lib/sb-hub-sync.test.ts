// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
const update = vi.fn();
const putSbBooking = vi.fn();
const deleteSbBooking = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: { reservation: { findUnique: (...a: unknown[]) => findUnique(...a), update: (...a: unknown[]) => update(...a) } },
}));
vi.mock("@/lib/sb-hub", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/sb-hub")>()),
  putSbBooking: (...a: unknown[]) => putSbBooking(...a),
  deleteSbBooking: (...a: unknown[]) => deleteSbBooking(...a),
}));

const { admitPublicReservation, syncReservationToSb, withdrawReservationFromSb } = await import("./sb-hub-sync");

const row = (over: Record<string, unknown> = {}) => ({
  id: "res_1", date: new Date("2026-11-20T00:00:00Z"), startTime: "10:00", endTime: "11:00",
  status: "CONFIRMED", sbState: "NONE", sbVersion: 0, user: { name: "山田" }, ...over,
});

function enableHub() {
  vi.stubEnv("SB_HUB_URL", "https://admin.soga.test/hub");
  vi.stubEnv("SB_HUB_API_KEY", "sbh_key");
  vi.stubEnv("SB_HUB_SHOP_ID", "shop_1");
  vi.stubEnv("SB_HUB_STAFF_ID", "staff_1");
}

beforeEach(() => {
  vi.unstubAllEnvs();
  for (const fn of [findUnique, update, putSbBooking, deleteSbBooking]) fn.mockReset();
  // nextVersion: the increment returns the new version
  update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => (data.sbVersion ? { sbVersion: 1 } : {}));
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("hub off", () => {
  it("changes nothing and calls nobody", async () => {
    expect(await admitPublicReservation("res_1")).toBe("DISABLED");
    await syncReservationToSb("res_1");
    expect(await withdrawReservationFromSb("res_1", 3, "PENDING")).toBe(true);
    expect(findUnique).not.toHaveBeenCalled();
    expect(putSbBooking).not.toHaveBeenCalled();
    expect(deleteSbBooking).not.toHaveBeenCalled();
  });
});

describe("hub on", () => {
  beforeEach(enableHub);

  it("a customer booking SOGA confirms waits for SB", async () => {
    findUnique.mockResolvedValue(row());
    putSbBooking.mockResolvedValue("CONFIRMED");
    expect(await admitPublicReservation("res_1")).toBe("CONFIRMED");
    expect(putSbBooking.mock.calls[0][0]).toMatchObject({ reservationId: "res_1", version: 1, date: "2026-11-20", origin: "PUBLIC" });
    expect(update).toHaveBeenLastCalledWith({ where: { id: "res_1" }, data: { sbState: "PENDING", sbRequested: false } });
  });

  it("a request is kept as a request", async () => {
    findUnique.mockResolvedValue(row());
    putSbBooking.mockResolvedValue("REQUESTED");
    expect(await admitPublicReservation("res_1")).toBe("REQUESTED");
    expect(update).toHaveBeenLastCalledWith({ where: { id: "res_1" }, data: { sbState: "PENDING", sbRequested: true } });
  });

  it.each(["CONFLICT", "PAUSED", "UNREACHABLE"])("a refused customer booking (%s) is left for the caller to remove", async (answer) => {
    findUnique.mockResolvedValue(row());
    putSbBooking.mockResolvedValue(answer);
    expect(await admitPublicReservation("res_1")).toBe(answer);
    expect(update).toHaveBeenCalledTimes(1); // only the version
  });

  it("an admin booking SOGA could not take stays, marked for manual entry", async () => {
    findUnique.mockResolvedValue(row());
    putSbBooking.mockResolvedValue("UNREACHABLE");
    await syncReservationToSb("res_1", "ADMIN");
    expect(putSbBooking.mock.calls[0][0]).toMatchObject({ origin: "ADMIN" });
    expect(update).toHaveBeenLastCalledWith({ where: { id: "res_1" }, data: { sbState: "MANUAL_REQUIRED", sbNeedsReview: true } });
  });

  it("a cancelled booking that SOGA knows is withdrawn", async () => {
    findUnique.mockResolvedValue(row({ status: "CANCELLED", sbState: "APPLIED", sbVersion: 1 }));
    deleteSbBooking.mockResolvedValue(true);
    await syncReservationToSb("res_1");
    expect(deleteSbBooking).toHaveBeenCalledWith("res_1", 1, expect.anything());
    expect(update).toHaveBeenLastCalledWith({ where: { id: "res_1" }, data: { sbState: "NONE", sbRequested: false } });
  });

  it("a completed booking is left in SB", async () => {
    findUnique.mockResolvedValue(row({ status: "COMPLETED", sbState: "APPLIED" }));
    await syncReservationToSb("res_1");
    expect(putSbBooking).not.toHaveBeenCalled();
    expect(deleteSbBooking).not.toHaveBeenCalled();
  });

  it("deleting a booking never sent needs no call", async () => {
    expect(await withdrawReservationFromSb("res_1", 0, "NONE")).toBe(true);
    expect(deleteSbBooking).not.toHaveBeenCalled();
    deleteSbBooking.mockResolvedValue(false);
    expect(await withdrawReservationFromSb("res_1", 2, "APPLIED")).toBe(false);
    expect(deleteSbBooking).toHaveBeenCalledWith("res_1", 3, expect.anything());
  });
});
