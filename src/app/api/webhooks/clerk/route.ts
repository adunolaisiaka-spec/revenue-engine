import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import type { MembershipRole } from "@prisma/client";

// The only sync path from Clerk (source of truth for auth/org/membership)
// into our Postgres mirror tables. Every handler is an upsert keyed on the
// Clerk id so redelivered/out-of-order webhook events stay idempotent.

function mapClerkRole(clerkRole: string): MembershipRole {
  return clerkRole === "org:admin" ? "ADMIN" : "REP";
}

const DEFAULT_PIPELINE_STAGES = [
  { name: "New", order: 0 },
  { name: "Qualified", order: 1 },
  { name: "Proposal", order: 2 },
  { name: "Won", order: 3, isWon: true },
  { name: "Lost", order: 4, isLost: true },
];

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("CLERK_WEBHOOK_SECRET is not set.");
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const body = await req.text();
  const wh = new Webhook(webhookSecret);

  let event: WebhookEvent;
  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "user.created":
    case "user.updated": {
      const { id, email_addresses, first_name, last_name, image_url } = event.data;
      const email = email_addresses[0]?.email_address;
      if (!email) break;

      await db.user.upsert({
        where: { clerkUserId: id },
        create: {
          clerkUserId: id,
          email,
          name: [first_name, last_name].filter(Boolean).join(" ") || null,
          avatarUrl: image_url ?? null,
        },
        update: {
          email,
          name: [first_name, last_name].filter(Boolean).join(" ") || null,
          avatarUrl: image_url ?? null,
        },
      });
      break;
    }

    case "organization.created":
    case "organization.updated": {
      const { id, name, slug } = event.data;

      const existing = await db.organization.findUnique({ where: { clerkOrgId: id } });

      if (existing) {
        await db.organization.update({
          where: { clerkOrgId: id },
          data: { name, slug: slug ?? id },
        });
      } else {
        // Seed the default 5-stage pipeline once, at real creation time only —
        // per-org stage customization is deferred (see CLAUDE.md backlog).
        await db.organization.create({
          data: {
            clerkOrgId: id,
            name,
            slug: slug ?? id,
            pipelineStages: { createMany: { data: DEFAULT_PIPELINE_STAGES } },
          },
        });
      }
      break;
    }

    case "organizationMembership.created":
    case "organizationMembership.updated": {
      const { organization, public_user_data, role } = event.data;

      const [org, user] = await Promise.all([
        db.organization.findUnique({ where: { clerkOrgId: organization.id } }),
        db.user.findUnique({ where: { clerkUserId: public_user_data.user_id } }),
      ]);

      if (!org || !user) {
        // Organization/User webhook hasn't landed yet — Clerk retries on non-2xx.
        return NextResponse.json({ error: "Org or user not synced yet" }, { status: 409 });
      }

      await db.membership.upsert({
        where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
        create: { organizationId: org.id, userId: user.id, role: mapClerkRole(role) },
        update: { role: mapClerkRole(role) },
      });
      break;
    }

    case "organizationMembership.deleted": {
      const { organization, public_user_data } = event.data;

      const [org, user] = await Promise.all([
        db.organization.findUnique({ where: { clerkOrgId: organization.id } }),
        db.user.findUnique({ where: { clerkUserId: public_user_data.user_id } }),
      ]);

      if (org && user) {
        await db.membership.deleteMany({
          where: { organizationId: org.id, userId: user.id },
        });
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
