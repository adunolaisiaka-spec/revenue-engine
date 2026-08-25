import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const MODEL = "claude-sonnet-5";

export const snapshotContentSchema = z.object({
  summary: z.string(),
  industry: z.string().nullable(),
  size: z.string().nullable(),
  headlines: z.array(z.string()),
});
export type SnapshotContent = z.infer<typeof snapshotContentSchema>;

export const deepDiveContentSchema = z.object({
  summary: z.string(),
  keyFindings: z.array(z.object({ finding: z.string(), sourceUrls: z.array(z.string()) })),
  financials: z.string().nullable(),
  leadership: z.array(z.object({ name: z.string(), title: z.string() })),
  recentNews: z.array(z.object({ headline: z.string(), url: z.string().nullable() })),
  competitors: z.array(z.string()),
  marketAnalysis: z.string(),
  talkingPoints: z.array(z.string()),
  sources: z.array(z.object({ title: z.string(), url: z.string() })),
});
export type DeepDiveContent = z.infer<typeof deepDiveContentSchema>;

async function callWithTool<T>(params: {
  system: string;
  prompt: string;
  toolName: string;
  toolSchema: Anthropic.Tool.InputSchema;
  parse: (input: unknown) => T;
}) {
  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: params.system,
    messages: [{ role: "user", content: params.prompt }],
    tools: [
      {
        name: params.toolName,
        description: "Submit the structured research result.",
        input_schema: params.toolSchema,
      },
    ],
    tool_choice: { type: "tool", name: params.toolName },
  });

  const toolUse = message.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return structured output.");
  }

  return params.parse(toolUse.input);
}

export async function synthesizeSnapshot(input: {
  companyName: string;
  sources: string;
}): Promise<SnapshotContent> {
  return callWithTool({
    system:
      "You are a B2B sales research assistant. Summarize company research concisely and factually, using only the provided source material — never invent facts not present in the sources.",
    prompt: `Company: ${input.companyName}\n\nSource material:\n${input.sources}\n\nSummarize what this company does, its industry and approximate size if mentioned, and up to 3 recent headlines.`,
    toolName: "submit_snapshot",
    toolSchema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        industry: { type: ["string", "null"] },
        size: { type: ["string", "null"] },
        headlines: { type: "array", items: { type: "string" } },
      },
      required: ["summary", "industry", "size", "headlines"],
    },
    parse: (raw) => snapshotContentSchema.parse(raw),
  });
}

export async function synthesizeDeepDive(input: {
  subjectLabel: string;
  sources: string;
}): Promise<DeepDiveContent> {
  return callWithTool({
    system:
      "You are a B2B sales research analyst producing a deep-dive account/market brief for a sales rep. Base every claim only on the provided source material and cite the backing source URLs for each key finding — never invent facts. Be concise but thorough.",
    prompt: `Subject: ${input.subjectLabel}\n\nSource material (each block prefixed by its URL):\n${input.sources}\n\nProduce a full research brief: executive summary, key findings (each with the source URLs backing it), financials/funding if mentioned, leadership, recent news, competitors, market analysis, and recommended talking points for a sales call.`,
    toolName: "submit_deep_dive",
    toolSchema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        keyFindings: {
          type: "array",
          items: {
            type: "object",
            properties: {
              finding: { type: "string" },
              sourceUrls: { type: "array", items: { type: "string" } },
            },
            required: ["finding", "sourceUrls"],
          },
        },
        financials: { type: ["string", "null"] },
        leadership: {
          type: "array",
          items: {
            type: "object",
            properties: { name: { type: "string" }, title: { type: "string" } },
            required: ["name", "title"],
          },
        },
        recentNews: {
          type: "array",
          items: {
            type: "object",
            properties: {
              headline: { type: "string" },
              url: { type: ["string", "null"] },
            },
            required: ["headline", "url"],
          },
        },
        competitors: { type: "array", items: { type: "string" } },
        marketAnalysis: { type: "string" },
        talkingPoints: { type: "array", items: { type: "string" } },
        sources: {
          type: "array",
          items: {
            type: "object",
            properties: { title: { type: "string" }, url: { type: "string" } },
            required: ["title", "url"],
          },
        },
      },
      required: [
        "summary",
        "keyFindings",
        "financials",
        "leadership",
        "recentNews",
        "competitors",
        "marketAnalysis",
        "talkingPoints",
        "sources",
      ],
    },
    parse: (raw) => deepDiveContentSchema.parse(raw),
  });
}
