import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { Users, DollarSign, TrendingUp, Plus } from "lucide-react";
import { KanbanBoard, KanbanClient, KanbanPipeline } from "@/components/kanban/kanban-board";
import { PipelineSwitcher } from "@/components/kanban/pipeline-switcher";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import Link from "next/link";
import { Suspense } from "react";

async function getDashboardData(workspaceId: string, pipelineId?: string) {
  const allPipelines = await prisma.pipeline.findMany({
    where: { workspaceId, isActive: true },
    select: { id: true, name: true, isDefault: true },
    orderBy: { createdAt: "asc" },
  });

  if (allPipelines.length === 0) {
    return { pipeline: null, allPipelines: [], clients: [], totalValue: 0, totalActive: 0 };
  }

  let selectedId = pipelineId;
  if (!selectedId || !allPipelines.find((p) => p.id === selectedId)) {
    selectedId =
      allPipelines.find((p) => p.isDefault)?.id ?? allPipelines[0].id;
  }

  const pipeline = await prisma.pipeline.findUnique({
    where: { id: selectedId },
    include: { stages: { orderBy: { order: "asc" } } },
  });

  if (!pipeline) return { pipeline: null, allPipelines, clients: [], totalValue: 0, totalActive: 0 };

  const dbClients = await prisma.client.findMany({
    where: { workspaceId, pipelineId: pipeline.id, status: "ACTIVE" },
    include: {
      assignedTo: { select: { id: true, name: true, image: true } },
      stageCompletions: { select: { checklistItemId: true, stageId: true } },
    },
    orderBy: { stageEnteredAt: "asc" },
  });

  const totalValue = dbClients.reduce((sum, c) => sum + (c.projectValue ?? 0), 0);

  const clients: KanbanClient[] = dbClients.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    projectType: c.projectType,
    projectValue: c.projectValue,
    currentStageId: c.currentStageId,
    stageEnteredAt: c.stageEnteredAt.toISOString(),
    stageCompletions: c.stageCompletions,
    assignedTo: c.assignedTo,
  }));

  const kanbanPipeline: KanbanPipeline = {
    id: pipeline.id,
    name: pipeline.name,
    stages: pipeline.stages.map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color,
      order: s.order,
      daysExpected: s.daysExpected,
      checklist: s.checklist,
    })),
  };

  // Fetch recent workspace-wide activities
  const recentActivities = await prisma.activity.findMany({
    where: { client: { workspaceId } },
    include: {
      user: { select: { name: true, image: true } },
      client: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  return { pipeline: kanbanPipeline, allPipelines, clients, totalValue, totalActive: clients.length, recentActivities };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ pipeline?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  });
  if (!member) redirect("/login");

  const { pipeline: pipelineParam } = await searchParams;

  const { pipeline, allPipelines, clients, totalValue, totalActive, recentActivities } =
    await getDashboardData(member.workspaceId, pipelineParam);

  const avgValue = totalActive > 0 ? totalValue / totalActive : 0;

  if (!pipeline) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12">
        <div className="max-w-sm">
          <h2 className="text-xl font-bold mb-2">No Pipeline Yet</h2>
          <p className="text-muted-foreground mb-6">
            Create your first pipeline to start tracking clients.
          </p>
          <Link
            href="/pipelines"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Pipeline
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-6 pb-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Suspense fallback={<h1 className="text-xl font-bold tracking-tight">{pipeline.name}</h1>}>
              <PipelineSwitcher
                pipelines={allPipelines}
                currentPipelineId={pipeline.id}
              />
            </Suspense>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pipeline.stages.length} stages · {totalActive} active clients
            </p>
          </div>
          <Link
            href={`/pipelines/${pipeline.id}`}
            className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"
          >
            Edit Pipeline
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-muted/40 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Active Clients</span>
            </div>
            <p className="text-2xl font-bold">{totalActive}</p>
          </div>
          <div className="bg-muted/40 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Pipeline Value</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
          </div>
          <div className="bg-muted/40 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Avg Value</span>
            </div>
            <p className="text-2xl font-bold">
              {avgValue > 0 ? formatCurrency(avgValue) : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto p-6">
        <div className="flex gap-6 h-full">
          <div className="flex-1 min-w-0">
            <KanbanBoard pipeline={pipeline} initialClients={clients} />
          </div>
          <div className="hidden xl:block w-72 shrink-0">
            <div className="sticky top-0">
              <p className="text-sm font-semibold mb-3">Recent Activity</p>
              <div className="rounded-xl border border-border/60 bg-card">
                <ActivityFeed activities={recentActivities} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
