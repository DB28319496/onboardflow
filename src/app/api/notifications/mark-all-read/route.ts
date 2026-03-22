import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspace } from "@/lib/api-helpers";

export async function POST() {
  const { userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  await prisma.notification.updateMany({
    where: { userId, workspaceId: workspace.id, read: false },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
