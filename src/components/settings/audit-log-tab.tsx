"use client";

import { useState, useEffect } from "react";
import { Loader2, Shield, Settings, Trash2, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

type AuditEntry = {
  id: string;
  action: string;
  description: string;
  metadata: string | null;
  createdAt: string;
  user: { name: string | null; email: string; image: string | null };
};

const ACTION_ICONS: Record<string, typeof Shield> = {
  SETTINGS_UPDATED: Settings,
  CLIENT_DELETED: Trash2,
  PIPELINE_DELETED: Trash2,
  TEMPLATE_DELETED: Trash2,
  AUTOMATION_DELETED: Trash2,
  MEMBER_INVITED: UserPlus,
  MEMBER_JOINED: Users,
};

const ACTION_COLORS: Record<string, string> = {
  SETTINGS_UPDATED: "bg-blue-100 text-blue-700",
  CLIENT_DELETED: "bg-red-100 text-red-600",
  PIPELINE_DELETED: "bg-red-100 text-red-600",
  TEMPLATE_DELETED: "bg-red-100 text-red-600",
  AUTOMATION_DELETED: "bg-red-100 text-red-600",
  MEMBER_INVITED: "bg-emerald-100 text-emerald-700",
  MEMBER_JOINED: "bg-emerald-100 text-emerald-700",
};

export function AuditLogTab() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  async function fetchLogs(cursor?: string) {
    const params = new URLSearchParams({ limit: "30" });
    if (cursor) params.set("cursor", cursor);
    const res = await fetch(`/api/audit-log?${params}`);
    if (!res.ok) return;
    const data = await res.json();
    if (cursor) {
      setLogs((prev) => [...prev, ...data.logs]);
    } else {
      setLogs(data.logs);
    }
    setNextCursor(data.nextCursor);
  }

  useEffect(() => {
    fetchLogs().finally(() => setLoading(false));
  }, []);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    await fetchLogs(nextCursor);
    setLoadingMore(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-16">
        <Shield className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No audit log entries yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Actions like settings changes, deletions, and invitations will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <p className="text-sm font-semibold">Audit Log</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          A record of important actions taken in your workspace.
        </p>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="divide-y divide-border/50">
          {logs.map((log) => {
            const Icon = ACTION_ICONS[log.action] ?? Shield;
            const colorClass = ACTION_COLORS[log.action] ?? "bg-muted text-muted-foreground";
            return (
              <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                <div
                  className={`mt-0.5 h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug">{log.description}</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                    {log.user.name ?? log.user.email} ·{" "}
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {nextCursor && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : null}
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
