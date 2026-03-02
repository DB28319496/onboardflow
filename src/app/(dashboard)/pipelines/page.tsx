import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitBranch, Users, Settings2 } from "lucide-react";
import Link from "next/link";
import { CreatePipelineButton } from "@/components/pipelines/create-pipeline-button";

export default async function PipelinesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  });
  if (!member) redirect("/login");

  const pipelines = await prisma.pipeline.findMany({
    where: { workspaceId: member.workspaceId },
    include: {
      stages: { orderBy: { order: "asc" }, select: { id: true, name: true, color: true } },
      _count: { select: { clients: { where: { status: "ACTIVE" } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipelines</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your client onboarding pipelines and stages.
          </p>
        </div>
        <CreatePipelineButton workspaceId={member.workspaceId} />
      </div>

      {pipelines.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-16 text-center">
          <GitBranch className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h2 className="font-semibold text-muted-foreground">No pipelines yet</h2>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Create your first pipeline to get started
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pipelines.map((pipeline) => (
            <div
              key={pipeline.id}
              className="bg-background rounded-xl border border-border p-4 flex items-center gap-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <GitBranch className="h-5 w-5 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{pipeline.name}</p>
                  {pipeline.isDefault && (
                    <Badge variant="secondary" className="text-xs">Default</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {pipeline.stages.length} stages
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {pipeline._count.clients} active
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {pipeline.stages.slice(0, 12).map((stage) => (
                    <div
                      key={stage.id}
                      className="h-2 w-2 rounded-full"
                      style={{ background: stage.color }}
                      title={stage.name}
                    />
                  ))}
                  {pipeline.stages.length > 12 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      +{pipeline.stages.length - 12}
                    </span>
                  )}
                </div>
              </div>

              <Link href={`/pipelines/${pipeline.id}`}>
                <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                  <Settings2 className="h-3.5 w-3.5" />
                  Edit Stages
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
