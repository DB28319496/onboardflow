"use client";

import { useState, useEffect, useCallback } from "react";
import { Mail, Plus, Pencil, Trash2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TemplateDialog, type TemplateRow } from "@/components/email-templates/template-dialog";

const TYPE_COLORS: Record<string, string> = {
  WELCOME: "bg-emerald-100 text-emerald-700",
  STAGE_CHANGE: "bg-blue-100 text-blue-700",
  FOLLOW_UP: "bg-amber-100 text-amber-700",
  REMINDER: "bg-orange-100 text-orange-700",
  CUSTOM: "bg-muted text-muted-foreground",
};

function typeLabel(type: string) {
  return type.charAt(0) + type.slice(1).toLowerCase().replace("_", " ");
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TemplateRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/email-templates");
      if (res.ok) setTemplates(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleSaved(saved: TemplateRow) {
    setTemplates((prev) => {
      const idx = prev.findIndex((t) => t.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
  }

  async function handleDelete(template: TemplateRow) {
    if (!confirm(`Delete "${template.name}"? This cannot be undone.`)) return;
    setDeletingId(template.id);
    try {
      const res = await fetch(`/api/email-templates/${template.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setTemplates((prev) => prev.filter((t) => t.id !== template.id));
      toast.success("Template deleted");
    } catch {
      toast.error("Failed to delete template");
    } finally {
      setDeletingId(null);
    }
  }

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(t: TemplateRow) {
    setEditing(t);
    setDialogOpen(true);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Email Templates</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Reusable email templates with dynamic merge fields.
            </p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            New Template
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading templates…
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Mail className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No email templates yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Create a template to start sending automated emails.
            </p>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              New Template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="group rounded-xl border border-border/60 bg-background p-4 hover:border-border hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 shrink-0">
                    <Mail className="h-4.5 w-4.5 text-blue-600" />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => openEdit(template)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(template)}
                      disabled={deletingId === template.id}
                    >
                      {deletingId === template.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <p className="font-semibold text-sm leading-snug line-clamp-1">
                    {template.name}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {template.subject}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium",
                      TYPE_COLORS[template.type] ?? TYPE_COLORS.CUSTOM
                    )}
                  >
                    {typeLabel(template.type)}
                  </span>

                  {template._count.emailLogs > 0 && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Send className="h-3 w-3" />
                      {template._count.emailLogs} sent
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TemplateDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        template={editing}
        onSaved={handleSaved}
      />
    </div>
  );
}
