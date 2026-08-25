"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/server/auth";
import * as companies from "@/server/queries/companies";
import { createPendingBrief } from "@/server/queries/research";
import { inngest } from "@/server/inngest/client";

function textOrNull(value: FormDataEntryValue | null): string | null {
  const str = String(value ?? "").trim();
  return str === "" ? null : str;
}

export async function createCompanyAction(formData: FormData) {
  const { organizationId, userId } = await requireOrgContext();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Company name is required.");

  const company = await companies.createCompany(organizationId, {
    name,
    domain: textOrNull(formData.get("domain")),
    industry: textOrNull(formData.get("industry")),
    sizeRange: textOrNull(formData.get("sizeRange")),
    description: textOrNull(formData.get("description")),
    createdByUserId: userId,
  });

  const brief = await createPendingBrief({
    organizationId,
    subjectType: "COMPANY",
    companyId: company.id,
    kind: "SNAPSHOT",
    version: 1,
    triggeredBy: "AUTO",
  });

  await inngest.send({
    name: "research/snapshot.requested",
    data: { briefId: brief.id, organizationId, companyId: company.id },
  });

  revalidatePath("/companies");
  return company;
}

export async function updateCompanyAction(companyId: string, formData: FormData) {
  const { organizationId } = await requireOrgContext();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Company name is required.");

  await companies.updateCompany(organizationId, companyId, {
    name,
    domain: textOrNull(formData.get("domain")),
    industry: textOrNull(formData.get("industry")),
    sizeRange: textOrNull(formData.get("sizeRange")),
    description: textOrNull(formData.get("description")),
  });

  revalidatePath(`/companies/${companyId}`);
  revalidatePath("/companies");
}
