import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session, userId: session.user.id as string, error: null };
}

export async function requireWorkspace(userId: string, workspaceId?: string) {
  if (workspaceId) {
    const member = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
      include: { workspace: true },
    });
    if (!member) {
      return {
        workspace: null,
        member: null,
        error: NextResponse.json(
          { error: "Workspace not found or access denied" },
          { status: 403 }
        ),
      };
    }
    return { workspace: member.workspace, member, error: null };
  }

  const member = await prisma.workspaceMember.findFirst({
    where: { userId },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });

  if (!member) {
    return {
      workspace: null,
      member: null,
      error: NextResponse.json({ error: "No workspace found" }, { status: 404 }),
    };
  }

  return { workspace: member.workspace, member, error: null };
}
