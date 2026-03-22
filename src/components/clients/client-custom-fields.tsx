"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type CustomField = {
  id: string;
  name: string;
  type: string;
  options: string | null;
};

type FieldValue = {
  customFieldId: string;
  value: string;
};

export function ClientCustomFields({ clientId }: { clientId: string }) {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/custom-fields").then((r) => r.json()),
      fetch(`/api/clients/${clientId}`).then((r) => r.json()),
    ])
      .then(([fieldsData, clientData]) => {
        setFields(Array.isArray(fieldsData) ? fieldsData : []);
        const vals: Record<string, string> = {};
        if (clientData.customFieldValues) {
          for (const v of clientData.customFieldValues as FieldValue[]) {
            vals[v.customFieldId] = v.value;
          }
        }
        setValues(vals);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clientId]);

  const saveValue = useCallback(
    async (fieldId: string, value: string) => {
      setValues((prev) => ({ ...prev, [fieldId]: value }));
      try {
        await fetch(`/api/clients/${clientId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customFields: { [fieldId]: value },
          }),
        });
      } catch {
        toast.error("Failed to save");
      }
    },
    [clientId]
  );

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (fields.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Custom Fields
      </p>
      <div className="space-y-2">
        {fields.map((field) => {
          const value = values[field.id] ?? "";
          const options: string[] = (() => {
            try { return field.options ? JSON.parse(field.options) : []; }
            catch { return []; }
          })();

          return (
            <div key={field.id}>
              <label className="text-xs font-medium mb-1 block">{field.name}</label>
              {field.type === "SELECT" ? (
                <Select
                  value={value || undefined}
                  onValueChange={(v) => saveValue(field.id, v)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={`Select ${field.name}...`} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={field.type === "NUMBER" ? "number" : field.type === "DATE" ? "date" : "text"}
                  value={value}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                  onBlur={() => saveValue(field.id, value)}
                  className="h-8 text-xs"
                  placeholder={`Enter ${field.name}...`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
