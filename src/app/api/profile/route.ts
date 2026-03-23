import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-helpers";
import { hash, compare } from "bcryptjs";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "Password must be at least 8 characters").optional(),
});

export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const { userId, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { name, currentPassword, newPassword } = parsed.data;

  // Password change requires current password
  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password is required" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash) {
      return NextResponse.json({ error: "Cannot change password for OAuth accounts" }, { status: 400 });
    }
    const valid = await compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }
  }

  const data: Record<string, unknown> = {};
  if (name) data.name = name;
  if (newPassword) data.passwordHash = await hash(newPassword, 12);

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, email: true, image: true, emailVerified: true, createdAt: true },
  });

  return NextResponse.json(updated);
}
