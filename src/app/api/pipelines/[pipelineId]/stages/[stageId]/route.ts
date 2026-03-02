import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspace } from "@/lib/api-helpers";
import { updateStageSchema } from "@/lib/validations";

type Params = { params: Promise<{ pipelineId: string; stageId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { pipelineId, stageId } = await params;
  const { session, userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const stage = await prisma.stage.findFirst({
    where: { id: stageId, pipelineId },
    include: { pipeline: { select: { workspaceId: true } } },
  });
  if (!stage || stage.pipeline.workspaceId !== workspace.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateStageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const updated = await prisma.stage.update({ where: { id: stageId }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { pipelineId, stageId } = await params;
  const { session, userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const stage = await prisma.stage.findFirst({
    where: { id: stageId, pipelineId },
    include: { pipeline: { select: { workspaceId: true } } },
  });
  if (!stage || stage.pipeline.workspaceId !== workspace.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.stage.delete({ where: { id: stageId } });
  return NextResponse.json({ ok: true });
}
