import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspace, requireRole } from "@/lib/api-helpers";
import { updateClientSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ clientId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { clientId } = await params;
  const { session, userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const client = await prisma.client.findFirst({
    where: { id: clientId, workspaceId: workspace.id },
    include: {
      currentStage: true,
      pipeline: { include: { stages: { orderBy: { order: "asc" } } } },
      assignedTo: { select: { id: true, name: true, image: true } },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      stageCompletions: true,
      emailLogs: { orderBy: { sentAt: "desc" }, take: 10 },
      customFieldValues: true,
      tags: { include: { tag: true } },
    },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { clientId } = await params;
  const { session, userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const existing = await prisma.client.findFirst({
    where: { id: clientId, workspaceId: workspace.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { customFields, ...rest } = body;
  const parsed = updateClientSchema.safeParse(rest);
  if (!parsed.success && Object.keys(rest).length > 0) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  // Update standard fields if provided
  if (parsed.success && Object.keys(parsed.data).length > 0) {
    await prisma.client.update({
      where: { id: clientId },
      data: { ...parsed.data, email: parsed.data.email === "" ? null : parsed.data.email },
    });
  }

  // Update custom field values if provided
  if (customFields && typeof customFields === "object") {
    for (const [fieldId, value] of Object.entries(customFields as Record<string, string>)) {
      await prisma.customFieldValue.upsert({
        where: { customFieldId_clientId: { customFieldId: fieldId, clientId } },
        update: { value: String(value) },
        create: { customFieldId: fieldId, clientId, value: String(value) },
      });
    }
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: { customFieldValues: true },
  });

  return NextResponse.json(client);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { clientId } = await params;
  const { session, userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, member, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const roleError = requireRole(member!, "ADMIN");
  if (roleError) return roleError;

  const existing = await prisma.client.findFirst({
    where: { id: clientId, workspaceId: workspace.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.client.delete({ where: { id: clientId } });

  logAudit({
    action: "CLIENT_DELETED",
    description: `Deleted client "${existing.name}"`,
    userId,
    workspaceId: workspace.id,
  }).catch(console.error);

  return NextResponse.json({ ok: true });
}
