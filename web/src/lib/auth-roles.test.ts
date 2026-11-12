import { describe, expect, it } from "vitest";
import { sessionRoleFor, signInAllowedForRole } from "./auth-roles";

describe("signInAllowedForRole", () => {
  it("refuses an administrator's magic link and LINE sign-in", () => {
    expect(signInAllowedForRole("resend", "ADMIN")).toBe(false);
    expect(signInAllowedForRole("line", "ADMIN")).toBe(false);
    expect(signInAllowedForRole(undefined, "ADMIN")).toBe(false);
  });

  it("lets an administrator in with the password", () => {
    expect(signInAllowedForRole("credentials", "ADMIN")).toBe(true);
  });

  it("lets customers and new addresses in by any way", () => {
    expect(signInAllowedForRole("resend", "CUSTOMER")).toBe(true);
    expect(signInAllowedForRole("line", null)).toBe(true);
    expect(signInAllowedForRole("resend", undefined)).toBe(true);
  });
});

describe("sessionRoleFor", () => {
  it("gives ADMIN only to the password sign-in", () => {
    expect(sessionRoleFor("credentials", "ADMIN")).toBe("ADMIN");
    expect(sessionRoleFor("resend", "ADMIN")).toBe("CUSTOMER");
    expect(sessionRoleFor("line", "ADMIN")).toBe("CUSTOMER");
    expect(sessionRoleFor(undefined, "ADMIN")).toBe("CUSTOMER");
  });

  it("keeps everyone else a customer", () => {
    expect(sessionRoleFor("credentials", "CUSTOMER")).toBe("CUSTOMER");
    expect(sessionRoleFor("resend", null)).toBe("CUSTOMER");
  });
});
