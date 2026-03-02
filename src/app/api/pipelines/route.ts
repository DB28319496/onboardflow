import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspace } from "@/lib/api-helpers";
import { createPipelineSchema } from "@/lib/validations";

export async function GET() {
  const { session, userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const pipelines = await prisma.pipeline.findMany({
    where: { workspaceId: workspace.id },
    include: {
      stages: { orderBy: { order: "asc" }, select: { id: true, name: true, color: true } },
      _count: { select: { clients: { where: { status: "ACTIVE" } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(pipelines);
}

export async function POST(req: NextRequest) {
  const { session, userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const body = await req.json();
  const parsed = createPipelineSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { name, description, isDefault } = parsed.data;

  if (isDefault) {
    await prisma.pipeline.updateMany({
      where: { workspaceId: workspace.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  const pipeline = await prisma.pipeline.create({
    data: { name, description, isDefault: isDefault ?? false, workspaceId: workspace.id },
  });

  return NextResponse.json(pipeline, { status: 201 });
}
