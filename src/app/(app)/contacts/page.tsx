import Link from "next/link";
import { requireOrgContext } from "@/server/auth";
import { listContacts } from "@/server/queries/contacts";
import { listCompanies } from "@/server/queries/companies";
import { CreateContactDialog } from "@/components/contacts/create-contact-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ContactsPage() {
  const { organizationId } = await requireOrgContext();
  const [contacts, companies] = await Promise.all([
    listContacts(organizationId),
    listCompanies(organizationId),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Contacts</h1>
        <CreateContactDialog companies={companies.map((c) => ({ id: c.id, name: c.name }))} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No contacts yet.
              </TableCell>
            </TableRow>
          )}
          {contacts.map((contact) => (
            <TableRow key={contact.id}>
              <TableCell>
                <Link href={`/contacts/${contact.id}`} className="font-medium hover:underline">
                  {contact.firstName} {contact.lastName}
                </Link>
              </TableCell>
              <TableCell>{contact.title ?? "—"}</TableCell>
              <TableCell>
                {contact.company ? (
                  <Link href={`/companies/${contact.company.id}`} className="hover:underline">
                    {contact.company.name}
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>{contact.email ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
