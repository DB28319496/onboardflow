import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspace, requireRole } from "@/lib/api-helpers";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  emailFromName: z.string().optional().nullable(),
  emailReplyTo: z.string().email().optional().nullable().or(z.literal("")),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  portalEnabled: z.boolean().optional(),
  intakeEnabled: z.boolean().optional(),
});

export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const ws = await prisma.workspace.findUnique({
    where: { id: workspace.id },
    select: {
      id: true,
      name: true,
      slug: true,
      brandColor: true,
      portalEnabled: true,
      intakeEnabled: true,
      emailFromName: true,
      emailReplyTo: true,
      apiKey: true,
      createdAt: true,
    },
  });

  return NextResponse.json(ws);
}

export async function PATCH(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, member, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const roleError = requireRole(member!, "ADMIN");
  if (roleError) return roleError;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { emailReplyTo, ...rest } = parsed.data;
  const updated = await prisma.workspace.update({
    where: { id: workspace.id },
    data: {
      ...rest,
      emailReplyTo: emailReplyTo === "" ? null : emailReplyTo,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      brandColor: true,
      portalEnabled: true,
      intakeEnabled: true,
      emailFromName: true,
      emailReplyTo: true,
      apiKey: true,
    },
  });

  logAudit({
    action: "SETTINGS_UPDATED",
    description: `Updated workspace settings`,
    metadata: parsed.data as Record<string, unknown>,
    userId,
    workspaceId: workspace.id,
  }).catch(console.error);

  return NextResponse.json(updated);
}
