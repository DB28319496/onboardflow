import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find reminders that are due and not completed
  const dueReminders = await prisma.reminder.findMany({
    where: {
      completed: false,
      dueAt: { lte: new Date() },
    },
    include: {
      client: { select: { name: true, workspaceId: true } },
    },
  });

  let notified = 0;

  for (const reminder of dueReminders) {
    // Create notification for the reminder owner
    await createNotification({
      userId: reminder.userId,
      workspaceId: reminder.client.workspaceId,
      title: `Reminder: ${reminder.title}`,
      message: `Due for ${reminder.client.name}`,
      type: "REMINDER_DUE",
      link: `/clients/${reminder.clientId}`,
    });
    notified++;
  }

  console.log(`[cron] checked reminders: ${dueReminders.length} due, ${notified} notified`);
  return NextResponse.json({ ok: true, due: dueReminders.length, notified });
}
