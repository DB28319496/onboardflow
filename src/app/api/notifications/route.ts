import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspace } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 50);
  const cursor = url.searchParams.get("cursor") ?? undefined;

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId, workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    }),
    prisma.notification.count({
      where: { userId, workspaceId: workspace.id, read: false },
    }),
  ]);

  return NextResponse.json({
    notifications,
    unreadCount,
    nextCursor: notifications.length === limit ? notifications[notifications.length - 1]?.id : null,
  });
}
