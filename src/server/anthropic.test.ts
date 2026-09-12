import { describe, expect, it } from "vitest";
import { snapshotContentSchema, deepDiveContentSchema } from "./anthropic";

describe("snapshotContentSchema", () => {
  it("accepts a well-formed snapshot", () => {
    const result = snapshotContentSchema.safeParse({
      summary: "Acme Corp builds widgets.",
      industry: "Manufacturing",
      size: "51-200",
      headlines: ["Acme raises Series B", "Acme opens new factory"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts null industry/size (Claude found no info)", () => {
    const result = snapshotContentSchema.safeParse({
      summary: "Acme Corp builds widgets.",
      industry: null,
      size: null,
      headlines: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a snapshot missing required fields", () => {
    const result = snapshotContentSchema.safeParse({
      summary: "Acme Corp builds widgets.",
    });
    expect(result.success).toBe(false);
  });

  it("rejects headlines that aren't strings", () => {
    const result = snapshotContentSchema.safeParse({
      summary: "Acme Corp builds widgets.",
      industry: null,
      size: null,
      headlines: [{ title: "Not a plain string" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("deepDiveContentSchema", () => {
  const valid = {
    summary: "Acme Corp is a mid-market manufacturer.",
    keyFindings: [{ finding: "Raised $10M Series A", sourceUrls: ["https://example.com/news"] }],
    financials: "Raised $10M Series A in 2025.",
    leadership: [{ name: "Jane Doe", title: "CEO" }],
    recentNews: [{ headline: "Acme opens new factory", url: "https://example.com/factory" }],
    competitors: ["Widget Co", "Gadget Inc"],
    marketAnalysis: "The widget market is growing steadily.",
    talkingPoints: ["Ask about their recent expansion."],
    sources: [{ title: "Acme newsroom", url: "https://example.com/news" }],
  };

  it("accepts a well-formed deep-dive brief", () => {
    expect(deepDiveContentSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts a null financials field (nothing found)", () => {
    expect(deepDiveContentSchema.safeParse({ ...valid, financials: null }).success).toBe(true);
  });

  it("rejects a key finding without sourceUrls", () => {
    const invalid = { ...valid, keyFindings: [{ finding: "Some claim" }] };
    expect(deepDiveContentSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects recent news with a non-string, non-null url", () => {
    const invalid = {
      ...valid,
      recentNews: [{ headline: "Acme news", url: 12345 }],
    };
    expect(deepDiveContentSchema.safeParse(invalid).success).toBe(false);
  });
});
