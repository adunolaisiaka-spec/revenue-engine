import type { MembershipRole } from "@prisma/client";

export function mapClerkRole(clerkRole: string): MembershipRole {
  return clerkRole === "org:admin" ? "ADMIN" : "REP";
}
