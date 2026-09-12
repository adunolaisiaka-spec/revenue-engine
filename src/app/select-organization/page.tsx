import Link from "next/link";
import { OrganizationList } from "@clerk/nextjs";

// Minimal onboarding step: a signed-in Clerk user with no active organization
// lands here (see requireOrgContext in src/server/auth.ts) to create a new
// org or pick one they already belong to.
export default function SelectOrganizationPage() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="border-b border-border px-6 py-4">
        <Link href="/" className="font-semibold">
          Revenue Engine
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center py-16">
        <OrganizationList
          hidePersonal
          afterCreateOrganizationUrl="/pipeline"
          afterSelectOrganizationUrl="/pipeline"
        />
      </div>
    </div>
  );
}
