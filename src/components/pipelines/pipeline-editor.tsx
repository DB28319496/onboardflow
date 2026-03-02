"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  GripVertical,
  Trash2,
  Plus,
  Save,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = {
  id: string;
  name: string;
  color: string;
  daysExpected: number | null;
  order: number;
  checklist: string | null;
  _count?: { clientsInStage: number };
};

type Pipeline = {
  id: string;
  name: string;
  isDefault: boolean;
  stages: Stage[];
};

const STAGE_COLORS = [
  "#6366F1", "#8B5CF6", "#3B82F6", "#06B6D4",
  "#10B981", "#F59E0B", "#F97316", "#EF4444",
  "#EC4899", "#14B8A6", "#84CC16", "#A855F7",
];

// ─── Sortable Stage Row ───────────────────────────────────────────────────────

function SortableStageRow({
  stage,
  onUpdate,
  onDelete,
}: {
  stage: Stage;
  onUpdate: (id: string, data: Partial<Stage>) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [checklist, setChecklist] = useState<string[]>(() => {
    try {
      return stage.checklist ? JSON.parse(stage.checklist) : [];
    } catch {
      return [];
    }
  });
  const [newItem, setNewItem] = useState("");

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const addChecklistItem = () => {
    if (!newItem.trim()) return;
    const updated = [...checklist, newItem.trim()];
    setChecklist(updated);
    onUpdate(stage.id, { checklist: JSON.stringify(updated) });
    setNewItem("");
  };

  const removeChecklistItem = (index: number) => {
    const updated = checklist.filter((_, i) => i !== index);
    setChecklist(updated);
    onUpdate(stage.id, { checklist: JSON.stringify(updated) });
  };

  const clientCount = stage._count?.clientsInStage ?? 0;

  return (
    <div ref={setNodeRef} style={style} className={cn("bg-background rounded-xl border border-border overflow-hidden", isDragging && "shadow-lg")}>
      <div className="flex items-center gap-3 p-3">
        {/* Drag handle */}
        <button
          className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing touch-none"
          {...listeners}
          {...attributes}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Color picker */}
        <div className="relative shrink-0">
          <input
            type="color"
            value={stage.color}
            onChange={(e) => onUpdate(stage.id, { color: e.target.value })}
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
          />
          <div
            className="h-5 w-5 rounded-full border-2 border-white shadow-sm cursor-pointer"
            style={{ background: stage.color }}
          />
        </div>

        {/* Name */}
        <Input
          value={stage.name}
          onChange={(e) => onUpdate(stage.id, { name: e.target.value })}
          className="flex-1 h-8 text-sm font-medium border-transparent bg-transparent hover:bg-muted/50 focus:bg-background"
          placeholder="Stage name"
        />

        {/* Days */}
        <div className="flex items-center gap-1 shrink-0">
          <Input
            type="number"
            value={stage.daysExpected ?? ""}
            onChange={(e) =>
              onUpdate(stage.id, {
                daysExpected: e.target.value ? parseInt(e.target.value) : null,
              })
            }
            className="w-16 h-8 text-sm text-center border-transparent bg-transparent hover:bg-muted/50 focus:bg-background"
            placeholder="—"
            min={1}
          />
          <span className="text-xs text-muted-foreground">days</span>
        </div>

        {/* Client count badge */}
        {clientCount > 0 && (
          <Badge variant="secondary" className="text-xs shrink-0">
            {clientCount}
          </Badge>
        )}

        {/* Expand checklist */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(stage.id)}
          className="text-muted-foreground/40 hover:text-destructive transition-colors"
          title={clientCount > 0 ? "Has active clients" : "Delete stage"}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {expanded && (
        <div className="px-11 pb-4 space-y-2 border-t border-border/50 pt-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Checklist Items
          </p>
          {checklist.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <Check className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
              <span className="flex-1">{item}</span>
              <button
                onClick={() => removeChecklistItem(i)}
                className="text-muted-foreground/40 hover:text-destructive transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-2">
            <Input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Add checklist item…"
              className="h-7 text-xs flex-1"
              onKeyDown={(e) => e.key === "Enter" && addChecklistItem()}
            />
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addChecklistItem}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pipeline Editor ──────────────────────────────────────────────────────────

export function PipelineEditor({ pipeline: initialPipeline }: { pipeline: Pipeline }) {
  const [pipeline, setPipeline] = useState(initialPipeline);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const updateStage = useCallback((id: string, data: Partial<Stage>) => {
    setPipeline((prev) => ({
      ...prev,
      stages: prev.stages.map((s) => (s.id === id ? { ...s, ...data } : s)),
    }));
    setDirty(true);
  }, []);

  const deleteStage = useCallback(async (id: string) => {
    const stage = pipeline.stages.find((s) => s.id === id);
    const clientCount = stage?._count?.clientsInStage ?? 0;
    if (clientCount > 0) {
      toast.error(`Cannot delete — ${clientCount} client(s) in this stage`);
      return;
    }
    try {
      const res = await fetch(`/api/pipelines/${pipeline.id}/stages/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPipeline((prev) => ({
          ...prev,
          stages: prev.stages.filter((s) => s.id !== id),
        }));
        toast.success("Stage deleted");
      }
    } catch {
      toast.error("Failed to delete stage");
    }
  }, [pipeline]);

  const addStage = useCallback(async () => {
    const colors = STAGE_COLORS;
    const color = colors[pipeline.stages.length % colors.length];
    try {
      const res = await fetch(`/api/pipelines/${pipeline.id}/stages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Stage", color }),
      });
      if (res.ok) {
        const stage = await res.json();
        setPipeline((prev) => ({ ...prev, stages: [...prev.stages, stage] }));
        toast.success("Stage added");
      }
    } catch {
      toast.error("Failed to add stage");
    }
  }, [pipeline]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setPipeline((prev) => {
        const oldIndex = prev.stages.findIndex((s) => s.id === active.id);
        const newIndex = prev.stages.findIndex((s) => s.id === over.id);
        return { ...prev, stages: arrayMove(prev.stages, oldIndex, newIndex) };
      });
      setDirty(true);
    },
    []
  );

  const saveAll = useCallback(async () => {
    setSaving(true);
    try {
      // Save stage reorder
      await fetch(`/api/pipelines/${pipeline.id}/stages/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageIds: pipeline.stages.map((s) => s.id) }),
      });

      // Save each stage's properties
      await Promise.all(
        pipeline.stages.map((stage) =>
          fetch(`/api/pipelines/${pipeline.id}/stages/${stage.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: stage.name,
              color: stage.color,
              daysExpected: stage.daysExpected,
              checklist: stage.checklist,
            }),
          })
        )
      );

      setDirty(false);
      toast.success("Pipeline saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }, [pipeline]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{pipeline.name}</h2>
          <p className="text-sm text-muted-foreground">
            {pipeline.stages.length} stages · drag to reorder
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>
          )}
          <Button onClick={saveAll} disabled={saving || !dirty} size="sm">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Column labels */}
      <div className="flex items-center gap-3 px-3 text-xs text-muted-foreground font-medium">
        <div className="w-4" />
        <div className="w-5" />
        <div className="flex-1">Stage Name</div>
        <div className="w-[90px] text-center">Duration</div>
        <div className="w-6" />
        <div className="w-6" />
        <div className="w-6" />
      </div>

      {/* Stages */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={pipeline.stages.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {pipeline.stages.map((stage) => (
              <SortableStageRow
                key={stage.id}
                stage={stage}
                onUpdate={updateStage}
                onDelete={deleteStage}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add stage */}
      <button
        onClick={addStage}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 py-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add Stage
      </button>
    </div>
  );
}
