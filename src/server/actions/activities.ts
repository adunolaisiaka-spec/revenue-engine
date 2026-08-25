"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/server/auth";
import * as activities from "@/server/queries/activities";
import type { ActivityScope } from "@/server/queries/activities";
import type { ActivityType } from "@prisma/client";

export async function logActivityAction(
  scope: ActivityScope,
  revalidatePathTarget: string,
  formData: FormData
) {
  const { organizationId, userId } = await requireOrgContext();

  const body = String(formData.get("body") ?? "").trim();
  if (!body) throw new Error("Note cannot be empty.");

  const type = (formData.get("type") as ActivityType | null) ?? "NOTE";

  await activities.createActivity(organizationId, {
    ...scope,
    type,
    body,
    authorUserId: userId,
  });

  revalidatePath(revalidatePathTarget);
}
