import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspace } from "@/lib/api-helpers";

type Params = { params: Promise<{ clientId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { clientId } = await params;
  const { userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const existing = await prisma.client.findFirst({
    where: { id: clientId, workspaceId: workspace.id },
    select: { id: true, portalToken: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const reset = body?.reset === true;

  // Only generate a new token if one doesn't exist yet, or if reset was requested
  const token =
    existing.portalToken && !reset
      ? existing.portalToken
      : crypto.randomUUID().replace(/-/g, "");

  const updated = await prisma.client.update({
    where: { id: clientId },
    data: { portalToken: token },
    select: { portalToken: true },
  });

  return NextResponse.json({ portalToken: updated.portalToken });
}
