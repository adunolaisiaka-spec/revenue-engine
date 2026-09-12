import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgContext } from "@/server/auth";
import { getCompany } from "@/server/queries/companies";
import { listActivities } from "@/server/queries/activities";
import { ActivityFeed } from "@/components/activity-feed";
import { CreateDealDialog } from "@/components/deals/create-deal-dialog";
import { listPipelineStages } from "@/server/queries/pipeline-stages";
import { listResearchBriefs } from "@/server/queries/research";
import { ResearchPanel, type BriefSummary } from "@/components/research/research-panel";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function CompanyDetailPage({
  params,
}: PageProps<"/companies/[id]">) {
  const { id } = await params;
  const { organizationId } = await requireOrgContext();

  const [company, activities, stages, researchBriefs] = await Promise.all([
    getCompany(organizationId, id),
    listActivities(organizationId, { companyId: id }),
    listPipelineStages(organizationId),
    listResearchBriefs(organizationId, "COMPANY", { companyId: id }),
  ]);

  if (!company) notFound();

  const toSummary = (b: (typeof researchBriefs)[number]): BriefSummary => ({
    id: b.id,
    kind: b.kind,
    version: b.version,
    status: b.status,
    content: b.content,
    markdownUrl: b.markdownUrl,
    pdfUrl: b.pdfUrl,
    createdAt: b.createdAt.toISOString(),
    completedAt: b.completedAt ? b.completedAt.toISOString() : null,
  });

  const snapshot = researchBriefs.find((b) => b.kind === "SNAPSHOT");
  const deepDives = researchBriefs.filter((b) => b.kind === "DEEP_DIVE").map(toSummary);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">{company.name}</h1>
        <p className="text-sm text-muted-foreground">
          {[company.industry, company.sizeRange, company.domain].filter(Boolean).join(" · ") ||
            "No details yet"}
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="research">Research</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-2 pt-4">
          {company.description ? (
            <p>{company.description}</p>
          ) : (
            <p className="text-muted-foreground">No description yet.</p>
          )}
        </TabsContent>

        <TabsContent value="contacts" className="flex flex-col gap-2 pt-4">
          {company.contacts.length === 0 && (
            <p className="text-muted-foreground">No contacts linked to this company yet.</p>
          )}
          {company.contacts.map((contact) => (
            <Link
              key={contact.id}
              href={`/contacts/${contact.id}`}
              className="rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50"
            >
              <span className="font-medium">
                {contact.firstName} {contact.lastName}
              </span>
              {contact.title && (
                <span className="ml-2 text-muted-foreground">{contact.title}</span>
              )}
            </Link>
          ))}
        </TabsContent>

        <TabsContent value="deals" className="flex flex-col gap-3 pt-4">
          <div>
            <CreateDealDialog
              companies={[{ id: company.id, name: company.name }]}
              stages={stages.map((s) => ({ id: s.id, name: s.name }))}
              defaultCompanyId={company.id}
            />
          </div>
          {company.deals.length === 0 && (
            <p className="text-muted-foreground">No deals for this company yet.</p>
          )}
          {company.deals.map((deal) => (
            <Link
              key={deal.id}
              href={`/deals/${deal.id}`}
              className="flex items-center justify-between rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50"
            >
              <span className="font-medium">{deal.title}</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{deal.stage.name}</Badge>
                <span className="text-muted-foreground">
                  ${Number(deal.value).toLocaleString()}
                </span>
              </div>
            </Link>
          ))}
        </TabsContent>

        <TabsContent value="activity" className="pt-4">
          <ActivityFeed
            scope={{ companyId: company.id }}
            revalidatePathTarget={`/companies/${company.id}`}
            activities={activities}
          />
        </TabsContent>

        <TabsContent value="research" className="pt-4">
          <ResearchPanel
            subject={{ subjectType: "COMPANY", companyId: company.id }}
            snapshot={snapshot ? toSummary(snapshot) : null}
            deepDives={deepDives}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
