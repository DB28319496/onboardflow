import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AnalyticsClient } from "@/components/analytics/analytics-client";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  });
  if (!member) redirect("/login");

  const wid = member.workspaceId;

  const [clients, stages, emailCount, teamMembers] = await Promise.all([
    prisma.client.findMany({
      where: { workspaceId: wid },
      select: {
        id: true,
        status: true,
        projectValue: true,
        currentStageId: true,
        stageEnteredAt: true,
        createdAt: true,
        assignedToId: true,
      },
    }),
    prisma.stage.findMany({
      where: { pipeline: { workspaceId: wid } },
      include: { pipeline: { select: { id: true, name: true } } },
      orderBy: [{ pipeline: { createdAt: "asc" } }, { order: "asc" }],
    }),
    // Use workspaceId directly (avoids JOIN through nullable clientId relation)
    prisma.emailLog.count({
      where: {
        OR: [
          { workspaceId: wid },
          { client: { workspaceId: wid } },
        ],
      },
    }),
    prisma.workspaceMember.findMany({
      where: { workspaceId: wid },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  const now = Date.now();

  const active = clients.filter((c) => c.status === "ACTIVE");
  const completed = clients.filter((c) => c.status === "COMPLETED").length;
  const lost = clients.filter((c) => c.status === "LOST").length;
  const winRate =
    completed + lost > 0 ? Math.round((completed / (completed + lost)) * 100) : null;
  const pipelineValue = active.reduce((sum, c) => sum + (c.projectValue ?? 0), 0);

  const stageStats = stages.map((s) => {
    const inStage = clients.filter(
      (c) => c.currentStageId === s.id && c.status === "ACTIVE"
    );
    const overdue =
      s.daysExpected != null
        ? inStage.filter(
            (c) =>
              (now - new Date(c.stageEnteredAt).getTime()) / 86_400_000 >
              s.daysExpected!
          ).length
        : 0;
    const avgDays =
      inStage.length > 0
        ? Math.round(
            inStage.reduce(
              (sum, c) =>
                sum + (now - new Date(c.stageEnteredAt).getTime()) / 86_400_000,
              0
            ) / inStage.length
          )
        : 0;
    const totalValue = inStage.reduce((sum, c) => sum + (c.projectValue ?? 0), 0);
    return {
      id: s.id,
      name: s.name,
      shortName: s.name.length > 14 ? s.name.slice(0, 13) + "…" : s.name,
      color: s.color,
      pipelineName: s.pipeline.name,
      clientCount: inStage.length,
      totalValue,
      overdueCount: overdue,
      avgDays,
      daysExpected: s.daysExpected,
    };
  });

  const monthlyIntake: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const y = d.getFullYear();
    const m = d.getMonth();
    const count = clients.filter((c) => {
      const cd = new Date(c.createdAt);
      return cd.getFullYear() === y && cd.getMonth() === m;
    }).length;
    monthlyIntake.push({ month: d.toLocaleString("default", { month: "short" }), count });
  }

  const statusMap: Record<string, { count: number; value: number }> = {};
  for (const c of clients) {
    if (!statusMap[c.status]) statusMap[c.status] = { count: 0, value: 0 };
    statusMap[c.status].count++;
    statusMap[c.status].value += c.projectValue ?? 0;
  }
  const statusBreakdown = Object.entries(statusMap).map(([status, data]) => ({
    status,
    label: status.charAt(0) + status.slice(1).toLowerCase().replace("_", " "),
    count: data.count,
    value: data.value,
  }));

  // Conversion funnel: clients per stage in pipeline order
  const funnelData = stages
    .filter((s) => {
      const total = clients.filter((c) => c.currentStageId === s.id).length;
      return total > 0;
    })
    .map((s) => ({
      name: s.name.length > 16 ? s.name.slice(0, 15) + "…" : s.name,
      fullName: s.name,
      count: clients.filter((c) => c.currentStageId === s.id).length,
      color: s.color,
    }));

  // Team metrics
  const teamMetrics = teamMembers.map((m) => {
    const assigned = clients.filter((c) => c.assignedToId === m.user.id);
    const activeCount = assigned.filter((c) => c.status === "ACTIVE").length;
    const completedCount = assigned.filter((c) => c.status === "COMPLETED").length;
    const lostCount = assigned.filter((c) => c.status === "LOST").length;
    const totalValue = assigned
      .filter((c) => c.status === "ACTIVE")
      .reduce((sum, c) => sum + (c.projectValue ?? 0), 0);
    return {
      name: m.user.name ?? m.user.email,
      role: m.role,
      active: activeCount,
      completed: completedCount,
      lost: lostCount,
      total: assigned.length,
      value: totalValue,
      winRate: completedCount + lostCount > 0
        ? Math.round((completedCount / (completedCount + lostCount)) * 100)
        : null,
    };
  }).filter((m) => m.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <AnalyticsClient
      summary={{
        totalClients: clients.length,
        activeClients: active.length,
        pipelineValue,
        winRate,
        emailsSent: emailCount,
        completedClients: completed,
      }}
      stageStats={stageStats}
      monthlyIntake={monthlyIntake}
      statusBreakdown={statusBreakdown}
      funnelData={funnelData}
      teamMetrics={teamMetrics}
    />
  );
}
