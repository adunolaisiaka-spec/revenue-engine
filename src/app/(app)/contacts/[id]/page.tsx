import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgContext } from "@/server/auth";
import { getContact } from "@/server/queries/contacts";
import { listActivities } from "@/server/queries/activities";
import { ActivityFeed } from "@/components/activity-feed";
import { Badge } from "@/components/ui/badge";

export default async function ContactDetailPage({
  params,
}: PageProps<"/contacts/[id]">) {
  const { id } = await params;
  const { organizationId } = await requireOrgContext();

  const [contact, activities] = await Promise.all([
    getContact(organizationId, id),
    listActivities(organizationId, { contactId: id }),
  ]);

  if (!contact) notFound();

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">
          {contact.firstName} {contact.lastName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {contact.title ?? "No title"}
          {contact.company && (
            <>
              {" · "}
              <Link href={`/companies/${contact.company.id}`} className="hover:underline">
                {contact.company.name}
              </Link>
            </>
          )}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {contact.email ?? "No email"} {contact.phone ? `· ${contact.phone}` : ""}
        </p>
      </div>

      {contact.primaryOnDeals.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Deals</h2>
          {contact.primaryOnDeals.map((deal) => (
            <Link
              key={deal.id}
              href={`/deals/${deal.id}`}
              className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-muted/50"
            >
              <span className="font-medium">{deal.title}</span>
              <Badge variant="secondary">{deal.stage.name}</Badge>
            </Link>
          ))}
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-medium">Activity</h2>
        <ActivityFeed
          scope={{ contactId: contact.id }}
          revalidatePathTarget={`/contacts/${contact.id}`}
          activities={activities}
        />
      </div>
    </div>
  );
}
