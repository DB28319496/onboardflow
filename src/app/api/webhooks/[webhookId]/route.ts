import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspace, requireRole } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ webhookId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { webhookId } = await params;
  const { userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, member, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const roleError = requireRole(member!, "ADMIN");
  if (roleError) return roleError;

  const existing = await prisma.webhook.findFirst({
    where: { id: webhookId, workspaceId: workspace.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const webhook = await prisma.webhook.update({
    where: { id: webhookId },
    data: {
      ...(body.url !== undefined ? { url: body.url } : {}),
      ...(body.events !== undefined ? { events: JSON.stringify(body.events) } : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
    },
  });

  logAudit({
    action: "WEBHOOK_UPDATED",
    description: `Updated webhook "${webhook.url}"`,
    metadata: { webhookId, changes: Object.keys(body).filter(k => body[k] !== undefined) },
    userId,
    workspaceId: workspace.id,
  }).catch(console.error);

  return NextResponse.json(webhook);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { webhookId } = await params;
  const { userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, member, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const roleError = requireRole(member!, "ADMIN");
  if (roleError) return roleError;

  const existing = await prisma.webhook.findFirst({
    where: { id: webhookId, workspaceId: workspace.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.webhook.delete({ where: { id: webhookId } });

  logAudit({
    action: "WEBHOOK_DELETED",
    description: `Deleted webhook "${existing.url}"`,
    metadata: { webhookId },
    userId,
    workspaceId: workspace.id,
  }).catch(console.error);

  return NextResponse.json({ ok: true });
}
