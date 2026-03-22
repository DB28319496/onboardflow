"use client";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { AlertTriangle, Clock, Calendar } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type TimelineClient = {
  id: string;
  name: string;
  stageName: string;
  stageColor: string;
  pipelineName: string;
  assignedTo: string | null;
  stageEnteredAt: string;
  expectedEndDate: string | null;
  daysInStage: number;
  daysExpected: number | null;
  isOverdue: boolean;
  projectValue: number | null;
};

type SortKey = "deadline" | "days" | "name";

export function TimelineView({ clients }: { clients: TimelineClient[] }) {
  const [sortBy, setSortBy] = useState<SortKey>("deadline");

  const sorted = [...clients].sort((a, b) => {
    if (sortBy === "deadline") {
      // Overdue first, then by remaining days
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      const aRemaining = (a.daysExpected ?? 999) - a.daysInStage;
      const bRemaining = (b.daysExpected ?? 999) - b.daysInStage;
      return aRemaining - bRemaining;
    }
    if (sortBy === "days") return b.daysInStage - a.daysInStage;
    return a.name.localeCompare(b.name);
  });

  const overdueCount = clients.filter((c) => c.isOverdue).length;
  const dueSoonCount = clients.filter(
    (c) => !c.isOverdue && c.daysExpected && c.daysExpected - c.daysInStage <= 2
  ).length;

  if (clients.length === 0) {
    return (
      <div className="text-center py-16">
        <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No active clients</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {clients.length} active clients
        </span>
        {overdueCount > 0 && (
          <span className="flex items-center gap-1 text-sm text-red-600 font-medium">
            <AlertTriangle className="h-3.5 w-3.5" />
            {overdueCount} overdue
          </span>
        )}
        {dueSoonCount > 0 && (
          <span className="flex items-center gap-1 text-sm text-amber-600 font-medium">
            <Clock className="h-3.5 w-3.5" />
            {dueSoonCount} due soon
          </span>
        )}
        <div className="ml-auto flex gap-1">
          {(["deadline", "days", "name"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs transition-colors",
                sortBy === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted"
              )}
            >
              {key === "deadline" ? "Deadline" : key === "days" ? "Days in Stage" : "Name"}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline rows */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="divide-y divide-border/50">
          {sorted.map((client) => {
            const remaining = client.daysExpected
              ? client.daysExpected - client.daysInStage
              : null;
            const progress = client.daysExpected
              ? Math.min((client.daysInStage / client.daysExpected) * 100, 100)
              : 0;

            return (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors"
              >
                {/* Stage color + name */}
                <div className="w-44 shrink-0 min-w-0">
                  <p className="text-sm font-medium truncate">{client.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ background: client.stageColor }}
                    />
                    <span className="text-xs text-muted-foreground truncate">
                      {client.stageName}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex-1 min-w-0 hidden sm:block">
                  <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        client.isOverdue
                          ? "bg-red-500"
                          : progress > 80
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      )}
                      style={{ width: `${client.daysExpected ? progress : 0}%` }}
                    />
                  </div>
                </div>

                {/* Days info */}
                <div className="w-24 text-right shrink-0">
                  <p
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      client.isOverdue ? "text-red-600" : ""
                    )}
                  >
                    {client.daysInStage}d
                    {client.daysExpected ? ` / ${client.daysExpected}d` : ""}
                  </p>
                  {remaining !== null && (
                    <p
                      className={cn(
                        "text-xs",
                        client.isOverdue
                          ? "text-red-500"
                          : remaining <= 2
                          ? "text-amber-500"
                          : "text-muted-foreground"
                      )}
                    >
                      {client.isOverdue
                        ? `${Math.abs(remaining)}d overdue`
                        : `${remaining}d remaining`}
                    </p>
                  )}
                </div>

                {/* Assigned */}
                <div className="w-20 text-right shrink-0 hidden md:block">
                  <p className="text-xs text-muted-foreground truncate">
                    {client.assignedTo ?? "—"}
                  </p>
                </div>

                {/* Value */}
                <div className="w-20 text-right shrink-0 hidden lg:block">
                  <p className="text-xs font-medium">
                    {client.projectValue ? formatCurrency(client.projectValue) : "—"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
