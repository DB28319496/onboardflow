import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspace, requireRole } from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["TEXT", "NUMBER", "DATE", "SELECT"]),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional(),
});

export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const fields = await prisma.customField.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(fields);
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

  const count = await prisma.customField.count({ where: { workspaceId: workspace.id } });

  const field = await prisma.customField.create({
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      options: parsed.data.options ? JSON.stringify(parsed.data.options) : null,
      required: parsed.data.required ?? false,
      order: count,
      workspaceId: workspace.id,
    },
  });

  logAudit({
    action: "CUSTOM_FIELD_CREATED",
    description: `Created custom field "${parsed.data.name}" (${parsed.data.type})`,
    metadata: { fieldId: field.id, type: parsed.data.type },
    userId,
    workspaceId: workspace.id,
  }).catch(console.error);

  return NextResponse.json(field, { status: 201 });
}
