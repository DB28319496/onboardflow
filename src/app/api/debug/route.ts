import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspace } from "@/lib/api-helpers";

export async function GET() {
  const results: Record<string, string> = {};

  try {
    const { userId, error } = await requireAuth();
    if (error) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    results.auth = "OK";

    const { workspace, error: wsError } = await requireWorkspace(userId);
    if (wsError) return NextResponse.json({ error: "No workspace", results }, { status: 404 });
    results.workspace = `OK (${workspace.name})`;

    // Test basic client query
    try {
      const count = await prisma.client.count({ where: { workspaceId: workspace.id } });
      results.clients = `OK (${count} clients)`;
    } catch (e) {
      results.clients = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
    }

    // Test client with includes
    try {
      const client = await prisma.client.findFirst({
        where: { workspaceId: workspace.id },
        include: { currentStage: true },
      });
      results.clientWithStage = client ? `OK (${client.name})` : "OK (no clients)";
    } catch (e) {
      results.clientWithStage = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
    }

    // Test activities
    try {
      const count = await prisma.activity.count();
      results.activities = `OK (${count})`;
    } catch (e) {
      results.activities = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
    }

    // Test stageCompletions
    try {
      const count = await prisma.stageCompletion.count();
      results.stageCompletions = `OK (${count})`;
    } catch (e) {
      results.stageCompletions = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
    }

    // Test emailLogs
    try {
      const count = await prisma.emailLog.count();
      results.emailLogs = `OK (${count})`;
    } catch (e) {
      results.emailLogs = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
    }

    // Test customFieldValues
    try {
      const count = await prisma.customFieldValue.count();
      results.customFieldValues = `OK (${count})`;
    } catch (e) {
      results.customFieldValues = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
    }

    // Test tags
    try {
      const count = await prisma.tag.count();
      results.tags = `OK (${count})`;
    } catch (e) {
      results.tags = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
    }

    // Test clientTags
    try {
      const count = await prisma.clientTag.count();
      results.clientTags = `OK (${count})`;
    } catch (e) {
      results.clientTags = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
    }

    // Test full client query (same as slide-over)
    try {
      const client = await prisma.client.findFirst({
        where: { workspaceId: workspace.id },
        include: {
          currentStage: true,
          pipeline: { include: { stages: { orderBy: { order: "asc" } } } },
          assignedTo: { select: { id: true, name: true, image: true } },
          activities: { orderBy: { createdAt: "desc" }, take: 5 },
          stageCompletions: true,
          emailLogs: { orderBy: { sentAt: "desc" }, take: 5 },
          customFieldValues: true,
          tags: { include: { tag: true } },
        },
      });
      results.fullClientQuery = client ? `OK (${client.name})` : "OK (no clients)";
    } catch (e) {
      results.fullClientQuery = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
    }

    // Test user emailVerified field
    try {
      const user = await prisma.user.findFirst({
        select: { id: true, emailVerified: true },
      });
      results.userEmailVerified = `OK (${user?.emailVerified ?? "null"})`;
    } catch (e) {
      results.userEmailVerified = `FAIL: ${e instanceof Error ? e.message : String(e)}`;
    }

    return NextResponse.json(results);
  } catch (e) {
    return NextResponse.json({
      ...results,
      fatal: e instanceof Error ? e.message : String(e),
    }, { status: 500 });
  }
}
