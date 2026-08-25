"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { db } from "@/server/db";
import { stripe, STRIPE_PRICE_IDS } from "@/server/stripe";
import type { PlanTier } from "@prisma/client";

async function getBaseUrl() {
  const host = (await headers()).get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

async function getOrCreateStripeCustomer(
  organizationId: string,
  orgName: string,
  email: string
) {
  const org = await db.organization.findUniqueOrThrow({ where: { id: organizationId } });
  if (org.stripeCustomerId) return org.stripeCustomerId;

  const customer = await stripe.customers.create({
    name: orgName,
    email,
    metadata: { organizationId },
  });

  await db.organization.update({
    where: { id: organizationId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function createCheckoutSessionAction(planTier: Extract<PlanTier, "STARTER" | "GROWTH">) {
  const { organizationId, userId } = await requireAdmin();

  const [user, org] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId } }),
    db.organization.findUniqueOrThrow({ where: { id: organizationId } }),
  ]);

  const priceId = STRIPE_PRICE_IDS[planTier];
  if (!priceId) throw new Error(`No Stripe price configured for ${planTier}.`);

  const customerId = await getOrCreateStripeCustomer(organizationId, org.name, user.email);
  const baseUrl = await getBaseUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/settings/billing?checkout=success`,
    cancel_url: `${baseUrl}/settings/billing?checkout=cancelled`,
    metadata: { organizationId, planTier },
    subscription_data: { metadata: { organizationId, planTier } },
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  redirect(session.url);
}

export async function createBillingPortalSessionAction() {
  const { organizationId } = await requireAdmin();
  const org = await db.organization.findUniqueOrThrow({ where: { id: organizationId } });

  if (!org.stripeCustomerId) {
    throw new Error("This organization doesn't have a billing account yet.");
  }

  const baseUrl = await getBaseUrl();
  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${baseUrl}/settings/billing`,
  });

  redirect(session.url);
}
