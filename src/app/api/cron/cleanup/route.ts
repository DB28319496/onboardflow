import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Audit log and data retention cleanup.
 *
 * Retention policy (SOC 2 compliant):
 * - Audit logs: retained for 1 year, then deleted
 * - Activities: retained for 1 year, then deleted
 * - Email logs: retained for 1 year, then deleted
 * - Notifications: read notifications deleted after 90 days
 * - Verification tokens: expired tokens deleted immediately
 * - Password reset tokens: used/expired tokens deleted after 7 days
 *
 * Run weekly via Netlify scheduled function.
 */

const AUDIT_RETENTION_DAYS = 365; // 1 year — SOC 2 minimum
const ACTIVITY_RETENTION_DAYS = 365;
const EMAIL_LOG_RETENTION_DAYS = 365;
const NOTIFICATION_RETENTION_DAYS = 90;
const TOKEN_CLEANUP_DAYS = 7;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results: Record<string, number> = {};

  // 1. Audit logs older than retention period
  const auditCutoff = new Date(now.getTime() - AUDIT_RETENTION_DAYS * 86_400_000);
  const auditResult = await prisma.auditLog.deleteMany({
    where: { createdAt: { lt: auditCutoff } },
  });
  results.auditLogsDeleted = auditResult.count;

  // 2. Activities older than retention period
  const activityCutoff = new Date(now.getTime() - ACTIVITY_RETENTION_DAYS * 86_400_000);
  const activityResult = await prisma.activity.deleteMany({
    where: { createdAt: { lt: activityCutoff } },
  });
  results.activitiesDeleted = activityResult.count;

  // 3. Email logs older than retention period
  const emailCutoff = new Date(now.getTime() - EMAIL_LOG_RETENTION_DAYS * 86_400_000);
  const emailResult = await prisma.emailLog.deleteMany({
    where: { sentAt: { lt: emailCutoff } },
  });
  results.emailLogsDeleted = emailResult.count;

  // 4. Read notifications older than 90 days
  const notifCutoff = new Date(now.getTime() - NOTIFICATION_RETENTION_DAYS * 86_400_000);
  const notifResult = await prisma.notification.deleteMany({
    where: { read: true, createdAt: { lt: notifCutoff } },
  });
  results.notificationsDeleted = notifResult.count;

  // 5. Expired verification tokens
  const verifyResult = await prisma.verificationToken.deleteMany({
    where: { expires: { lt: now } },
  });
  results.verificationTokensDeleted = verifyResult.count;

  // 6. Used/expired password reset tokens older than 7 days
  const tokenCutoff = new Date(now.getTime() - TOKEN_CLEANUP_DAYS * 86_400_000);
  const resetResult = await prisma.passwordResetToken.deleteMany({
    where: {
      OR: [
        { usedAt: { not: null }, createdAt: { lt: tokenCutoff } },
        { expiresAt: { lt: tokenCutoff } },
      ],
    },
  });
  results.resetTokensDeleted = resetResult.count;

  console.log("[cron] cleanup results:", results);
  return NextResponse.json({ ok: true, ...results });
}
