import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspace } from "@/lib/api-helpers";
import { z } from "zod";

type Params = { params: Promise<{ ruleId: string }> };

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  templateId: z.string().optional(),
  triggerConfig: z.record(z.string(), z.unknown()).optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  const { ruleId } = await params;
  const { userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const existing = await prisma.automationRule.findFirst({
    where: { id: ruleId, workspaceId: workspace.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { triggerConfig, ...rest } = parsed.data;

  const rule = await prisma.automationRule.update({
    where: { id: ruleId },
    data: {
      ...rest,
      ...(triggerConfig !== undefined
        ? { triggerConfig: JSON.stringify(triggerConfig) }
        : {}),
    },
    include: {
      template: { select: { id: true, name: true } },
      stage: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(rule);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { ruleId } = await params;
  const { userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const existing = await prisma.automationRule.findFirst({
    where: { id: ruleId, workspaceId: workspace.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.automationRule.delete({ where: { id: ruleId } });
  return NextResponse.json({ ok: true });
}
