import { db } from "@/server/db";

export function listPipelineStages(organizationId: string) {
  return db.pipelineStage.findMany({
    where: { organizationId },
    orderBy: { order: "asc" },
  });
}
