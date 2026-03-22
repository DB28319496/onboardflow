import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { Users, DollarSign, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { ClientsTable } from "@/components/clients/clients-table";

export default async function ClientsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  });
  if (!member) redirect("/login");

  const [allClients, statusGroups, stages] = await Promise.all([
    prisma.client.findMany({
      where: { workspaceId: member.workspaceId },
      include: {
        currentStage: { select: { name: true, color: true } },
        pipeline: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.groupBy({
      by: ["status"],
      where: { workspaceId: member.workspaceId },
      _count: true,
    }),
    prisma.stage.findMany({
      where: { pipeline: { workspaceId: member.workspaceId } },
      select: { id: true, name: true },
      orderBy: { order: "asc" },
    }),
  ]);

  const counts = Object.fromEntries(statusGroups.map((g) => [g.status, g._count]));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All clients across your pipelines.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-muted/40 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
          <p className="text-2xl font-bold">{allClients.length}</p>
        </div>
        <div className="bg-muted/40 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs text-muted-foreground">Active</span>
          </div>
          <p className="text-2xl font-bold">{counts["ACTIVE"] ?? 0}</p>
        </div>
        <div className="bg-muted/40 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Completed</span>
          </div>
          <p className="text-2xl font-bold">{counts["COMPLETED"] ?? 0}</p>
        </div>
        <div className="bg-muted/40 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total Value</span>
          </div>
          <p className="text-2xl font-bold">
            {formatCurrency(
              allClients.reduce((sum, c) => sum + (c.projectValue ?? 0), 0)
            )}
          </p>
        </div>
      </div>

      {/* Table */}
      {allClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-16 text-center">
          <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h2 className="font-semibold text-muted-foreground">No clients yet</h2>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Add clients from the{" "}
            <Link href="/dashboard" className="text-primary underline">
              Kanban board
            </Link>
          </p>
        </div>
      ) : (
        <ClientsTable clients={allClients} stages={stages} />
      )}
    </div>
  );
}
