import Link from "next/link";
import { requireOrgContext } from "@/server/auth";
import { listCompanies } from "@/server/queries/companies";
import { CreateCompanyDialog } from "@/components/companies/create-company-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function CompaniesPage() {
  const { organizationId } = await requireOrgContext();
  const companies = await listCompanies(organizationId);

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Companies</h1>
        <CreateCompanyDialog />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Domain</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No companies yet.
              </TableCell>
            </TableRow>
          )}
          {companies.map((company) => (
            <TableRow key={company.id}>
              <TableCell>
                <Link href={`/companies/${company.id}`} className="font-medium hover:underline">
                  {company.name}
                </Link>
              </TableCell>
              <TableCell>{company.industry ?? "—"}</TableCell>
              <TableCell>{company.sizeRange ?? "—"}</TableCell>
              <TableCell>{company.domain ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
