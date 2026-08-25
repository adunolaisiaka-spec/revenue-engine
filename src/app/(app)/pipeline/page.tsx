import { requireOrgContext } from "@/server/auth";
import { listPipelineStages } from "@/server/queries/pipeline-stages";
import { listDealsForPipeline } from "@/server/queries/deals";
import { listCompanies } from "@/server/queries/companies";
import { PipelineBoard, type PipelineStageWithDeals } from "@/components/pipeline/board";
import { CreateDealDialog } from "@/components/deals/create-deal-dialog";

export default async function PipelinePage() {
  const { organizationId } = await requireOrgContext();

  const [stages, deals, companies] = await Promise.all([
    listPipelineStages(organizationId),
    listDealsForPipeline(organizationId),
    listCompanies(organizationId),
  ]);

  const stagesWithDeals: PipelineStageWithDeals[] = stages.map((stage) => ({
    id: stage.id,
    name: stage.name,
    deals: deals
      .filter((deal) => deal.stageId === stage.id)
      .map((deal) => ({
        id: deal.id,
        title: deal.title,
        value: deal.value.toString(),
        company: { id: deal.company.id, name: deal.company.name },
        owner: { id: deal.owner.id, name: deal.owner.name, email: deal.owner.email },
      })),
  }));

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-xl font-semibold">Pipeline</h1>
        <CreateDealDialog
          companies={companies.map((c) => ({ id: c.id, name: c.name }))}
          stages={stages.map((s) => ({ id: s.id, name: s.name }))}
        />
      </div>
      <PipelineBoard stages={stagesWithDeals} />
    </div>
  );
}
