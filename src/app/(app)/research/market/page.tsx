import Link from "next/link";
import { requireOrgContext } from "@/server/auth";
import { listResearchBriefs, listMarketQueries } from "@/server/queries/research";
import { ResearchPanel, type BriefSummary } from "@/components/research/research-panel";
import { MarketQueryForm } from "@/components/research/market-query-form";

export default async function MarketResearchPage({
  searchParams,
}: PageProps<"/research/market">) {
  const { organizationId } = await requireOrgContext();
  const { q } = await searchParams;
  const marketQuery = typeof q === "string" ? q.trim() : undefined;

  const pastQueries = await listMarketQueries(organizationId);

  const deepDives = marketQuery
    ? (await listResearchBriefs(organizationId, "MARKET", { marketQuery })).map(
        (b): BriefSummary => ({
          id: b.id,
          kind: b.kind,
          version: b.version,
          status: b.status,
          content: b.content,
          markdownUrl: b.markdownUrl,
          pdfUrl: b.pdfUrl,
          createdAt: b.createdAt.toISOString(),
          completedAt: b.completedAt ? b.completedAt.toISOString() : null,
        })
      )
    : [];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Market research</h1>
        <p className="text-sm text-muted-foreground">
          Research an industry or vertical, independent of any specific company.
        </p>
      </div>

      <MarketQueryForm defaultValue={marketQuery} />

      {pastQueries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pastQueries
            .filter((p) => p.marketQuery)
            .map((p) => (
              <Link
                key={p.marketQuery}
                href={`/research/market?q=${encodeURIComponent(p.marketQuery!)}`}
                className="rounded-full border px-3 py-1 text-xs text-muted-foreground hover:bg-muted/50"
              >
                {p.marketQuery}
              </Link>
            ))}
        </div>
      )}

      {marketQuery && (
        <ResearchPanel
          subject={{ subjectType: "MARKET", marketQuery }}
          snapshot={null}
          deepDives={deepDives}
        />
      )}
    </div>
  );
}
