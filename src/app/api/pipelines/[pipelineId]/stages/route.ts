import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspace } from "@/lib/api-helpers";
import { createStageSchema } from "@/lib/validations";

type Params = { params: Promise<{ pipelineId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { pipelineId } = await params;
  const { session, userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const pipeline = await prisma.pipeline.findFirst({
    where: { id: pipelineId, workspaceId: workspace.id },
  });
  if (!pipeline) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = createStageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const maxOrder = await prisma.stage.aggregate({
    where: { pipelineId },
    _max: { order: true },
  });

  const stage = await prisma.stage.create({
    data: {
      ...parsed.data,
      pipelineId,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json(stage, { status: 201 });
}
