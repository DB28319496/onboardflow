"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, Plus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Reminder = {
  id: string;
  title: string;
  dueAt: string;
  completed: boolean;
};

export function ClientReminders({ clientId }: { clientId: string }) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch(`/api/reminders?filter=all`)
      .then((r) => r.json())
      .then((data) => {
        const filtered = (Array.isArray(data) ? data : []).filter(
          (r: { clientId?: string }) => r.clientId === clientId
        );
        setReminders(filtered);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clientId]);

  async function handleCreate() {
    if (!title.trim() || !dueAt) return;
    setCreating(true);
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          dueAt: new Date(dueAt).toISOString(),
          clientId,
        }),
      });
      if (res.ok) {
        const reminder = await res.json();
        setReminders((prev) => [...prev, reminder].sort((a, b) => a.dueAt.localeCompare(b.dueAt)));
        setTitle("");
        setDueAt("");
        setShowForm(false);
        toast.success("Reminder set");
      }
    } finally {
      setCreating(false);
    }
  }

  async function toggleComplete(id: string, completed: boolean) {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, completed } : r))
    );
    await fetch(`/api/reminders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
  }

  async function deleteReminder(id: string) {
    await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }

  if (loading) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Bell className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Reminders
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="h-5 w-5 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"
        >
          <Plus className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>

      {showForm && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Follow up about..."
              className="h-7 text-xs"
            />
          </div>
          <Input
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="h-7 text-xs w-36"
          />
          <Button size="sm" className="h-7 text-xs" onClick={handleCreate} disabled={creating || !title.trim() || !dueAt}>
            {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : "Set"}
          </Button>
        </div>
      )}

      {reminders.length > 0 && (
        <div className="space-y-1">
          {reminders.map((r) => {
            const isPast = new Date(r.dueAt) < new Date() && !r.completed;
            return (
              <div key={r.id} className="flex items-center gap-2 group">
                <Checkbox
                  checked={r.completed}
                  onCheckedChange={(v) => toggleComplete(r.id, !!v)}
                  className="h-3.5 w-3.5"
                />
                <span className={`text-xs flex-1 ${r.completed ? "line-through text-muted-foreground" : isPast ? "text-red-600" : ""}`}>
                  {r.title}
                </span>
                <span className={`text-[10px] ${isPast ? "text-red-500" : "text-muted-foreground/60"}`}>
                  {formatDistanceToNow(new Date(r.dueAt), { addSuffix: true })}
                </span>
                <button
                  onClick={() => deleteReminder(r.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
