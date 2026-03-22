import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TimelineView } from "@/components/timeline/timeline-view";

export default async function TimelinePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  });
  if (!member) redirect("/login");

  const clients = await prisma.client.findMany({
    where: { workspaceId: member.workspaceId, status: "ACTIVE" },
    include: {
      currentStage: { select: { name: true, color: true, daysExpected: true } },
      pipeline: { select: { name: true } },
      assignedTo: { select: { name: true } },
    },
    orderBy: { stageEnteredAt: "asc" },
  });

  const timelineClients = clients.map((c) => {
    const stageEnteredAt = c.stageEnteredAt.toISOString();
    const daysInStage = Math.floor(
      (Date.now() - new Date(c.stageEnteredAt).getTime()) / 86_400_000
    );
    const daysExpected = c.currentStage?.daysExpected ?? null;
    const expectedEndDate = daysExpected
      ? new Date(new Date(c.stageEnteredAt).getTime() + daysExpected * 86_400_000).toISOString()
      : null;
    const isOverdue = daysExpected !== null && daysInStage > daysExpected;

    return {
      id: c.id,
      name: c.name,
      stageName: c.currentStage?.name ?? "No stage",
      stageColor: c.currentStage?.color ?? "#94A3B8",
      pipelineName: c.pipeline?.name ?? "",
      assignedTo: c.assignedTo?.name ?? null,
      stageEnteredAt,
      expectedEndDate,
      daysInStage,
      daysExpected,
      isOverdue,
      projectValue: c.projectValue,
    };
  });

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-5 pb-4 border-b border-border/50">
        <h1 className="text-2xl font-bold tracking-tight">Timeline</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Client deadlines and expected completion dates.
        </p>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <TimelineView clients={timelineClients} />
      </div>
    </div>
  );
}
