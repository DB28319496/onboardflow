"use client";

import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Phone,
  Mail,
  DollarSign,
  Calendar,
  StickyNote,
  ArrowRight,
  Clock,
  CheckCircle2,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { KanbanClient, KanbanPipeline } from "./kanban-board";

type Activity = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null } | null;
};

type ClientDetail = KanbanClient & {
  activities: Activity[];
  pipeline: KanbanPipeline | null;
};

export function ClientSlideOver({
  clientId,
  pipeline,
  onClose,
  onClientUpdated,
}: {
  clientId: string;
  pipeline: KanbanPipeline;
  onClose: () => void;
  onClientUpdated: (client: KanbanClient) => void;
}) {
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [movingStage, setMovingStage] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/clients/${clientId}`)
      .then((r) => r.json())
      .then((data) => {
        // Convert Date strings
        setClient({
          ...data,
          stageEnteredAt: data.stageEnteredAt ?? new Date().toISOString(),
        });
      })
      .finally(() => setLoading(false));
  }, [clientId]);

  const handleAddNote = useCallback(async () => {
    if (!note.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: note }),
      });
      if (res.ok) {
        const activity = await res.json();
        setClient((prev) =>
          prev
            ? { ...prev, activities: [activity, ...prev.activities] }
            : prev
        );
        setNote("");
      }
    } finally {
      setSavingNote(false);
    }
  }, [clientId, note]);

  const handleMoveStage = useCallback(
    async (stageId: string) => {
      if (!client || stageId === client.currentStageId) return;
      setMovingStage(true);
      try {
        const res = await fetch(`/api/clients/${clientId}/move`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stageId }),
        });
        if (res.ok) {
          const updated = await res.json();
          const newClient = { ...client, ...updated };
          setClient(newClient);
          onClientUpdated(newClient);
        }
      } finally {
        setMovingStage(false);
      }
    },
    [client, clientId, onClientUpdated]
  );

  const days = client
    ? Math.floor((Date.now() - new Date(client.stageEnteredAt).getTime()) / 86_400_000)
    : 0;

  const currentStage = pipeline.stages.find((s) => s.id === client?.currentStageId);

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-[480px] overflow-y-auto p-0">
        {/* Always-present accessible title required by Radix */}
        <SheetHeader className="sr-only">
          <SheetTitle>{client?.name ?? "Client Details"}</SheetTitle>
        </SheetHeader>

        {loading || !client ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div
              className="p-6 pb-4"
              style={{
                borderBottom: `3px solid ${currentStage?.color ?? "#e2e8f0"}`,
              }}
            >
              <div className="mb-3">
                <p className="text-left text-lg font-bold">{client.name}</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {currentStage && (
                  <Badge
                    className="text-white font-medium text-xs"
                    style={{ background: currentStage.color }}
                  >
                    {currentStage.name}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {days}d in stage
                </Badge>
                {currentStage?.daysExpected && days > currentStage.daysExpected && (
                  <Badge variant="destructive" className="text-xs">
                    {days - currentStage.daysExpected}d overdue
                  </Badge>
                )}
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact info */}
              <div className="space-y-2">
                {client.email && (
                  <a
                    href={`mailto:${client.email}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    {client.email}
                  </a>
                )}
                {client.phone && (
                  <a
                    href={`tel:${client.phone}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    {client.phone}
                  </a>
                )}
                {client.projectValue && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-3.5 w-3.5 shrink-0" />
                    {formatCurrency(client.projectValue)}
                    {client.projectType && (
                      <span className="text-foreground/70">· {client.projectType}</span>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Move stage */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Move to Stage
                </p>
                <div className="flex items-center gap-2">
                  <Select
                    value={client.currentStageId ?? ""}
                    onValueChange={handleMoveStage}
                    disabled={movingStage}
                  >
                    <SelectTrigger className="flex-1 h-8 text-sm">
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {pipeline.stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ background: stage.color }}
                            />
                            {stage.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {movingStage && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
              </div>

              <Separator />

              {/* Add note */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Add Note
                </p>
                <Textarea
                  placeholder="Add a note about this client..."
                  className="text-sm resize-none"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddNote();
                  }}
                />
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={handleAddNote}
                  disabled={!note.trim() || savingNote}
                >
                  {savingNote ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <StickyNote className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Save Note
                </Button>
              </div>

              <Separator />

              {/* Activity timeline */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Activity
                </p>
                {client.activities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity yet.</p>
                ) : (
                  <div className="space-y-3">
                    {client.activities.map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  const icon = {
    CLIENT_CREATED: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
    STAGE_CHANGE: <ArrowRight className="h-3.5 w-3.5 text-blue-500" />,
    NOTE_ADDED: <MessageSquare className="h-3.5 w-3.5 text-amber-500" />,
    EMAIL_SENT: <Mail className="h-3.5 w-3.5 text-purple-500" />,
  }[activity.type] ?? <Clock className="h-3.5 w-3.5 text-muted-foreground" />;

  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">{activity.title}</p>
        {activity.description && (
          <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">
            {activity.description}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
          {formatRelativeTime(activity.createdAt)}
          {activity.user?.name && ` · ${activity.user.name}`}
        </p>
      </div>
    </div>
  );
}
