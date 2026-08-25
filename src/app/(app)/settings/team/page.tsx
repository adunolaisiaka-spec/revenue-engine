import { clerkClient } from "@clerk/nextjs/server";
import { requireOrgContext } from "@/server/auth";
import { listTeamMembers } from "@/server/queries/team";
import { InviteMemberDialog } from "@/components/team/invite-member-dialog";
import { Badge } from "@/components/ui/badge";

export default async function TeamSettingsPage() {
  const { organizationId, clerkOrgId, role } = await requireOrgContext();
  const isAdmin = role === "ADMIN";

  const [members, pendingInvitations] = await Promise.all([
    listTeamMembers(organizationId),
    isAdmin ? getPendingInvitations(clerkOrgId) : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Team</h1>
        {isAdmin && <InviteMemberDialog />}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Members</h2>
        {members.map((membership) => (
          <div
            key={membership.id}
            className="flex items-center justify-between rounded-lg border p-3 text-sm"
          >
            <div>
              <span className="font-medium">
                {membership.user.name ?? membership.user.email}
              </span>
              <span className="ml-2 text-muted-foreground">{membership.user.email}</span>
            </div>
            <Badge variant={membership.role === "ADMIN" ? "default" : "secondary"}>
              {membership.role === "ADMIN" ? "Admin" : "Rep"}
            </Badge>
          </div>
        ))}
      </div>

      {isAdmin && pendingInvitations.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">Pending invitations</h2>
          {pendingInvitations.map((invitation) => (
            <div
              key={invitation.id}
              className="flex items-center justify-between rounded-lg border border-dashed p-3 text-sm text-muted-foreground"
            >
              <span>{invitation.emailAddress}</span>
              <Badge variant="outline">
                {invitation.role === "org:admin" ? "Admin" : "Rep"} · pending
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

async function getPendingInvitations(clerkOrgId: string) {
  const client = await clerkClient();
  const { data } = await client.organizations.getOrganizationInvitationList({
    organizationId: clerkOrgId,
    status: ["pending"],
  });
  return data;
}
