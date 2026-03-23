import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspace } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { sanitizeEmailHtml } from "@/lib/sanitize-html";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
  type: z.string().default("CUSTOM"),
});

export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const templates = await prisma.emailTemplate.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { emailLogs: true } },
    },
  });

  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const template = await prisma.emailTemplate.create({
    data: { ...parsed.data, body: sanitizeEmailHtml(parsed.data.body), workspaceId: workspace.id },
    include: { _count: { select: { emailLogs: true } } },
  });

  logAudit({
    action: "TEMPLATE_CREATED",
    description: `Created email template "${parsed.data.name}"`,
    metadata: { templateId: template.id },
    userId,
    workspaceId: workspace.id,
  }).catch(console.error);

  return NextResponse.json(template, { status: 201 });
}
