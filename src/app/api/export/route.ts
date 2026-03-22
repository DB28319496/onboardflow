import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspace, requireRole } from "@/lib/api-helpers";

export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, member, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const roleError = requireRole(member!, "ADMIN");
  if (roleError) return roleError;

  const wid = workspace.id;

  const [
    workspaceData,
    members,
    pipelines,
    clients,
    emailTemplates,
    automationRules,
    emailLogs,
    auditLogs,
  ] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id: wid },
      select: {
        name: true,
        slug: true,
        brandColor: true,
        portalEnabled: true,
        intakeEnabled: true,
        emailFromName: true,
        emailReplyTo: true,
        createdAt: true,
      },
    }),
    prisma.workspaceMember.findMany({
      where: { workspaceId: wid },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.pipeline.findMany({
      where: { workspaceId: wid },
      include: { stages: { orderBy: { order: "asc" } } },
    }),
    prisma.client.findMany({
      where: { workspaceId: wid },
      include: {
        activities: { orderBy: { createdAt: "desc" } },
        documents: true,
        stageCompletions: true,
        customFieldValues: { include: { customField: { select: { name: true, type: true } } } },
        tags: { include: { tag: { select: { name: true, color: true } } } },
      },
    }),
    prisma.emailTemplate.findMany({ where: { workspaceId: wid } }),
    prisma.automationRule.findMany({ where: { workspaceId: wid } }),
    prisma.emailLog.findMany({
      where: { workspaceId: wid },
      select: { subject: true, status: true, sentAt: true, openedAt: true, clientId: true },
      orderBy: { sentAt: "desc" },
      take: 500,
    }),
    prisma.auditLog.findMany({
      where: { workspaceId: wid },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    workspace: workspaceData,
    members: members.map((m) => ({
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      joinedAt: m.createdAt,
    })),
    pipelines: pipelines.map((p) => ({
      name: p.name,
      description: p.description,
      isDefault: p.isDefault,
      stages: p.stages.map((s) => ({
        name: s.name,
        order: s.order,
        color: s.color,
        daysExpected: s.daysExpected,
      })),
    })),
    clients: clients.map((c) => ({
      name: c.name,
      email: c.email,
      phone: c.phone,
      companyName: c.companyName,
      projectType: c.projectType,
      projectValue: c.projectValue,
      status: c.status,
      source: c.source,
      notes: c.notes,
      createdAt: c.createdAt,
      tags: c.tags.map((t) => t.tag.name),
      customFields: c.customFieldValues.map((v) => ({
        field: v.customField.name,
        value: v.value,
      })),
      activities: c.activities.map((a) => ({
        type: a.type,
        title: a.title,
        description: a.description,
        createdAt: a.createdAt,
      })),
      documents: c.documents.map((d) => ({
        name: d.name,
        url: d.url,
        size: d.size,
        createdAt: d.createdAt,
      })),
    })),
    emailTemplates: emailTemplates.map((t) => ({
      name: t.name,
      subject: t.subject,
      body: t.body,
      type: t.type,
    })),
    automationRules: automationRules.map((r) => ({
      name: r.name,
      triggerType: r.triggerType,
      triggerConfig: r.triggerConfig,
      actionType: r.actionType,
      isActive: r.isActive,
    })),
    emailLogs,
    auditLogs: auditLogs.map((l) => ({
      action: l.action,
      description: l.description,
      user: l.user.name ?? l.user.email,
      createdAt: l.createdAt,
    })),
  };

  const json = JSON.stringify(exportData, null, 2);

  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="cadence-export-${workspace.slug}-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}
