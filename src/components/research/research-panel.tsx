"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { runDeepDiveAction } from "@/server/actions/research";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SnapshotContent, DeepDiveContent } from "@/server/anthropic";

export type BriefSummary = {
  id: string;
  kind: "SNAPSHOT" | "DEEP_DIVE";
  version: number;
  status: "PENDING" | "RUNNING" | "COMPLETE" | "FAILED";
  content: unknown;
  markdownUrl: string | null;
  pdfUrl: string | null;
  createdAt: string;
  completedAt: string | null;
};

type Subject =
  | { subjectType: "COMPANY"; companyId: string }
  | { subjectType: "MARKET"; marketQuery: string };

const ACTIVE_STATUSES = new Set(["PENDING", "RUNNING"]);

export function ResearchPanel({
  subject,
  snapshot,
  deepDives,
}: {
  subject: Subject;
  snapshot: BriefSummary | null;
  deepDives: BriefSummary[];
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const latestDeepDive = deepDives[0] ?? null;
  const olderVersions = deepDives.slice(1);

  const hasActiveJob =
    (snapshot && ACTIVE_STATUSES.has(snapshot.status)) ||
    (latestDeepDive && ACTIVE_STATUSES.has(latestDeepDive.status));

  const pollingRef = useRef(false);
  useEffect(() => {
    if (!hasActiveJob || pollingRef.current) return;
    pollingRef.current = true;
    const interval = setInterval(() => router.refresh(), 4000);
    return () => {
      clearInterval(interval);
      pollingRef.current = false;
    };
  }, [hasActiveJob, router]);

  function runDeepDive(force: boolean) {
    startTransition(async () => {
      await runDeepDiveAction({ ...subject, force });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {snapshot && <SnapshotCard brief={snapshot} />}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Deep-dive research</h3>
        <div className="flex gap-2">
          {latestDeepDive?.status === "COMPLETE" && (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => runDeepDive(true)}
            >
              Refresh
            </Button>
          )}
          <Button
            size="sm"
            disabled={isPending || Boolean(hasActiveJob)}
            onClick={() => runDeepDive(false)}
          >
            {hasActiveJob ? "Running…" : "Run deep-dive"}
          </Button>
        </div>
      </div>

      {!latestDeepDive && !hasActiveJob && (
        <p className="text-sm text-muted-foreground">No deep-dive run yet.</p>
      )}

      {latestDeepDive && <DeepDiveCard brief={latestDeepDive} />}

      {olderVersions.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-medium text-muted-foreground">Previous versions</h4>
          {olderVersions.map((brief) => (
            <VersionRow key={brief.id} brief={brief} />
          ))}
        </div>
      )}
    </div>
  );
}

function SnapshotCard({ brief }: { brief: BriefSummary }) {
  if (brief.status !== "COMPLETE") {
    return <StatusNote label="Snapshot" status={brief.status} />;
  }

  const content = brief.content as SnapshotContent;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Snapshot</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        <p>{content.summary}</p>
        <p className="text-muted-foreground">
          {[content.industry, content.size].filter(Boolean).join(" · ") || "No details"}
        </p>
        {content.headlines.length > 0 && (
          <ul className="list-inside list-disc text-muted-foreground">
            {content.headlines.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function DeepDiveCard({ brief }: { brief: BriefSummary }) {
  if (brief.status !== "COMPLETE") {
    return <StatusNote label={`Deep-dive v${brief.version}`} status={brief.status} />;
  }

  const content = brief.content as DeepDiveContent;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Deep-dive v{brief.version}</CardTitle>
        <div className="flex gap-2">
          <a
            className="text-xs text-muted-foreground hover:underline"
            href={`/api/research-documents/${brief.id}?type=markdown`}
          >
            Markdown
          </a>
          <a
            className="text-xs text-muted-foreground hover:underline"
            href={`/api/research-documents/${brief.id}?type=pdf`}
          >
            PDF
          </a>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        <Section title="Executive summary">
          <p>{content.summary}</p>
        </Section>

        <Section title="Key findings">
          <ul className="list-inside list-disc">
            {content.keyFindings.map((f, i) => (
              <li key={i}>{f.finding}</li>
            ))}
          </ul>
        </Section>

        {content.financials && (
          <Section title="Financials / funding">
            <p>{content.financials}</p>
          </Section>
        )}

        {content.leadership.length > 0 && (
          <Section title="Leadership">
            <ul className="list-inside list-disc">
              {content.leadership.map((l, i) => (
                <li key={i}>
                  {l.name} — {l.title}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {content.recentNews.length > 0 && (
          <Section title="Recent news">
            <ul className="list-inside list-disc">
              {content.recentNews.map((n, i) => (
                <li key={i}>{n.headline}</li>
              ))}
            </ul>
          </Section>
        )}

        {content.competitors.length > 0 && (
          <Section title="Competitors">
            <p>{content.competitors.join(", ")}</p>
          </Section>
        )}

        <Section title="Market analysis">
          <p>{content.marketAnalysis}</p>
        </Section>

        <Section title="Recommended talking points">
          <ul className="list-inside list-disc">
            {content.talkingPoints.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </Section>
      </CardContent>
    </Card>
  );
}

function VersionRow({ brief }: { brief: BriefSummary }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-2 text-xs text-muted-foreground">
      <span>
        v{brief.version} · {new Date(brief.createdAt).toLocaleString()}
      </span>
      {brief.status === "COMPLETE" ? (
        <div className="flex gap-2">
          <a className="hover:underline" href={`/api/research-documents/${brief.id}?type=markdown`}>
            Markdown
          </a>
          <a className="hover:underline" href={`/api/research-documents/${brief.id}?type=pdf`}>
            PDF
          </a>
        </div>
      ) : (
        <Badge variant="secondary">{brief.status}</Badge>
      )}
    </div>
  );
}

function StatusNote({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
      <span>{label}</span>
      <Badge variant={status === "FAILED" ? "destructive" : "secondary"}>{status}</Badge>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-1 text-xs font-medium text-muted-foreground uppercase">{title}</h4>
      {children}
    </div>
  );
}
