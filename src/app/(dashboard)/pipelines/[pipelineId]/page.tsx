import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { PipelineEditor } from "@/components/pipelines/pipeline-editor";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function PipelineEditorPage({
  params,
}: {
  params: Promise<{ pipelineId: string }>;
}) {
  const { pipelineId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  });
  if (!member) redirect("/login");

  const pipeline = await prisma.pipeline.findFirst({
    where: { id: pipelineId, workspaceId: member.workspaceId },
    include: {
      stages: {
        orderBy: { order: "asc" },
        include: {
          _count: { select: { clientsInStage: { where: { status: "ACTIVE" } } } },
        },
      },
    },
  });

  if (!pipeline) notFound();

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href="/pipelines"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pipelines
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Edit Pipeline</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Configure stages, durations, and checklists for {pipeline.name}.
        </p>
      </div>

      <PipelineEditor
        pipeline={{
          id: pipeline.id,
          name: pipeline.name,
          isDefault: pipeline.isDefault,
          stages: pipeline.stages.map((s) => ({
            id: s.id,
            name: s.name,
            color: s.color,
            daysExpected: s.daysExpected,
            order: s.order,
            checklist: s.checklist,
            _count: s._count,
          })),
        }}
      />
    </div>
  );
}
