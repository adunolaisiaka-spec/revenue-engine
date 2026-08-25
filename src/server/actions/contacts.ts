"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/server/auth";
import * as contacts from "@/server/queries/contacts";

function textOrNull(value: FormDataEntryValue | null): string | null {
  const str = String(value ?? "").trim();
  return str === "" ? null : str;
}

export async function createContactAction(formData: FormData) {
  const { organizationId, userId } = await requireOrgContext();

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  if (!firstName || !lastName) {
    throw new Error("First and last name are required.");
  }

  const contact = await contacts.createContact(organizationId, {
    firstName,
    lastName,
    companyId: textOrNull(formData.get("companyId")),
    email: textOrNull(formData.get("email")),
    phone: textOrNull(formData.get("phone")),
    title: textOrNull(formData.get("title")),
    createdByUserId: userId,
  });

  revalidatePath("/contacts");
  return contact;
}

export async function updateContactAction(contactId: string, formData: FormData) {
  const { organizationId } = await requireOrgContext();

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  if (!firstName || !lastName) {
    throw new Error("First and last name are required.");
  }

  await contacts.updateContact(organizationId, contactId, {
    firstName,
    lastName,
    companyId: textOrNull(formData.get("companyId")),
    email: textOrNull(formData.get("email")),
    phone: textOrNull(formData.get("phone")),
    title: textOrNull(formData.get("title")),
  });

  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/contacts");
}
