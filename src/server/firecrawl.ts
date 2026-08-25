import Firecrawl from "@mendable/firecrawl-js";
import type { Document, SearchResultWeb } from "@mendable/firecrawl-js";

const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY! });

// The SDK types web search results as `SearchResultWeb | Document`, but with
// scrapeOptions set, Firecrawl merges both shapes into one object per result.
export type WebSearchResult = SearchResultWeb & Pick<Document, "markdown">;

export async function searchWeb(query: string, limit = 5): Promise<WebSearchResult[]> {
  const result = await firecrawl.search(query, {
    limit,
    scrapeOptions: { formats: ["markdown"] },
  });
  return (result.web ?? []) as WebSearchResult[];
}

export async function scrapeUrl(url: string): Promise<Document> {
  return firecrawl.scrape(url, { formats: ["markdown"], onlyMainContent: true });
}
