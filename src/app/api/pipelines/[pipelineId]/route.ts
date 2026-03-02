import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspace } from "@/lib/api-helpers";
import { updatePipelineSchema } from "@/lib/validations";

type Params = { params: Promise<{ pipelineId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { pipelineId } = await params;
  const { session, userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const pipeline = await prisma.pipeline.findFirst({
    where: { id: pipelineId, workspaceId: workspace.id },
    include: {
      stages: {
        orderBy: { order: "asc" },
        include: {
          _count: { select: { clientsInStage: { where: { status: "ACTIVE" } } } },
        },
      },
    },
  });

  if (!pipeline) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(pipeline);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { pipelineId } = await params;
  const { session, userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const existing = await prisma.pipeline.findFirst({
    where: { id: pipelineId, workspaceId: workspace.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updatePipelineSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  if (parsed.data.isDefault) {
    await prisma.pipeline.updateMany({
      where: { workspaceId: workspace.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  const pipeline = await prisma.pipeline.update({
    where: { id: pipelineId },
    data: parsed.data,
  });

  return NextResponse.json(pipeline);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { pipelineId } = await params;
  const { session, userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const existing = await prisma.pipeline.findFirst({
    where: { id: pipelineId, workspaceId: workspace.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.pipeline.delete({ where: { id: pipelineId } });
  return NextResponse.json({ ok: true });
}
