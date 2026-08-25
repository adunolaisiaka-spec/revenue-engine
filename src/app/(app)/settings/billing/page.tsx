import { requireOrgContext } from "@/server/auth";
import { db } from "@/server/db";
import { createBillingPortalSessionAction, createCheckoutSessionAction } from "@/server/actions/billing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const PLANS = [
  { tier: "STARTER" as const, name: "Starter", price: "$49/mo" },
  { tier: "GROWTH" as const, name: "Growth", price: "$149/mo" },
];

export default async function BillingSettingsPage({
  searchParams,
}: PageProps<"/settings/billing">) {
  const { organizationId, role } = await requireOrgContext();
  const { checkout } = await searchParams;
  const isAdmin = role === "ADMIN";

  const org = await db.organization.findUniqueOrThrow({ where: { id: organizationId } });
  const hasBillingAccount = Boolean(org.stripeCustomerId);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Current plan: <Badge variant="secondary">{org.planTier}</Badge>
        </p>
      </div>

      {checkout === "success" && (
        <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          Checkout complete — your plan will update within a few seconds once Stripe confirms
          the subscription.
        </p>
      )}

      {!isAdmin && (
        <p className="text-sm text-muted-foreground">
          Only organization admins can manage billing.
        </p>
      )}

      {isAdmin && (
        <div className="grid gap-4 sm:grid-cols-2">
          {PLANS.map((plan) => (
            <Card key={plan.tier}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.price}</CardDescription>
              </CardHeader>
              <CardContent />
              <CardFooter>
                <form action={createCheckoutSessionAction.bind(null, plan.tier)}>
                  <Button type="submit" disabled={org.planTier === plan.tier}>
                    {org.planTier === plan.tier ? "Current plan" : `Upgrade to ${plan.name}`}
                  </Button>
                </form>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {isAdmin && hasBillingAccount && (
        <form action={createBillingPortalSessionAction}>
          <Button type="submit" variant="outline">
            Manage billing
          </Button>
        </form>
      )}
    </div>
  );
}
