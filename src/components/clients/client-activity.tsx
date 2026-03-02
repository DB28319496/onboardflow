"use client";

import { useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  Mail,
  Clock,
  Loader2,
  StickyNote,
  UserPlus,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

type ActivityUser = { id: string; name: string | null; image: string | null } | null;

type Activity = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: string;
  user: ActivityUser;
};

function ActivityIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    CLIENT_CREATED: <UserPlus className="h-3.5 w-3.5 text-emerald-500" />,
    STAGE_CHANGE: <ArrowRight className="h-3.5 w-3.5 text-blue-500" />,
    NOTE_ADDED: <MessageSquare className="h-3.5 w-3.5 text-amber-500" />,
    EMAIL_SENT: <Mail className="h-3.5 w-3.5 text-purple-500" />,
    STATUS_CHANGE: <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" />,
  };
  return (
    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted shrink-0">
      {icons[type] ?? <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
    </div>
  );
}

export function ClientActivity({
  clientId,
  initialActivities,
}: {
  clientId: string;
  initialActivities: Activity[];
}) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAddNote = useCallback(async () => {
    if (!note.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: note.trim() }),
      });
      if (res.ok) {
        const activity = await res.json();
        setActivities((prev) => [
          {
            ...activity,
            createdAt: activity.createdAt ?? new Date().toISOString(),
          },
          ...prev,
        ]);
        setNote("");
      }
    } finally {
      setSaving(false);
    }
  }, [clientId, note]);

  return (
    <div className="space-y-4">
      {/* Add note */}
      <div>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note…"
          rows={3}
          className="text-sm resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddNote();
          }}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-muted-foreground/60">⌘↵ to submit</span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddNote}
            disabled={!note.trim() || saving}
            className="h-7 text-xs"
          >
            {saving ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <StickyNote className="h-3 w-3 mr-1" />
            )}
            Add Note
          </Button>
        </div>
      </div>

      <Separator />

      {/* Timeline */}
      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No activity yet.</p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <ActivityIcon type={activity.type} />
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm leading-snug">{activity.title}</p>
                {activity.description && (
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                    {activity.description}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground/60 mt-1">
                  {formatRelativeTime(activity.createdAt)}
                  {activity.user?.name && (
                    <span className="ml-1">· {activity.user.name}</span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
