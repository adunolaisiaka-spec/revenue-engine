import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/server/db";
import { stripe, STRIPE_PRICE_IDS } from "@/server/stripe";

// The only sync path from Stripe (source of truth for billing state) into
// Organization.planTier/stripeCustomerId/stripeSubscriptionId.

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set.");
  }

  const signature = (await headers()).get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const organizationId = session.metadata?.organizationId;
      const planTier = session.metadata?.planTier;

      if (organizationId && session.customer && session.subscription) {
        await db.organization.update({
          where: { id: organizationId },
          data: {
            stripeCustomerId: String(session.customer),
            stripeSubscriptionId: String(session.subscription),
            planTier: planTier === "GROWTH" ? "GROWTH" : "STARTER",
          },
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const org = await db.organization.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });

      if (org) {
        const priceId = subscription.items.data[0]?.price.id;
        const planTier =
          priceId === STRIPE_PRICE_IDS.GROWTH
            ? "GROWTH"
            : priceId === STRIPE_PRICE_IDS.STARTER
              ? "STARTER"
              : org.planTier;

        await db.organization.update({ where: { id: org.id }, data: { planTier } });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      await db.organization.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: { planTier: "MANUAL", stripeSubscriptionId: null },
      });
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
