import { prisma } from "@/lib/prisma";

export async function logAudit({
  action,
  description,
  metadata,
  userId,
  workspaceId,
}: {
  action: string;
  description: string;
  metadata?: Record<string, unknown>;
  userId: string;
  workspaceId: string;
}) {
  return prisma.auditLog.create({
    data: {
      action,
      description,
      metadata: metadata ? JSON.stringify(metadata) : null,
      userId,
      workspaceId,
    },
  });
}
