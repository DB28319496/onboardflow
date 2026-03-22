"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Type, Hash, Calendar, List } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "@/components/dashboard/role-context";

type CustomField = {
  id: string;
  name: string;
  type: string;
  options: string | null;
  required: boolean;
};

const TYPE_ICONS: Record<string, typeof Type> = {
  TEXT: Type,
  NUMBER: Hash,
  DATE: Calendar,
  SELECT: List,
};

export function CustomFieldsTab() {
  const { canManage } = useRole();
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("TEXT");
  const [options, setOptions] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/custom-fields")
      .then((r) => r.json())
      .then((data) => setFields(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const body: Record<string, unknown> = { name: name.trim(), type };
      if (type === "SELECT" && options.trim()) {
        body.options = options.split(",").map((o) => o.trim()).filter(Boolean);
      }
      const res = await fetch("/api/custom-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed");
        return;
      }
      const field = await res.json();
      setFields((prev) => [...prev, field]);
      setName("");
      setType("TEXT");
      setOptions("");
      setShowForm(false);
      toast.success("Custom field created");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/custom-fields/${id}`, { method: "DELETE" });
    setFields((prev) => prev.filter((f) => f.id !== id));
    toast.success("Field deleted");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Custom Fields</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add custom data fields to your client profiles.
          </p>
        </div>
        {canManage && !showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Field
          </Button>
        )}
      </div>

      {showForm && canManage && (
        <div className="rounded-xl border border-border p-4 space-y-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Field name"
            className="h-9"
          />
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TEXT">Text</SelectItem>
              <SelectItem value="NUMBER">Number</SelectItem>
              <SelectItem value="DATE">Date</SelectItem>
              <SelectItem value="SELECT">Dropdown</SelectItem>
            </SelectContent>
          </Select>
          {type === "SELECT" && (
            <Input
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              placeholder="Options (comma-separated)"
              className="h-9"
            />
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={!name.trim() || creating}>
              {creating && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              Create
            </Button>
          </div>
        </div>
      )}

      {fields.length === 0 && !showForm ? (
        <div className="text-center py-12">
          <Type className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No custom fields yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {fields.map((field) => {
            const Icon = TYPE_ICONS[field.type] ?? Type;
            return (
              <div
                key={field.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors group"
              >
                <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{field.name}</p>
                  <p className="text-xs text-muted-foreground">{field.type.toLowerCase()}</p>
                </div>
                {field.required && (
                  <Badge variant="secondary" className="text-[10px]">Required</Badge>
                )}
                {canManage && (
                  <button
                    onClick={() => handleDelete(field.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
