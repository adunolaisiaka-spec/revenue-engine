import Link from "next/link";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { requireOrgContext } from "@/server/auth";

const NAV_LINKS = [
  { href: "/pipeline", label: "Pipeline" },
  { href: "/companies", label: "Companies" },
  { href: "/contacts", label: "Contacts" },
  { href: "/research/market", label: "Market Research" },
  { href: "/settings/team", label: "Team" },
  { href: "/settings/billing", label: "Billing" },
];

export default async function AppLayout({ children }: LayoutProps<"/">) {
  // Every route under (app) is org-scoped. This also acts as the guard: it
  // redirects to /sign-in or /select-organization when the prerequisites
  // aren't met, so no page in this group needs to repeat that check.
  await requireOrgContext();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-black/8 px-6 py-3 dark:border-white/[.145]">
        <div className="flex items-center gap-6">
          <span className="font-semibold">Revenue Engine</span>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <OrganizationSwitcher afterSelectOrganizationUrl="/pipeline" />
          <UserButton />
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
