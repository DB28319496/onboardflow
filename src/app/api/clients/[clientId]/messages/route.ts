import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspace } from "@/lib/api-helpers";
import { z } from "zod";

type Params = { params: Promise<{ clientId: string }> };

const messageSchema = z.object({
  content: z.string().min(1, "Message is required").max(2000),
});

export async function GET(_req: NextRequest, { params }: Params) {
  const { clientId } = await params;
  const { userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const client = await prisma.client.findFirst({
    where: { id: clientId, workspaceId: workspace.id },
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const messages = await prisma.portalMessage.findMany({
    where: { clientId },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { clientId } = await params;
  const { session, userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const client = await prisma.client.findFirst({
    where: { id: clientId, workspaceId: workspace.id },
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const message = await prisma.portalMessage.create({
    data: {
      content: parsed.data.content,
      senderType: "TEAM",
      senderName: session.user?.name ?? "Team",
      clientId,
      workspaceId: workspace.id,
      userId,
    },
  });

  return NextResponse.json(message, { status: 201 });
}
