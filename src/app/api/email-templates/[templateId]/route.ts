import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspace, requireRole } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { sanitizeEmailHtml } from "@/lib/sanitize-html";
import { z } from "zod";

type Params = { params: Promise<{ templateId: string }> };

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  type: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const { templateId } = await params;
  const { userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const existing = await prisma.emailTemplate.findFirst({
    where: { id: templateId, workspaceId: workspace.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const data = { ...parsed.data };
  if (data.body) data.body = sanitizeEmailHtml(data.body);

  const template = await prisma.emailTemplate.update({
    where: { id: templateId },
    data,
    include: { _count: { select: { emailLogs: true } } },
  });

  logAudit({
    action: "TEMPLATE_UPDATED",
    description: `Updated email template "${template.name}"`,
    metadata: { templateId, changes: Object.keys(parsed.data) },
    userId,
    workspaceId: workspace.id,
  }).catch(console.error);

  return NextResponse.json(template);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { templateId } = await params;
  const { userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, member, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const roleError = requireRole(member!, "ADMIN");
  if (roleError) return roleError;

  const existing = await prisma.emailTemplate.findFirst({
    where: { id: templateId, workspaceId: workspace.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.emailTemplate.delete({ where: { id: templateId } });

  logAudit({
    action: "TEMPLATE_DELETED",
    description: `Deleted email template "${existing.name}"`,
    metadata: { templateId },
    userId,
    workspaceId: workspace.id,
  }).catch(console.error);

  return NextResponse.json({ ok: true });
}
