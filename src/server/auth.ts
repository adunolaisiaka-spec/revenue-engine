import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { MembershipRole } from "@prisma/client";
import { db } from "./db";

export type OrgContext = {
  organizationId: string;
  clerkOrgId: string;
  clerkUserId: string;
  userId: string;
  role: MembershipRole;
};

/**
 * The single choke point every org-scoped page/action/query must go through.
 * Resolves the signed-in Clerk user + active Clerk organization into the
 * local Membership row — this is the tenant-isolation boundary for the app
 * (there is no Postgres RLS backstop), so every data-access helper in
 * src/server/queries/* takes the resulting organizationId as a mandatory
 * first argument rather than trusting a client-supplied one.
 */
export async function requireOrgContext(): Promise<OrgContext> {
  const { userId: clerkUserId, orgId: clerkOrgId } = await auth();

  if (!clerkUserId) {
    redirect("/sign-in");
  }

  if (!clerkOrgId) {
    redirect("/select-organization");
  }

  const membership = await db.membership.findFirst({
    where: {
      user: { clerkUserId },
      organization: { clerkOrgId },
    },
  });

  if (!membership) {
    throw new Error(
      "No local Membership found for this Clerk user/organization pair. " +
        "The Clerk webhook may not have synced this org/membership yet."
    );
  }

  return {
    organizationId: membership.organizationId,
    clerkOrgId,
    clerkUserId,
    userId: membership.userId,
    role: membership.role,
  };
}

export async function requireAdmin(): Promise<OrgContext> {
  const ctx = await requireOrgContext();
  if (ctx.role !== "ADMIN") {
    throw new Error("This action requires an organization admin.");
  }
  return ctx;
}
