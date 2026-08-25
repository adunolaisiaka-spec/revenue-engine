import { db } from "@/server/db";

export function listContacts(organizationId: string) {
  return db.contact.findMany({
    where: { organizationId },
    include: { company: true },
    orderBy: { createdAt: "desc" },
  });
}

export function getContact(organizationId: string, id: string) {
  return db.contact.findFirst({
    where: { id, organizationId },
    include: {
      company: true,
      primaryOnDeals: { include: { stage: true } },
    },
  });
}

export type CreateContactInput = {
  firstName: string;
  lastName: string;
  companyId?: string | null;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  createdByUserId: string;
};

export async function createContact(organizationId: string, data: CreateContactInput) {
  if (data.companyId) {
    await assertCompanyInOrg(organizationId, data.companyId);
  }
  return db.contact.create({ data: { organizationId, ...data } });
}

export type UpdateContactInput = Partial<Omit<CreateContactInput, "createdByUserId">>;

export async function updateContact(
  organizationId: string,
  id: string,
  data: UpdateContactInput
) {
  if (data.companyId) {
    await assertCompanyInOrg(organizationId, data.companyId);
  }
  const result = await db.contact.updateMany({
    where: { id, organizationId },
    data,
  });
  if (result.count === 0) {
    throw new Error("Contact not found in this organization.");
  }
}

async function assertCompanyInOrg(organizationId: string, companyId: string) {
  const company = await db.company.findFirst({
    where: { id: companyId, organizationId },
    select: { id: true },
  });
  if (!company) {
    throw new Error("Company not found in this organization.");
  }
}
