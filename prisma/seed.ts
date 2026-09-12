import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Populates realistic sample Companies/Contacts/Deals/Activities into an
// EXISTING organization (rather than fabricating a new one) — every org in
// this app is created via the Clerk webhook and keyed by a real clerkOrgId,
// so a wholly fabricated "demo org" would have no real Clerk organization
// behind it and nobody could actually sign in to see it. Point this at an
// org you already have access to instead:
//
//   SEED_ORGANIZATION_ID=<id> npx prisma db seed

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const SAMPLE_COMPANIES = [
  { name: "Northwind Traders", domain: "northwindtraders.example", industry: "Retail", sizeRange: "51-200" },
  { name: "Contoso Logistics", domain: "contosologistics.example", industry: "Logistics", sizeRange: "201-500" },
  { name: "Globex Manufacturing", domain: "globexmfg.example", industry: "Manufacturing", sizeRange: "500+" },
  { name: "Initech Software", domain: "initech.example", industry: "Software", sizeRange: "11-50" },
  { name: "Umbrella Health", domain: "umbrellahealth.example", industry: "Healthcare", sizeRange: "201-500" },
];

const CONTACT_TITLES = ["VP of Sales", "Head of Operations", "CEO", "Procurement Manager"];

async function main() {
  const organizationId = process.env.SEED_ORGANIZATION_ID;
  if (!organizationId) {
    throw new Error("Set SEED_ORGANIZATION_ID to the organization you want to seed sample data into.");
  }

  const org = await db.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw new Error(`No organization found with id ${organizationId}`);

  const stages = await db.pipelineStage.findMany({
    where: { organizationId },
    orderBy: { order: "asc" },
  });
  if (stages.length === 0) throw new Error("This organization has no pipeline stages yet.");

  const membership = await db.membership.findFirst({ where: { organizationId } });
  if (!membership) throw new Error("This organization has no members yet.");
  const userId = membership.userId;

  console.log(`Seeding sample data into "${org.name}" (${organizationId})...`);

  const openStages = stages.filter((s) => !s.isWon && !s.isLost);
  const wonStage = stages.find((s) => s.isWon);
  const lostStage = stages.find((s) => s.isLost);

  let companyCount = 0;
  let contactCount = 0;
  let dealCount = 0;

  for (const [i, sample] of SAMPLE_COMPANIES.entries()) {
    const company = await db.company.create({
      data: { organizationId, createdByUserId: userId, ...sample },
    });
    companyCount++;

    const contact = await db.contact.create({
      data: {
        organizationId,
        companyId: company.id,
        createdByUserId: userId,
        firstName: ["Alex", "Jordan", "Taylor", "Morgan", "Casey"][i],
        lastName: ["Rivera", "Chen", "Patel", "Okafor", "Kim"][i],
        title: CONTACT_TITLES[i % CONTACT_TITLES.length],
        email: `contact${i}@${sample.domain}`,
      },
    });
    contactCount++;

    // Distribute deals: most open across the non-terminal stages, one won,
    // one lost — a realistic-looking spread on the Kanban board.
    let stage = openStages[i % openStages.length];
    let status: "OPEN" | "WON" | "LOST" = "OPEN";
    if (i === SAMPLE_COMPANIES.length - 2 && wonStage) {
      stage = wonStage;
      status = "WON";
    } else if (i === SAMPLE_COMPANIES.length - 1 && lostStage) {
      stage = lostStage;
      status = "LOST";
    }

    const deal = await db.deal.create({
      data: {
        organizationId,
        companyId: company.id,
        primaryContactId: contact.id,
        title: `${company.name} — Annual contract`,
        value: (5000 + i * 3500).toString(),
        stageId: stage.id,
        ownerUserId: userId,
        status,
      },
    });
    dealCount++;

    await db.activity.create({
      data: {
        organizationId,
        dealId: deal.id,
        type: "NOTE",
        body: "Seeded sample deal for demo purposes.",
        authorUserId: userId,
      },
    });
  }

  console.log(`Done — created ${companyCount} companies, ${contactCount} contacts, ${dealCount} deals.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
