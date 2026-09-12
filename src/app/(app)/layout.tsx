import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { requireOrgContext } from "@/server/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppNav } from "@/components/app-nav";
import { MobileNav } from "@/components/mobile-nav";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  // Every route under (app) is org-scoped. This also acts as the guard: it
  // redirects to /sign-in or /select-organization when the prerequisites
  // aren't met, so no page in this group needs to repeat that check.
  await requireOrgContext();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border bg-background/80 px-6 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <MobileNav />
          <span className="font-semibold">Revenue Engine</span>
          <AppNav />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <OrganizationSwitcher afterSelectOrganizationUrl="/pipeline" />
          <UserButton />
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
