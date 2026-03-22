"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseCsv } from "@/lib/csv";
import { Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const CADENCE_FIELDS = [
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "companyName", label: "Company" },
  { value: "projectType", label: "Project Type" },
  { value: "projectValue", label: "Project Value" },
  { value: "_skip", label: "Skip" },
];

const AUTO_MAP: Record<string, string> = {
  name: "name",
  "client name": "name",
  "full name": "name",
  "first name": "name",
  email: "email",
  "email address": "email",
  phone: "phone",
  "phone number": "phone",
  company: "companyName",
  "company name": "companyName",
  organization: "companyName",
  "project type": "projectType",
  type: "projectType",
  "project value": "projectValue",
  value: "projectValue",
  amount: "projectValue",
};

type ImportResult = {
  created: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
  total: number;
};

export function CsvImportDialog({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<number, string>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers: h, rows: r } = parseCsv(text);
      setHeaders(h);
      setRows(r);
      setResult(null);

      // Auto-map columns
      const autoMapping: Record<number, string> = {};
      h.forEach((header, i) => {
        const normalized = header.toLowerCase().trim();
        if (AUTO_MAP[normalized]) {
          autoMapping[i] = AUTO_MAP[normalized];
        }
      });
      setMapping(autoMapping);
    };
    reader.readAsText(file);
  }, []);

  function updateMapping(colIndex: number, field: string) {
    setMapping((prev) => ({ ...prev, [colIndex]: field }));
  }

  async function handleImport() {
    // Build client objects from mapping
    const nameCol = Object.entries(mapping).find(([, f]) => f === "name");
    if (!nameCol) {
      toast.error('Please map at least the "Name" column');
      return;
    }

    const clients = rows.map((row) => {
      const client: Record<string, string | number | undefined> = {};
      Object.entries(mapping).forEach(([colIdx, field]) => {
        if (field === "_skip") return;
        const val = row[parseInt(colIdx)] ?? "";
        if (field === "projectValue") {
          const num = parseFloat(val.replace(/[,$]/g, ""));
          if (!isNaN(num)) client[field] = num;
        } else {
          client[field] = val;
        }
      });
      return client;
    }).filter((c) => c.name && (c.name as string).trim());

    if (clients.length === 0) {
      toast.error("No valid rows to import");
      return;
    }

    setImporting(true);
    try {
      const res = await fetch("/api/clients/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clients }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Import failed");
        return;
      }
      setResult(data);
      if (data.created > 0) {
        toast.success(`Imported ${data.created} clients`);
      }
    } catch {
      toast.error("Import failed");
    } finally {
      setImporting(false);
    }
  }

  function handleClose() {
    setHeaders([]);
    setRows([]);
    setMapping({});
    setResult(null);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Clients from CSV</DialogTitle>
        </DialogHeader>

        {result ? (
          // Results view
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  {result.created} of {result.total} clients imported
                </p>
                {result.skipped > 0 && (
                  <p className="text-xs text-emerald-700 mt-0.5">
                    {result.skipped} skipped due to errors
                  </p>
                )}
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm font-medium text-red-800 mb-2">Errors</p>
                <ul className="space-y-1">
                  {result.errors.slice(0, 5).map((err, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-red-700">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      Row {err.row}: {err.message}
                    </li>
                  ))}
                  {result.errors.length > 5 && (
                    <li className="text-xs text-red-600">
                      ...and {result.errors.length - 5} more
                    </li>
                  )}
                </ul>
              </div>
            )}
            <DialogFooter>
              <Button
                onClick={() => {
                  handleClose();
                  onImported();
                }}
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : headers.length === 0 ? (
          // Upload view
          <div className="py-8">
            <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-12 cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium">Click to upload CSV</p>
              <p className="text-xs text-muted-foreground mt-1">
                CSV files with headers are supported
              </p>
              <input
                type="file"
                accept=".csv,.tsv,.txt"
                className="hidden"
                onChange={handleFile}
              />
            </label>
          </div>
        ) : (
          // Mapping view
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Map your CSV columns to Cadence fields. Found {rows.length} rows.
            </p>

            {/* Column mapping */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {headers.map((header, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-36 truncate shrink-0">
                    {header}
                  </span>
                  <span className="text-xs text-muted-foreground">→</span>
                  <Select
                    value={mapping[i] ?? "_skip"}
                    onValueChange={(v) => updateMapping(i, v)}
                  >
                    <SelectTrigger className="h-8 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CADENCE_FIELDS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {/* Preview */}
            {rows.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Preview (first 3 rows)
                </p>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/30">
                        {headers.map((h, i) => (
                          <th key={i} className="px-2 py-1.5 text-left font-medium text-muted-foreground truncate max-w-24">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {rows.slice(0, 3).map((row, ri) => (
                        <tr key={ri}>
                          {headers.map((_, ci) => (
                            <td key={ci} className="px-2 py-1.5 truncate max-w-24">
                              {row[ci] ?? ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                Import {rows.length} Clients
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
