"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/server/auth";
import { findFreshDeepDive, nextVersion, createPendingBrief, getCompanyForResearch } from "@/server/queries/research";
import { inngest } from "@/server/inngest/client";

type RunDeepDiveInput =
  | { subjectType: "COMPANY"; companyId: string; force?: boolean }
  | { subjectType: "MARKET"; marketQuery: string; force?: boolean };

export async function runDeepDiveAction(input: RunDeepDiveInput) {
  const { organizationId, userId } = await requireOrgContext();

  const companyId = input.subjectType === "COMPANY" ? input.companyId : undefined;
  const marketQuery = input.subjectType === "MARKET" ? input.marketQuery.trim() : undefined;

  if (input.subjectType === "COMPANY") {
    const company = await getCompanyForResearch(organizationId, input.companyId);
    if (!company) throw new Error("Company not found in this organization.");
  }
  if (input.subjectType === "MARKET" && !marketQuery) {
    throw new Error("A market/industry query is required.");
  }

  const subject = { companyId, marketQuery };

  if (!input.force) {
    const fresh = await findFreshDeepDive(organizationId, input.subjectType, subject);
    if (fresh) {
      // A recent deep-dive already exists — nothing to enqueue, the UI just shows it.
      return fresh;
    }
  }

  const version = await nextVersion(organizationId, input.subjectType, "DEEP_DIVE", subject);

  const brief = await createPendingBrief({
    organizationId,
    subjectType: input.subjectType,
    companyId: companyId ?? null,
    marketQuery: marketQuery ?? null,
    kind: "DEEP_DIVE",
    version,
    requestedByUserId: userId,
    triggeredBy: "MANUAL",
  });

  await inngest.send({
    name: "research/deepdive.requested",
    data: {
      briefId: brief.id,
      organizationId,
      version,
      subjectType: input.subjectType,
      companyId,
      marketQuery,
    },
  });

  if (input.subjectType === "COMPANY") {
    revalidatePath(`/companies/${input.companyId}`);
  } else {
    revalidatePath("/research/market");
  }

  return brief;
}
