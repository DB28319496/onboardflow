import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspace } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const tags = await prisma.tag.findMany({
    where: { workspaceId: workspace.id },
    include: { _count: { select: { clients: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(tags);
}

export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const tag = await prisma.tag.create({
    data: {
      name: parsed.data.name,
      color: parsed.data.color ?? "#6366F1",
      workspaceId: workspace.id,
    },
  });

  logAudit({
    action: "TAG_CREATED",
    description: `Created tag "${parsed.data.name}"`,
    metadata: { tagId: tag.id, color: parsed.data.color ?? "#6366F1" },
    userId,
    workspaceId: workspace.id,
  }).catch(console.error);

  return NextResponse.json(tag, { status: 201 });
}
