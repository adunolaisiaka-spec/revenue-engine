import { describe, expect, it, vi, beforeEach } from "vitest";

const { findMany, findFirst } = vi.hoisted(() => ({
  findMany: vi.fn(),
  findFirst: vi.fn(),
}));

vi.mock("@/server/db", () => ({
  db: {
    researchBrief: { findMany, findFirst },
  },
}));

import { listResearchBriefs, findFreshDeepDive, nextVersion } from "./research";

beforeEach(() => {
  findMany.mockReset();
  findFirst.mockReset();
});

describe("listResearchBriefs subject scoping", () => {
  it("scopes a COMPANY subject by companyId, not marketQuery", async () => {
    findMany.mockResolvedValue([]);
    await listResearchBriefs("org1", "COMPANY", { companyId: "company1" });

    const where = findMany.mock.calls[0][0].where;
    expect(where.companyId).toBe("company1");
    expect(where.marketQuery).toBeNull();
  });

  it("scopes a MARKET subject by marketQuery, not companyId", async () => {
    findMany.mockResolvedValue([]);
    await listResearchBriefs("org1", "MARKET", { marketQuery: "fintech" });

    const where = findMany.mock.calls[0][0].where;
    expect(where.marketQuery).toBe("fintech");
    expect(where.companyId).toBeNull();
  });

  it("never lets two different market queries collide on the same scope", async () => {
    findMany.mockResolvedValue([]);
    await listResearchBriefs("org1", "MARKET", { marketQuery: "fintech" });
    const fintechWhere = findMany.mock.calls[0][0].where;

    findMany.mockClear();
    await listResearchBriefs("org1", "MARKET", { marketQuery: "healthcare" });
    const healthcareWhere = findMany.mock.calls[0][0].where;

    expect(fintechWhere.marketQuery).not.toBe(healthcareWhere.marketQuery);
  });
});

describe("findFreshDeepDive", () => {
  it("only matches COMPLETE deep-dives within the cache window, scoped by company", async () => {
    findFirst.mockResolvedValue(null);
    await findFreshDeepDive("org1", "COMPANY", { companyId: "company1" });

    const where = findFirst.mock.calls[0][0].where;
    expect(where.companyId).toBe("company1");
    expect(where.marketQuery).toBeNull();
    expect(where.kind).toBe("DEEP_DIVE");
    expect(where.status).toBe("COMPLETE");
    expect(where.completedAt.gte).toBeInstanceOf(Date);
  });
});

describe("nextVersion", () => {
  it("starts at version 1 when nothing exists yet", async () => {
    findFirst.mockResolvedValue(null);
    const version = await nextVersion("org1", "COMPANY", "DEEP_DIVE", { companyId: "company1" });
    expect(version).toBe(1);
  });

  it("increments from the latest existing version", async () => {
    findFirst.mockResolvedValue({ version: 3 });
    const version = await nextVersion("org1", "COMPANY", "DEEP_DIVE", { companyId: "company1" });
    expect(version).toBe(4);
  });
});
