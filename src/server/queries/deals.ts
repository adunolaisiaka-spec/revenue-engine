import { db } from "@/server/db";
import type { DealStatus } from "@prisma/client";

export function listDealsForPipeline(organizationId: string) {
  return db.deal.findMany({
    where: { organizationId },
    include: { company: true, owner: true },
    orderBy: { createdAt: "desc" },
  });
}

export function getDeal(organizationId: string, id: string) {
  return db.deal.findFirst({
    where: { id, organizationId },
    include: { company: true, primaryContact: true, stage: true, owner: true },
  });
}

export type CreateDealInput = {
  title: string;
  companyId: string;
  primaryContactId?: string | null;
  value: number;
  currency?: string;
  stageId: string;
  ownerUserId: string;
  expectedCloseDate?: Date | null;
};

export async function createDeal(organizationId: string, data: CreateDealInput) {
  const [company, stage] = await Promise.all([
    db.company.findFirst({ where: { id: data.companyId, organizationId }, select: { id: true } }),
    db.pipelineStage.findFirst({ where: { id: data.stageId, organizationId } }),
  ]);
  if (!company) throw new Error("Company not found in this organization.");
  if (!stage) throw new Error("Pipeline stage not found in this organization.");

  return db.deal.create({
    data: {
      organizationId,
      ...data,
      status: statusForStage(stage),
    },
  });
}

export async function updateDealStage(organizationId: string, dealId: string, stageId: string) {
  const stage = await db.pipelineStage.findFirst({ where: { id: stageId, organizationId } });
  if (!stage) throw new Error("Pipeline stage not found in this organization.");

  const result = await db.deal.updateMany({
    where: { id: dealId, organizationId },
    data: { stageId, status: statusForStage(stage) },
  });
  if (result.count === 0) {
    throw new Error("Deal not found in this organization.");
  }
}

function statusForStage(stage: { isWon: boolean; isLost: boolean }): DealStatus {
  if (stage.isWon) return "WON";
  if (stage.isLost) return "LOST";
  return "OPEN";
}
