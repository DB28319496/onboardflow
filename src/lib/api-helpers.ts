import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export type Role = "OWNER" | "ADMIN" | "MEMBER";
const ROLE_HIERARCHY: Record<Role, number> = { OWNER: 3, ADMIN: 2, MEMBER: 1 };

export function requireRole(
  member: { role: string },
  minimumRole: Role
): NextResponse | null {
  const memberLevel = ROLE_HIERARCHY[member.role as Role] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[minimumRole];
  if (memberLevel < requiredLevel) {
    return NextResponse.json(
      { error: "You don't have permission to perform this action" },
      { status: 403 }
    );
  }
  return null;
}

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
  // If explicit workspaceId provided, use it
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

  // Try to get active workspace from cookie
  let cookieWsId: string | undefined;
  try {
    const cookieStore = await cookies();
    cookieWsId = cookieStore.get("active_workspace")?.value;
  } catch {
    // cookies() may throw in certain contexts
  }

  if (cookieWsId) {
    const member = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: cookieWsId } },
      include: { workspace: true },
    });
    if (member) {
      return { workspace: member.workspace, member, error: null };
    }
  }

  // Fallback to first workspace
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
