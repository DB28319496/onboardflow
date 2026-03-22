import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspace } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ clients: [], pipelines: [], templates: [] });
  }

  const [clients, pipelines, templates] = await Promise.all([
    prisma.client.findMany({
      where: {
        workspaceId: workspace.id,
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
          { companyName: { contains: q } },
        ],
      },
      select: { id: true, name: true, email: true, companyName: true, status: true },
      take: 5,
    }),
    prisma.pipeline.findMany({
      where: { workspaceId: workspace.id, name: { contains: q } },
      select: { id: true, name: true },
      take: 5,
    }),
    prisma.emailTemplate.findMany({
      where: { workspaceId: workspace.id, name: { contains: q } },
      select: { id: true, name: true },
      take: 5,
    }),
  ]);

  return NextResponse.json({ clients, pipelines, templates });
}
