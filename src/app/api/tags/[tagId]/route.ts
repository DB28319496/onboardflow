import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspace } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ tagId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { tagId } = await params;
  const { userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const existing = await prisma.tag.findFirst({
    where: { id: tagId, workspaceId: workspace.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.tag.delete({ where: { id: tagId } });

  logAudit({
    action: "TAG_DELETED",
    description: `Deleted tag "${existing.name}"`,
    metadata: { tagId },
    userId,
    workspaceId: workspace.id,
  }).catch(console.error);

  return NextResponse.json({ ok: true });
}
