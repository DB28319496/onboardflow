"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
};

export function PortalChecklist({
  items: initialItems,
  stageName,
  stageId,
  token,
  brandColor,
}: {
  items: ChecklistItem[];
  stageName: string;
  stageId: string;
  token: string;
  brandColor: string;
}) {
  const [items, setItems] = useState(initialItems);
  const doneCount = items.filter((i) => i.completed).length;

  async function toggleItem(itemId: string, completed: boolean) {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, completed } : i))
    );

    fetch(`/api/portal/${token}/checklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checklistItemId: itemId,
        stageId,
        completed,
      }),
    }).catch(() => {
      // Revert on failure
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, completed: !completed } : i))
      );
    });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-700">
          {stageName} — Checklist
        </p>
        <span className="text-xs text-gray-500">
          {doneCount}/{items.length} complete
        </span>
      </div>

      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            doneCount === items.length ? "bg-emerald-500" : ""
          )}
          style={{
            width: `${Math.round((doneCount / items.length) * 100)}%`,
            background: doneCount === items.length ? undefined : brandColor,
          }}
        />
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => toggleItem(item.id, !item.completed)}
            className="w-full flex items-start gap-2.5 text-left hover:bg-gray-50 rounded-md px-1 py-0.5 transition-colors"
          >
            <div
              className={cn(
                "mt-0.5 h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                item.completed
                  ? "border-emerald-500 bg-emerald-500"
                  : "border-gray-300 hover:border-gray-400"
              )}
            >
              {item.completed && (
                <Check className="h-2.5 w-2.5 text-white stroke-[3]" />
              )}
            </div>
            <span
              className={cn(
                "text-sm leading-snug transition-colors",
                item.completed ? "text-gray-400 line-through" : "text-gray-700"
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
