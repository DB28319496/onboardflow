import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { z } from "zod";

type Params = { params: Promise<{ token: string }> };

const messageSchema = z.object({
  content: z.string().min(1, "Message is required").max(2000),
  senderName: z.string().min(1).max(100),
});

export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;

  const client = await prisma.client.findUnique({
    where: { portalToken: token },
    select: { id: true, workspaceId: true, workspace: { select: { portalEnabled: true } } },
  });
  if (!client || !client.workspace.portalEnabled) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const messages = await prisma.portalMessage.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest, { params }: Params) {
  // Rate limit: 20 messages per minute per IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { success, resetAt } = rateLimit({ key: `portal-msg:${ip}`, limit: 20, windowMs: 60_000 });
  if (!success) return rateLimitResponse(resetAt);

  const { token } = await params;

  const client = await prisma.client.findUnique({
    where: { portalToken: token },
    select: { id: true, workspaceId: true, workspace: { select: { portalEnabled: true } } },
  });
  if (!client || !client.workspace.portalEnabled) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const message = await prisma.portalMessage.create({
    data: {
      content: parsed.data.content,
      senderType: "CLIENT",
      senderName: parsed.data.senderName,
      clientId: client.id,
      workspaceId: client.workspaceId,
    },
  });

  return NextResponse.json(message, { status: 201 });
}
