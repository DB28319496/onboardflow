import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspace, requireRole } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const { userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, member, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const roleError = requireRole(member!, "ADMIN");
  if (roleError) return roleError;

  const { inviteId } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { id: inviteId },
  });

  if (!invitation || invitation.workspaceId !== workspace.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.invitation.delete({ where: { id: inviteId } });

  logAudit({
    action: "INVITATION_REVOKED",
    description: `Revoked invitation for ${invitation.email}`,
    metadata: { inviteId, email: invitation.email },
    userId,
    workspaceId: workspace.id,
  }).catch(console.error);

  return NextResponse.json({ success: true });
}
