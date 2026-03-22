import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-helpers";

type Params = { params: Promise<{ reminderId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { reminderId } = await params;
  const { userId, error } = await requireAuth();
  if (error) return error;

  const existing = await prisma.reminder.findFirst({
    where: { id: reminderId, userId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const reminder = await prisma.reminder.update({
    where: { id: reminderId },
    data: {
      ...(body.completed !== undefined
        ? { completed: body.completed, completedAt: body.completed ? new Date() : null }
        : {}),
      ...(body.title ? { title: body.title } : {}),
      ...(body.dueAt ? { dueAt: new Date(body.dueAt) } : {}),
    },
  });

  return NextResponse.json(reminder);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { reminderId } = await params;
  const { userId, error } = await requireAuth();
  if (error) return error;

  const existing = await prisma.reminder.findFirst({
    where: { id: reminderId, userId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.reminder.delete({ where: { id: reminderId } });
  return NextResponse.json({ ok: true });
}
