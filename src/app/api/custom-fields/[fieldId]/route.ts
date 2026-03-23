import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspace, requireRole } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ fieldId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { fieldId } = await params;
  const { userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, member, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const roleError = requireRole(member!, "ADMIN");
  if (roleError) return roleError;

  const existing = await prisma.customField.findFirst({
    where: { id: fieldId, workspaceId: workspace.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.customField.delete({ where: { id: fieldId } });

  logAudit({
    action: "CUSTOM_FIELD_DELETED",
    description: `Deleted custom field "${existing.name}"`,
    metadata: { fieldId },
    userId,
    workspaceId: workspace.id,
  }).catch(console.error);

  return NextResponse.json({ ok: true });
}
