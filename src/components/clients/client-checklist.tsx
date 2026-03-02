"use client";

import { useState, useCallback } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ChecklistItem = {
  id: string; // index-based e.g. "0", "1"
  text: string;
  completed: boolean;
};

type StageCompletion = {
  checklistItemId: string | null;
  stageId: string;
};

export function ClientChecklist({
  clientId,
  stageId,
  stageName,
  checklistJson,
  completions,
}: {
  clientId: string;
  stageId: string;
  stageName: string;
  checklistJson: string | null;
  completions: StageCompletion[];
}) {
  const parsed: unknown[] = (() => {
    try {
      return checklistJson ? JSON.parse(checklistJson) : [];
    } catch {
      return [];
    }
  })();

  const completedIds = new Set(
    completions
      .filter((c) => c.stageId === stageId && c.checklistItemId)
      .map((c) => c.checklistItemId!)
  );

  const [items, setItems] = useState<ChecklistItem[]>(
    parsed.map((raw, i) => {
      const text =
        typeof raw === "string"
          ? raw
          : typeof raw === "object" && raw !== null
          ? String(
              (raw as Record<string, unknown>).title ??
              (raw as Record<string, unknown>).text ??
              (raw as Record<string, unknown>).label ??
              ""
            )
          : String(raw);
      return { id: String(i), text, completed: completedIds.has(String(i)) };
    })
  );

  const handleToggle = useCallback(
    async (item: ChecklistItem) => {
      const newCompleted = !item.completed;

      // Optimistic update
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, completed: newCompleted } : it))
      );

      try {
        const res = await fetch(`/api/clients/${clientId}/checklist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stageId,
            checklistItemId: item.id,
            completed: newCompleted,
          }),
        });
        if (!res.ok) throw new Error("Failed");
      } catch {
        // Revert
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, completed: !newCompleted } : it))
        );
        toast.error("Failed to update checklist");
      }
    },
    [clientId, stageId]
  );

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No checklist defined for this stage.
      </p>
    );
  }

  const doneCount = items.filter((i) => i.completed).length;
  const pct = Math.round((doneCount / items.length) * 100);

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              pct === 100 ? "bg-emerald-500" : "bg-primary"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {doneCount}/{items.length}
        </span>
      </div>

      {/* Items */}
      <div className="space-y-1.5">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => handleToggle(item)}
            className="flex items-start gap-2.5 w-full text-left group"
          >
            <div
              className={cn(
                "mt-0.5 h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                item.completed
                  ? "bg-emerald-500 border-emerald-500"
                  : "border-border group-hover:border-primary/60"
              )}
            >
              {item.completed && <Check className="h-2.5 w-2.5 text-white stroke-[3]" />}
            </div>
            <span
              className={cn(
                "text-sm leading-snug transition-colors",
                item.completed
                  ? "text-muted-foreground line-through"
                  : "text-foreground"
              )}
            >
              {item.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
