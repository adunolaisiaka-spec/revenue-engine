"use server";

import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import { requireAdmin } from "@/server/auth";

export async function inviteTeamMemberAction(formData: FormData) {
  const { clerkOrgId, clerkUserId } = await requireAdmin();

  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "org:member");

  if (!email) throw new Error("Email is required.");
  if (role !== "org:admin" && role !== "org:member") {
    throw new Error("Invalid role.");
  }

  const client = await clerkClient();
  await client.organizations.createOrganizationInvitation({
    organizationId: clerkOrgId,
    emailAddress: email,
    role,
    inviterUserId: clerkUserId,
  });

  revalidatePath("/settings/team");
}
