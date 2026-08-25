import { db } from "@/server/db";
import type { ResearchKind, ResearchSubjectType } from "@prisma/client";

const CACHE_WINDOW_DAYS = 7;

// A research subject is either a specific Company (subjectType=COMPANY) or a
// free-text market/vertical query (subjectType=MARKET) — these are two
// independent scoping keys, never both set. Every query here matches on
// whichever one applies so that, e.g., a "fintech" market brief never gets
// confused with a "healthcare SaaS" one.
type SubjectKey = { companyId?: string; marketQuery?: string };

function subjectWhere(subjectType: ResearchSubjectType, subject: SubjectKey) {
  return subjectType === "COMPANY"
    ? { companyId: subject.companyId ?? null, marketQuery: null }
    : { marketQuery: subject.marketQuery ?? null, companyId: null };
}

export function listResearchBriefs(
  organizationId: string,
  subjectType: ResearchSubjectType,
  subject: SubjectKey
) {
  return db.researchBrief.findMany({
    where: { organizationId, subjectType, ...subjectWhere(subjectType, subject) },
    orderBy: [{ kind: "asc" }, { version: "desc" }],
  });
}

export async function findFreshDeepDive(
  organizationId: string,
  subjectType: ResearchSubjectType,
  subject: SubjectKey
) {
  const cutoff = new Date(Date.now() - CACHE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  return db.researchBrief.findFirst({
    where: {
      organizationId,
      subjectType,
      ...subjectWhere(subjectType, subject),
      kind: "DEEP_DIVE",
      status: "COMPLETE",
      completedAt: { gte: cutoff },
    },
    orderBy: { version: "desc" },
  });
}

export async function nextVersion(
  organizationId: string,
  subjectType: ResearchSubjectType,
  kind: ResearchKind,
  subject: SubjectKey
) {
  const latest = await db.researchBrief.findFirst({
    where: { organizationId, subjectType, kind, ...subjectWhere(subjectType, subject) },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  return (latest?.version ?? 0) + 1;
}

export function createPendingBrief(data: {
  organizationId: string;
  subjectType: ResearchSubjectType;
  companyId?: string | null;
  marketQuery?: string | null;
  kind: ResearchKind;
  version: number;
  requestedByUserId?: string | null;
  triggeredBy: "AUTO" | "MANUAL";
}) {
  return db.researchBrief.create({ data: { ...data, status: "PENDING" } });
}

export function markRunning(id: string) {
  return db.researchBrief.update({ where: { id }, data: { status: "RUNNING" } });
}

export function markComplete(
  id: string,
  data: {
    content: object;
    markdownUrl?: string | null;
    pdfUrl?: string | null;
  }
) {
  return db.researchBrief.update({
    where: { id },
    data: { ...data, status: "COMPLETE", completedAt: new Date() },
  });
}

export function markFailed(id: string) {
  return db.researchBrief.update({ where: { id }, data: { status: "FAILED" } });
}

export function getCompanyForResearch(organizationId: string, companyId: string) {
  return db.company.findFirst({ where: { id: companyId, organizationId } });
}

export function listMarketQueries(organizationId: string) {
  return db.researchBrief.findMany({
    where: { organizationId, subjectType: "MARKET" },
    distinct: ["marketQuery"],
    orderBy: { createdAt: "desc" },
    select: { marketQuery: true },
  });
}
