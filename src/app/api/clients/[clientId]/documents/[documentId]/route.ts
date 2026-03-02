import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWorkspace } from "@/lib/api-helpers";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string; documentId: string }> }
) {
  const { userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const { clientId, documentId } = await params;

  const document = await prisma.document.findFirst({
    where: { id: documentId, clientId },
    include: { client: { select: { workspaceId: true } } },
  });

  if (!document || document.client.workspaceId !== workspace.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Extract file key from Uploadthing URL
  // URL format: https://utfs.io/f/[fileKey] or https://[appId].ufs.sh/f/[fileKey]
  const urlParts = document.url.split("/f/");
  if (urlParts.length > 1) {
    const fileKey = urlParts[1].split("?")[0];
    await utapi.deleteFiles([fileKey]).catch(console.error);
  }

  await prisma.document.delete({ where: { id: documentId } });
  return NextResponse.json({ success: true });
}
