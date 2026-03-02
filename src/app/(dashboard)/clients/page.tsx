import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function ClientsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const member = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    select: { workspaceId: true },
  });
  if (!member) redirect("/login");

  const [allClients, statusGroups] = await Promise.all([
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
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left font-medium text-muted-foreground px-4 py-3">
                  Client
                </th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">
                  Project
                </th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">
                  Pipeline · Stage
                </th>
                <th className="text-right font-medium text-muted-foreground px-4 py-3">
                  Value
                </th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {allClients.map((client) => {
                const days = Math.floor(
                  (Date.now() - new Date(client.stageEnteredAt).getTime()) / 86_400_000
                );
                return (
                  <tr
                    key={client.id}
                    className="hover:bg-muted/20 transition-colors cursor-pointer group relative"
                  >
                    <td className="px-4 py-3">
                      <Link href={`/clients/${client.id}`} className="block">
                        <p className="font-medium leading-snug group-hover:text-primary transition-colors">
                          {client.name}
                        </p>
                        {client.email && (
                          <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {client.email}
                          </p>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-muted-foreground truncate max-w-[160px]">
                        {client.projectType ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {client.currentStage ? (
                        <div className="flex items-center gap-1.5">
                          <div
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ background: client.currentStage.color }}
                          />
                          <span className="text-muted-foreground truncate max-w-[160px]">
                            {client.pipeline?.name} · {client.currentStage.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {client.projectValue ? formatCurrency(client.projectValue) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={client.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    ACTIVE: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    LOST: "bg-red-100 text-red-600",
    ON_HOLD: "bg-amber-100 text-amber-700",
    ARCHIVED: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        variants[status] ?? "bg-muted text-muted-foreground"
      )}
    >
      {status.charAt(0) + status.slice(1).toLowerCase().replace("_", " ")}
    </span>
  );
}
