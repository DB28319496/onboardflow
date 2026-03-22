import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspace } from "@/lib/api-helpers";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  dueAt: z.string().datetime(),
  clientId: z.string(),
});

export async function GET(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const url = new URL(req.url);
  const filter = url.searchParams.get("filter") ?? "upcoming";

  const reminders = await prisma.reminder.findMany({
    where: {
      userId,
      workspaceId: workspace.id,
      ...(filter === "upcoming" ? { completed: false } : {}),
    },
    include: {
      client: { select: { id: true, name: true } },
    },
    orderBy: { dueAt: "asc" },
    take: 50,
  });

  return NextResponse.json(reminders);
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

  // Verify client belongs to workspace
  const client = await prisma.client.findFirst({
    where: { id: parsed.data.clientId, workspaceId: workspace.id },
  });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const reminder = await prisma.reminder.create({
    data: {
      title: parsed.data.title,
      dueAt: new Date(parsed.data.dueAt),
      clientId: parsed.data.clientId,
      userId,
      workspaceId: workspace.id,
    },
    include: { client: { select: { id: true, name: true } } },
  });

  return NextResponse.json(reminder, { status: 201 });
}
