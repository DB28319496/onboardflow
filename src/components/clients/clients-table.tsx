"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn, formatCurrency } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRole } from "@/components/dashboard/role-context";
import { exportClientsCsv } from "@/lib/csv";
import { CsvImportDialog } from "./csv-import-dialog";
import {
  Download,
  Upload,
  ArrowRight,
  Trash2,
  UserCheck,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

type ClientRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  projectType: string | null;
  projectValue: number | null;
  status: string;
  stageEnteredAt: Date | string;
  createdAt: Date | string;
  currentStage: { name: string; color: string } | null;
  pipeline: { name: string } | null;
};

type Stage = { id: string; name: string };

const STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "LOST", label: "Lost" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "ARCHIVED", label: "Archived" },
];

export function ClientsTable({
  clients,
  stages,
}: {
  clients: ClientRow[];
  stages: Stage[];
}) {
  const router = useRouter();
  const { canManage } = useRole();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const allSelected = clients.length > 0 && selected.size === clients.length;
  const someSelected = selected.size > 0;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(clients.map((c) => c.id)));
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkAction(action: string, data?: Record<string, unknown>) {
    setLoading(true);
    try {
      const res = await fetch("/api/clients/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, clientIds: Array.from(selected), data }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error ?? "Action failed");
        return;
      }
      toast.success(`${result.affected} client${result.affected !== 1 ? "s" : ""} updated`);
      setSelected(new Set());
      router.refresh();
    } catch {
      toast.error("Action failed");
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    const toExport = someSelected
      ? clients.filter((c) => selected.has(c.id))
      : clients;
    exportClientsCsv(toExport);
    toast.success(`Exported ${toExport.length} clients`);
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export CSV
            {someSelected && ` (${selected.size})`}
          </Button>
          {canManage && (
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Import CSV
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="w-10 px-3 py-3">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3">
                Client
              </th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">
                Project
              </th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">
                Pipeline · Stage
              </th>
              <th className="text-right font-medium text-muted-foreground px-4 py-3">
                Value
              </th>
              <th className="text-left font-medium text-muted-foreground px-4 py-3">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {clients.map((client) => (
              <tr
                key={client.id}
                className={cn(
                  "hover:bg-muted/20 transition-colors group relative",
                  selected.has(client.id) && "bg-primary/5"
                )}
              >
                <td className="w-10 px-3 py-3">
                  <Checkbox
                    checked={selected.has(client.id)}
                    onCheckedChange={() => toggle(client.id)}
                    aria-label={`Select ${client.name}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/clients/${client.id}`} className="block">
                    <p className="font-medium leading-snug group-hover:text-primary transition-colors">
                      {client.name}
                    </p>
                    {client.email && (
                      <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                        {client.email}
                      </p>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <p className="text-muted-foreground truncate max-w-[160px]">
                    {client.projectType ?? "—"}
                  </p>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {client.currentStage ? (
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ background: client.currentStage.color }}
                      />
                      <span className="text-muted-foreground truncate max-w-[160px]">
                        {client.pipeline?.name} · {client.currentStage.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {client.projectValue ? formatCurrency(client.projectValue) : "—"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={client.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bulk Action Bar */}
      {someSelected && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 bg-card border border-border shadow-lg rounded-xl px-4 py-2.5">
            <span className="text-sm font-medium mr-1">
              {selected.size} selected
            </span>

            <Select
              onValueChange={(stageId) => bulkAction("MOVE_STAGE", { stageId })}
              disabled={loading}
            >
              <SelectTrigger className="h-8 w-auto gap-1 text-xs">
                <ArrowRight className="h-3.5 w-3.5" />
                <SelectValue placeholder="Move to stage" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              onValueChange={(status) => bulkAction("CHANGE_STATUS", { status })}
              disabled={loading}
            >
              <SelectTrigger className="h-8 w-auto gap-1 text-xs">
                <UserCheck className="h-3.5 w-3.5" />
                <SelectValue placeholder="Set status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {canManage && (
              <Button
                variant="destructive"
                size="sm"
                className="h-8 text-xs"
                disabled={loading}
                onClick={() => {
                  if (confirm(`Delete ${selected.size} client${selected.size !== 1 ? "s" : ""}? This cannot be undone.`)) {
                    bulkAction("DELETE");
                  }
                }}
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setSelected(new Set())}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      <CsvImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => {
          setImportOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    ACTIVE: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    LOST: "bg-red-100 text-red-600",
    ON_HOLD: "bg-amber-100 text-amber-700",
    ARCHIVED: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        variants[status] ?? "bg-muted text-muted-foreground"
      )}
    >
      {status.charAt(0) + status.slice(1).toLowerCase().replace("_", " ")}
    </span>
  );
}
