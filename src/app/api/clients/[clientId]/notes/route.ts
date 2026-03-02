import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspace } from "@/lib/api-helpers";

type Params = { params: Promise<{ clientId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { clientId } = await params;
  const { session, userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const existing = await prisma.client.findFirst({
    where: { id: clientId, workspaceId: workspace.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { content } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "Note content is required" }, { status: 400 });
  }

  const activity = await prisma.activity.create({
    data: {
      type: "NOTE_ADDED",
      title: "Note added",
      description: content.trim(),
      clientId,
      userId,
    },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json(activity, { status: 201 });
}
