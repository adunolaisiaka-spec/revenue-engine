import { put } from "@vercel/blob";
import type { DeepDiveContent } from "@/server/anthropic";
import { renderDeepDivePdf } from "@/server/research-pdf";

function renderDeepDiveMarkdown(subjectLabel: string, content: DeepDiveContent): string {
  const lines: string[] = [`# Research Brief: ${subjectLabel}`, "", "## Executive Summary", content.summary, ""];

  lines.push("## Key Findings");
  for (const f of content.keyFindings) {
    lines.push(`- ${f.finding}${f.sourceUrls.length ? ` (${f.sourceUrls.join(", ")})` : ""}`);
  }
  lines.push("");

  if (content.financials) {
    lines.push("## Financials / Funding", content.financials, "");
  }

  if (content.leadership.length > 0) {
    lines.push("## Leadership");
    for (const l of content.leadership) lines.push(`- ${l.name} — ${l.title}`);
    lines.push("");
  }

  if (content.recentNews.length > 0) {
    lines.push("## Recent News");
    for (const n of content.recentNews) lines.push(`- ${n.headline}${n.url ? ` (${n.url})` : ""}`);
    lines.push("");
  }

  if (content.competitors.length > 0) {
    lines.push("## Competitors", content.competitors.join(", "), "");
  }

  lines.push("## Market Analysis", content.marketAnalysis, "");

  lines.push("## Recommended Talking Points");
  for (const t of content.talkingPoints) lines.push(`- ${t}`);
  lines.push("");

  if (content.sources.length > 0) {
    lines.push("## Sources");
    for (const s of content.sources) lines.push(`- [${s.title}](${s.url})`);
  }

  return lines.join("\n");
}

/**
 * Renders and uploads the versioned Markdown/PDF for a deep-dive brief to the
 * private Blob store. Returns Blob *pathnames* (not directly fetchable URLs,
 * since the store is private) — downloads are served through
 * /api/research-documents/[briefId], which streams the blob after verifying
 * the requester's org owns the brief.
 */
export async function generateAndStoreDeepDiveDocuments(params: {
  organizationId: string;
  briefId: string;
  version: number;
  subjectLabel: string;
  content: DeepDiveContent;
}) {
  const markdown = renderDeepDiveMarkdown(params.subjectLabel, params.content);
  const pdfBuffer = await renderDeepDivePdf(params.subjectLabel, params.content);

  const basePath = `research/${params.organizationId}/${params.briefId}/v${params.version}`;
  const markdownPath = `${basePath}.md`;
  const pdfPath = `${basePath}.pdf`;

  await Promise.all([
    put(markdownPath, markdown, {
      access: "private",
      contentType: "text/markdown",
      addRandomSuffix: false,
      allowOverwrite: true,
    }),
    put(pdfPath, pdfBuffer, {
      access: "private",
      contentType: "application/pdf",
      addRandomSuffix: false,
      allowOverwrite: true,
    }),
  ]);

  return { markdownUrl: markdownPath, pdfUrl: pdfPath };
}
