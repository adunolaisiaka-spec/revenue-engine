import { inngest, type SnapshotRequestedData, type DeepDiveRequestedData } from "./client";
import { getCompanyForResearch, markRunning, markComplete, markFailed } from "@/server/queries/research";
import { searchWeb, scrapeUrl, type WebSearchResult } from "@/server/firecrawl";
import { synthesizeSnapshot, synthesizeDeepDive } from "@/server/anthropic";
import { generateAndStoreDeepDiveDocuments } from "@/server/research-documents";

function normalizeUrl(domain: string): string {
  return domain.startsWith("http") ? domain : `https://${domain}`;
}

function buildSourcesText(sources: { url: string; markdown: string }[]): string {
  return sources.map((s) => `### ${s.url}\n${s.markdown.slice(0, 4000)}`).join("\n\n");
}

export const snapshotResearch = inngest.createFunction(
  { id: "research-snapshot", retries: 0, triggers: { event: "research/snapshot.requested" } },
  async ({ event, step }) => {
    const { briefId, organizationId, companyId } = event.data as SnapshotRequestedData;

    try {
      await step.run("mark-running", () => markRunning(briefId));

      const company = await step.run("load-company", () =>
        getCompanyForResearch(organizationId, companyId)
      );
      if (!company) throw new Error("Company not found in this organization.");

      const searchResults = await step.run("firecrawl-search", () =>
        searchWeb(`${company.name} company news`, 3)
      );

      const homepage = company.domain
        ? await step.run("firecrawl-scrape-homepage", () => scrapeUrl(normalizeUrl(company.domain!)))
        : null;

      const sources: { url: string; markdown: string }[] = [];
      if (homepage && company.domain) {
        sources.push({ url: company.domain, markdown: homepage.markdown ?? "" });
      }
      for (const result of searchResults as WebSearchResult[]) {
        sources.push({ url: result.url, markdown: result.markdown ?? result.description ?? "" });
      }

      const content = await step.run("claude-synthesize", () =>
        synthesizeSnapshot({ companyName: company.name, sources: buildSourcesText(sources) })
      );

      await step.run("mark-complete", () => markComplete(briefId, { content }));
    } catch (error) {
      await step.run("mark-failed", () => markFailed(briefId));
      throw error;
    }
  }
);

export const deepDiveResearch = inngest.createFunction(
  { id: "research-deep-dive", retries: 0, triggers: { event: "research/deepdive.requested" } },
  async ({ event, step }) => {
    const { briefId, organizationId, subjectType, companyId, marketQuery, version } =
      event.data as DeepDiveRequestedData;

    try {
      await step.run("mark-running", () => markRunning(briefId));

      let subjectLabel: string;
      let queries: string[];

      if (subjectType === "COMPANY") {
        if (!companyId) throw new Error("companyId is required for a COMPANY deep-dive.");
        const company = await step.run("load-company", () =>
          getCompanyForResearch(organizationId, companyId)
        );
        if (!company) throw new Error("Company not found in this organization.");

        subjectLabel = company.name;
        queries = [
          `${company.name} funding investors`,
          `${company.name} leadership executives`,
          `${company.name} competitors`,
          `${company.name} recent news`,
        ];
        if (company.domain) queries.push(company.domain);
      } else {
        if (!marketQuery) throw new Error("marketQuery is required for a MARKET deep-dive.");
        subjectLabel = marketQuery;
        queries = [
          `${marketQuery} market size`,
          `${marketQuery} key players competitors`,
          `${marketQuery} trends`,
          `${marketQuery} recent news`,
        ];
      }

      const searchResults = await step.run("firecrawl-search", async () => {
        const resultSets = await Promise.all(queries.map((q) => searchWeb(q, 3)));
        return resultSets.flat();
      });

      const uniqueUrls = Array.from(
        new Set((searchResults as WebSearchResult[]).map((r) => r.url))
      ).slice(0, 8);

      const scraped = await step.run("firecrawl-scrape", async () => {
        const pages = await Promise.all(
          uniqueUrls.map(async (url) => {
            try {
              const page = await scrapeUrl(url);
              return { url, markdown: (page.markdown ?? "").slice(0, 4000) };
            } catch {
              return null;
            }
          })
        );
        return pages.filter((p): p is { url: string; markdown: string } => p !== null);
      });

      const content = await step.run("claude-synthesize", () =>
        synthesizeDeepDive({ subjectLabel, sources: buildSourcesText(scraped) })
      );

      const { markdownUrl, pdfUrl } = await step.run("render-and-store-documents", () =>
        generateAndStoreDeepDiveDocuments({ organizationId, briefId, version, subjectLabel, content })
      );

      await step.run("mark-complete", () =>
        markComplete(briefId, { content, markdownUrl, pdfUrl })
      );
    } catch (error) {
      await step.run("mark-failed", () => markFailed(briefId));
      throw error;
    }
  }
);
