type ClientRow = {
  name: string;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  projectType?: string | null;
  projectValue?: number | null;
  pipeline?: { name: string } | null;
  currentStage?: { name: string } | null;
  status: string;
  createdAt: string | Date;
};

export function exportClientsCsv(clients: ClientRow[], filename = "clients.csv") {
  const headers = [
    "Name",
    "Email",
    "Phone",
    "Company",
    "Project Type",
    "Project Value",
    "Pipeline",
    "Stage",
    "Status",
    "Created",
  ];

  const rows = clients.map((c) => [
    escapeCsvField(c.name),
    escapeCsvField(c.email ?? ""),
    escapeCsvField(c.phone ?? ""),
    escapeCsvField(c.companyName ?? ""),
    escapeCsvField(c.projectType ?? ""),
    c.projectValue?.toString() ?? "",
    escapeCsvField(c.pipeline?.name ?? ""),
    escapeCsvField(c.currentStage?.name ?? ""),
    c.status,
    new Date(c.createdAt).toISOString().split("T")[0],
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map(parseCsvLine);
  return { headers, rows };
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}
