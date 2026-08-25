import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgContext } from "@/server/auth";
import { getDeal } from "@/server/queries/deals";
import { listPipelineStages } from "@/server/queries/pipeline-stages";
import { listActivities } from "@/server/queries/activities";
import { ActivityFeed } from "@/components/activity-feed";
import { DealStageSelect } from "@/components/deals/deal-stage-select";

export default async function DealDetailPage({
  params,
}: PageProps<"/deals/[id]">) {
  const { id } = await params;
  const { organizationId } = await requireOrgContext();

  const [deal, stages, activities] = await Promise.all([
    getDeal(organizationId, id),
    listPipelineStages(organizationId),
    listActivities(organizationId, { dealId: id }),
  ]);

  if (!deal) notFound();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{deal.title}</h1>
          <p className="text-sm text-muted-foreground">
            <Link href={`/companies/${deal.company.id}`} className="hover:underline">
              {deal.company.name}
            </Link>
            {deal.primaryContact && (
              <>
                {" · "}
                <Link href={`/contacts/${deal.primaryContact.id}`} className="hover:underline">
                  {deal.primaryContact.firstName} {deal.primaryContact.lastName}
                </Link>
              </>
            )}
          </p>
          <p className="mt-1 text-sm font-medium">
            ${Number(deal.value).toLocaleString()} {deal.currency}
          </p>
          <p className="text-xs text-muted-foreground">
            Owner: {deal.owner.name ?? deal.owner.email}
          </p>
        </div>
        <DealStageSelect
          dealId={deal.id}
          stageId={deal.stageId}
          stages={stages.map((s) => ({ id: s.id, name: s.name }))}
        />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium">Activity</h2>
        <ActivityFeed
          scope={{ dealId: deal.id }}
          revalidatePathTarget={`/deals/${deal.id}`}
          activities={activities}
        />
      </div>
    </div>
  );
}
