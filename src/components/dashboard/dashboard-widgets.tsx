"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, Bell, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

type Reminder = {
  id: string;
  title: string;
  dueAt: string;
  completed: boolean;
  client: { id: string; name: string } | null;
};

type OverdueClient = {
  id: string;
  name: string;
  daysOverdue: number;
  stageName: string;
  stageColor: string;
};

export function DashboardWidgets({
  overdueClients,
}: {
  overdueClients: OverdueClient[];
}) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loadingReminders, setLoadingReminders] = useState(true);

  useEffect(() => {
    fetch("/api/reminders?filter=upcoming")
      .then((r) => r.json())
      .then((data) => setReminders(Array.isArray(data) ? data.slice(0, 5) : []))
      .catch(() => {})
      .finally(() => setLoadingReminders(false));
  }, []);

  async function toggleReminder(id: string, completed: boolean) {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed } : r))
    );
    await fetch(`/api/reminders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    }).catch(() => {});
  }

  return (
    <div className="space-y-4">
      {/* Overdue Clients Widget */}
      {overdueClients.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50/50">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-red-200/60">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            <span className="text-xs font-semibold text-red-700">
              Overdue ({overdueClients.length})
            </span>
          </div>
          <div className="divide-y divide-red-100">
            {overdueClients.slice(0, 5).map((c) => (
              <Link
                key={c.id}
                href={`/clients/${c.id}`}
                className="flex items-center gap-2 px-3 py-2 hover:bg-red-50 transition-colors"
              >
                <div
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ background: c.stageColor }}
                />
                <span className="text-xs font-medium flex-1 truncate">{c.name}</span>
                <span className="text-[10px] text-red-600 font-medium">
                  {c.daysOverdue}d late
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Reminders Widget */}
      <div className="rounded-xl border border-border/60">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50">
          <Bell className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold">Reminders</span>
        </div>
        {loadingReminders ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          </div>
        ) : reminders.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <p className="text-xs text-muted-foreground">No upcoming reminders</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {reminders.map((r) => {
              const isPast = new Date(r.dueAt) < new Date();
              return (
                <div key={r.id} className="flex items-center gap-2 px-3 py-2">
                  <Checkbox
                    checked={r.completed}
                    onCheckedChange={(v) => toggleReminder(r.id, !!v)}
                    className="h-3.5 w-3.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs truncate ${r.completed ? "line-through text-muted-foreground" : ""}`}>
                      {r.title}
                    </p>
                    {r.client && (
                      <Link href={`/clients/${r.client.id}`} className="text-[10px] text-primary hover:underline">
                        {r.client.name}
                      </Link>
                    )}
                  </div>
                  <span className={`text-[10px] shrink-0 ${isPast ? "text-red-500" : "text-muted-foreground/60"}`}>
                    {formatDistanceToNow(new Date(r.dueAt), { addSuffix: true })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
