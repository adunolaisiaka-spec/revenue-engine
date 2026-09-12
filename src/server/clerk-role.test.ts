import { describe, expect, it } from "vitest";
import { mapClerkRole } from "./clerk-role";

describe("mapClerkRole", () => {
  it("maps org:admin to ADMIN", () => {
    expect(mapClerkRole("org:admin")).toBe("ADMIN");
  });

  it("maps org:member to REP", () => {
    expect(mapClerkRole("org:member")).toBe("REP");
  });

  it("defaults any unrecognized role to REP (fail safe, not fail open)", () => {
    expect(mapClerkRole("org:some_future_role")).toBe("REP");
  });
});
