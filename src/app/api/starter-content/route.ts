import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspace, requireRole } from "@/lib/api-helpers";
import { STARTER_TEMPLATES, STARTER_AUTOMATIONS } from "@/lib/starter-content";

export async function POST() {
  const { userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, member, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;
  const roleError = requireRole(member!, "ADMIN");
  if (roleError) return roleError;

  const wid = workspace.id;

  // Check what already exists to avoid duplicates
  const existingTemplates = await prisma.emailTemplate.findMany({
    where: { workspaceId: wid },
    select: { name: true },
  });
  const existingNames = new Set(existingTemplates.map((t) => t.name));

  let templatesAdded = 0;
  let automationsAdded = 0;

  const templateMap = new Map<string, string>();

  // Add missing templates
  for (const t of STARTER_TEMPLATES) {
    if (existingNames.has(t.name)) {
      // Still need the ID for automation linking
      const existing = await prisma.emailTemplate.findFirst({
        where: { workspaceId: wid, name: t.name },
        select: { id: true },
      });
      if (existing) templateMap.set(t.name, existing.id);
      continue;
    }
    const created = await prisma.emailTemplate.create({
      data: {
        name: t.name,
        type: t.type,
        subject: t.subject,
        body: t.body,
        workspaceId: wid,
      },
    });
    templateMap.set(t.name, created.id);
    templatesAdded++;
  }

  // Check existing automations
  const existingRules = await prisma.automationRule.findMany({
    where: { workspaceId: wid },
    select: { name: true },
  });
  const existingRuleNames = new Set(existingRules.map((r) => r.name));

  for (const a of STARTER_AUTOMATIONS) {
    if (existingRuleNames.has(a.name)) continue;
    const templateId = a._templateName ? templateMap.get(a._templateName) ?? null : null;
    await prisma.automationRule.create({
      data: {
        name: a.name,
        triggerType: a.triggerType,
        triggerConfig: a.triggerConfig,
        actionType: a.actionType,
        actionConfig: a.actionConfig,
        templateId,
        workspaceId: wid,
      },
    });
    automationsAdded++;
  }

  return NextResponse.json({
    ok: true,
    templatesAdded,
    automationsAdded,
    message:
      templatesAdded === 0 && automationsAdded === 0
        ? "All starter content already exists"
        : `Added ${templatesAdded} templates and ${automationsAdded} automations`,
  });
}
