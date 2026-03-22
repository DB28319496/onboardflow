import { prisma } from "@/lib/prisma";

type CreateNotificationParams = {
  type: string;
  title: string;
  message?: string;
  link?: string;
  userId: string;
  workspaceId: string;
};

export async function createNotification(params: CreateNotificationParams) {
  return prisma.notification.create({ data: params });
}

export async function notifyWorkspaceMembers(
  workspaceId: string,
  excludeUserId: string | undefined,
  data: Omit<CreateNotificationParams, "userId" | "workspaceId">
) {
  const members = await prisma.workspaceMember.findMany({
    where: {
      workspaceId,
      ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
    },
    select: { userId: true },
  });
  if (members.length === 0) return;
  await prisma.notification.createMany({
    data: members.map((m) => ({ ...data, userId: m.userId, workspaceId })),
  });
}

export async function notifyAdmins(
  workspaceId: string,
  data: Omit<CreateNotificationParams, "userId" | "workspaceId">
) {
  const admins = await prisma.workspaceMember.findMany({
    where: { workspaceId, role: { in: ["OWNER", "ADMIN"] } },
    select: { userId: true },
  });
  if (admins.length === 0) return;
  await prisma.notification.createMany({
    data: admins.map((m) => ({ ...data, userId: m.userId, workspaceId })),
  });
}
