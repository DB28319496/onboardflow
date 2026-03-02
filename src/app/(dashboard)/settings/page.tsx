import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/settings/settings-form";
import { TeamTab } from "@/components/settings/team-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  });
  if (!member) redirect("/login");

  const workspace = await prisma.workspace.findUnique({
    where: { id: member.workspaceId },
    select: {
      id: true,
      name: true,
      slug: true,
      brandColor: true,
      portalEnabled: true,
      intakeEnabled: true,
      emailFromName: true,
      emailReplyTo: true,
      apiKey: true,
    },
  });
  if (!workspace) redirect("/login");

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-5 pb-4 border-b border-border/50">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure your workspace, email, client portal, and team.
        </p>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="workspace">
          <TabsList className="mb-6">
            <TabsTrigger value="workspace">Workspace</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>
          <TabsContent value="workspace">
            <SettingsForm workspace={workspace} />
          </TabsContent>
          <TabsContent value="team">
            <TeamTab currentUserId={session.user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
