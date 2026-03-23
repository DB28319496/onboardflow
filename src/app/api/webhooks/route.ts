import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspace, requireRole } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const createSchema = z.object({
  url: z.string().url("Invalid URL"),
  events: z.array(z.string()).min(1, "Select at least one event"),
});

export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const webhooks = await prisma.webhook.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(webhooks);
}

export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, member, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const roleError = requireRole(member!, "ADMIN");
  if (roleError) return roleError;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const webhook = await prisma.webhook.create({
    data: {
      url: parsed.data.url,
      events: JSON.stringify(parsed.data.events),
      workspaceId: workspace.id,
    },
  });

  logAudit({
    action: "WEBHOOK_CREATED",
    description: `Created webhook for ${parsed.data.url}`,
    metadata: { webhookId: webhook.id, events: parsed.data.events },
    userId,
    workspaceId: workspace.id,
  }).catch(console.error);

  return NextResponse.json(webhook, { status: 201 });
}
