import { db } from "@/server/db";

export function listTeamMembers(organizationId: string) {
  return db.membership.findMany({
    where: { organizationId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
}
