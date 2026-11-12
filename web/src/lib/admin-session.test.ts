import { describe, expect, it } from "vitest";
import { ADMIN_SESSION_MAX_AGE, adminTokenClaims, adminTokenFresh, adminTokenMatches } from "./admin-session";

const now = 1_800_000_000;

describe("adminTokenFresh", () => {
  it("accepts an administrator token within 12 hours", () => {
    expect(adminTokenFresh({ role: "ADMIN", ...adminTokenClaims(0, now) }, now)).toBe(true);
    expect(adminTokenFresh({ role: "ADMIN", adminAt: now - ADMIN_SESSION_MAX_AGE + 1 }, now)).toBe(true);
  });

  it("refuses one at or after 12 hours, one without its sign-in time, and one from the future", () => {
    expect(adminTokenFresh({ role: "ADMIN", adminAt: now - ADMIN_SESSION_MAX_AGE }, now)).toBe(false);
    expect(adminTokenFresh({ role: "ADMIN" }, now)).toBe(false);
    expect(adminTokenFresh({ role: "ADMIN", adminAt: now + 3600 }, now)).toBe(false);
  });

  it("never treats a customer token as an administrator's", () => {
    expect(adminTokenFresh({ role: "CUSTOMER", adminAt: now }, now)).toBe(false);
    expect(adminTokenFresh(null, now)).toBe(false);
  });
});

describe("adminTokenMatches", () => {
  it("accepts the same administrator at the same session version", () => {
    expect(adminTokenMatches({ sv: 2 }, { role: "ADMIN", sessionVersion: 2 })).toBe(true);
  });

  it("refuses after signing out everywhere, after losing the role, or when the account is gone", () => {
    expect(adminTokenMatches({ sv: 2 }, { role: "ADMIN", sessionVersion: 3 })).toBe(false);
    expect(adminTokenMatches({ sv: 2 }, { role: "CUSTOMER", sessionVersion: 2 })).toBe(false);
    expect(adminTokenMatches({ sv: 2 }, null)).toBe(false);
    expect(adminTokenMatches({}, { role: "ADMIN", sessionVersion: 0 })).toBe(false);
  });
});
