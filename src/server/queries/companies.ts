import { db } from "@/server/db";

export function listCompanies(organizationId: string) {
  return db.company.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });
}

export function getCompany(organizationId: string, id: string) {
  return db.company.findFirst({
    where: { id, organizationId },
    include: {
      contacts: { orderBy: { createdAt: "desc" } },
      deals: {
        include: { stage: true, owner: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export type CreateCompanyInput = {
  name: string;
  domain?: string | null;
  industry?: string | null;
  sizeRange?: string | null;
  description?: string | null;
  createdByUserId: string;
};

export function createCompany(organizationId: string, data: CreateCompanyInput) {
  return db.company.create({ data: { organizationId, ...data } });
}

export type UpdateCompanyInput = Partial<Omit<CreateCompanyInput, "createdByUserId">>;

export async function updateCompany(
  organizationId: string,
  id: string,
  data: UpdateCompanyInput
) {
  const result = await db.company.updateMany({
    where: { id, organizationId },
    data,
  });
  if (result.count === 0) {
    throw new Error("Company not found in this organization.");
  }
}
