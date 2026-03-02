import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AutomationsClient } from "@/components/automations/automations-client";

export default async function AutomationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  });
  if (!member) redirect("/login");

  const [rules, templates, pipelines] = await Promise.all([
    prisma.automationRule.findMany({
      where: { workspaceId: member.workspaceId },
      orderBy: { createdAt: "asc" },
      include: {
        template: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true } },
      },
    }),
    prisma.emailTemplate.findMany({
      where: { workspaceId: member.workspaceId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.pipeline.findMany({
      where: { workspaceId: member.workspaceId },
      include: { stages: { orderBy: { order: "asc" }, select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Flatten stages with pipeline name for the dialog dropdown
  const stages = pipelines.flatMap((p) =>
    p.stages.map((s) => ({ id: s.id, name: s.name, pipelineName: p.name }))
  );

  // Serialize dates
  const serializedRules = rules.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <AutomationsClient
      initialRules={serializedRules}
      stages={stages}
      templates={templates}
    />
  );
}
