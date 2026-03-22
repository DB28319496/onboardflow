import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspace } from "@/lib/api-helpers";
import { fireAutomations } from "@/lib/automation-engine";
import { createNotification } from "@/lib/notifications";
import { fireWebhooks } from "@/lib/webhooks";

type Params = { params: Promise<{ clientId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { clientId } = await params;
  const { session, userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const existing = await prisma.client.findFirst({
    where: { id: clientId, workspaceId: workspace.id },
    include: { currentStage: { select: { name: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const fromStageId = existing.currentStageId ?? undefined;
  const { stageId } = await req.json();
  if (!stageId) return NextResponse.json({ error: "stageId is required" }, { status: 400 });

  const stage = await prisma.stage.findFirst({
    where: { id: stageId },
    include: { pipeline: { select: { workspaceId: true } } },
  });
  if (!stage || stage.pipeline.workspaceId !== workspace.id) {
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  }

  // Auto-complete: check if this is the final stage
  const allStages = await prisma.stage.findMany({
    where: { pipelineId: stage.pipelineId },
    orderBy: { order: "asc" },
    select: { id: true, order: true },
  });
  const isFinalStage = allStages.length > 0 && allStages[allStages.length - 1].id === stageId;

  const client = await prisma.client.update({
    where: { id: clientId },
    data: {
      currentStageId: stageId,
      stageEnteredAt: new Date(),
      ...(isFinalStage ? { status: "COMPLETED" } : {}),
    },
    include: {
      currentStage: { select: { id: true, name: true, color: true, daysExpected: true } },
      assignedTo: { select: { id: true, name: true, image: true } },
      stageCompletions: { select: { checklistItemId: true, stageId: true } },
    },
  });

  await prisma.activity.create({
    data: {
      type: "STAGE_CHANGE",
      title: `Moved from "${existing.currentStage?.name ?? "No stage"}" to "${stage.name}"`,
      clientId,
      userId,
    },
  });

  // Log auto-completion if final stage
  if (isFinalStage) {
    prisma.activity.create({
      data: {
        type: "STATUS_CHANGE",
        title: `Automatically marked as Completed (reached final stage)`,
        clientId,
        userId,
      },
    }).catch(console.error);

    fireWebhooks(workspace.id, "CLIENT_COMPLETED", {
      clientId,
      clientName: client.name,
      stage: stage.name,
    }).catch(console.error);
  }

  // Fire webhooks (non-blocking)
  fireWebhooks(workspace.id, "STAGE_CHANGE", {
    clientId,
    clientName: client.name,
    fromStage: existing.currentStage?.name,
    toStage: stage.name,
  }).catch(console.error);

  // Notify assigned user if different from mover (non-blocking)
  if (client.assignedTo && client.assignedTo.id !== userId) {
    createNotification({
      type: "STAGE_CHANGE",
      title: `${client.name} moved to ${stage.name}`,
      message: `From "${existing.currentStage?.name ?? "No stage"}"`,
      link: `/clients/${clientId}`,
      userId: client.assignedTo.id,
      workspaceId: workspace.id,
    }).catch(console.error);
  }

  // Fire STAGE_ENTRY automation rules (non-blocking)
  // Enhancement 1: pass fromStageId for from/to stage matching
  fireAutomations(
    { type: "STAGE_ENTRY", stageId, fromStageId },
    { ...client, portalToken: client.portalToken ?? null, stageEnteredAt: client.stageEnteredAt ?? null },
    { ...workspace, portalEnabled: workspace.portalEnabled ?? false },
    stage.name
  ).catch(console.error);

  return NextResponse.json(client);
}
