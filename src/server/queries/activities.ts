import { db } from "@/server/db";
import type { ActivityType } from "@prisma/client";

export type ActivityScope =
  | { dealId: string }
  | { contactId: string }
  | { companyId: string };

export function listActivities(organizationId: string, scope: ActivityScope) {
  return db.activity.findMany({
    where: { organizationId, ...scope },
    include: { author: true },
    orderBy: { createdAt: "desc" },
  });
}

export type CreateActivityInput = ActivityScope & {
  type: ActivityType;
  body?: string | null;
  authorUserId?: string | null;
};

export function createActivity(organizationId: string, data: CreateActivityInput) {
  return db.activity.create({ data: { organizationId, ...data } });
}
