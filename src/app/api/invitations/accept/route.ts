import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { notifyAdmins } from "@/lib/notifications";

const schema = z.object({
  token: z.string().min(1),
  name: z.string().min(1, "Name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { token, name, password } = parsed.data;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { workspace: { select: { id: true, name: true } } },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invalid invitation link." }, { status: 404 });
  }
  if (invitation.acceptedAt) {
    return NextResponse.json({ error: "This invitation has already been used." }, { status: 409 });
  }
  if (invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: "This invitation has expired." }, { status: 410 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Upsert user (may already exist) then add to workspace
  const user = await prisma.user.upsert({
    where: { email: invitation.email },
    update: {},
    create: {
      email: invitation.email,
      name,
      passwordHash,
    },
  });

  // Add to workspace if not already a member
  await prisma.workspaceMember.upsert({
    where: { userId_workspaceId: { userId: user.id, workspaceId: invitation.workspaceId } },
    update: { role: invitation.role },
    create: { userId: user.id, workspaceId: invitation.workspaceId, role: invitation.role },
  });

  // Mark invitation as accepted
  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { acceptedAt: new Date() },
  });

  // Notify admins that someone joined (non-blocking)
  notifyAdmins(invitation.workspaceId, {
    type: "TEAM_INVITE",
    title: `${name} joined the workspace`,
    message: invitation.email,
    link: "/settings",
  }).catch(console.error);

  return NextResponse.json({ success: true, email: invitation.email });
}
