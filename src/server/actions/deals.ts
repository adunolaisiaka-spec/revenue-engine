"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/server/auth";
import * as deals from "@/server/queries/deals";
import * as activities from "@/server/queries/activities";

function textOrNull(value: FormDataEntryValue | null): string | null {
  const str = String(value ?? "").trim();
  return str === "" ? null : str;
}

export async function createDealAction(formData: FormData) {
  const { organizationId, userId } = await requireOrgContext();

  const title = String(formData.get("title") ?? "").trim();
  const companyId = String(formData.get("companyId") ?? "").trim();
  const stageId = String(formData.get("stageId") ?? "").trim();
  const valueRaw = String(formData.get("value") ?? "0").trim();

  if (!title) throw new Error("Deal title is required.");
  if (!companyId) throw new Error("A company is required.");
  if (!stageId) throw new Error("A pipeline stage is required.");

  const value = Number(valueRaw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Deal value must be a non-negative number.");
  }

  const expectedCloseDateRaw = textOrNull(formData.get("expectedCloseDate"));

  const deal = await deals.createDeal(organizationId, {
    title,
    companyId,
    primaryContactId: textOrNull(formData.get("primaryContactId")),
    value,
    stageId,
    ownerUserId: userId,
    expectedCloseDate: expectedCloseDateRaw ? new Date(expectedCloseDateRaw) : null,
  });

  revalidatePath("/pipeline");
  revalidatePath(`/companies/${companyId}`);
  return deal;
}

export async function updateDealStageAction(dealId: string, stageId: string) {
  const { organizationId, userId } = await requireOrgContext();

  await deals.updateDealStage(organizationId, dealId, stageId);
  await activities.createActivity(organizationId, {
    dealId,
    type: "STAGE_CHANGE",
    authorUserId: userId,
  });

  revalidatePath("/pipeline");
  revalidatePath(`/deals/${dealId}`);
}
