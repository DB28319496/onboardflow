"use client";

import { useState, useEffect, useCallback } from "react";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";
import {
  FileText,
  ImageIcon,
  File,
  Trash2,
  Loader2,
  Download,
} from "lucide-react";
import { toast } from "sonner";

type Document = {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  createdAt: string;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === "application/pdf" || mimeType.includes("word") || mimeType.includes("sheet")) {
    return <FileText className="h-4 w-4 text-blue-500 shrink-0" />;
  }
  if (mimeType.startsWith("image/")) {
    return <ImageIcon className="h-4 w-4 text-purple-500 shrink-0" />;
  }
  return <File className="h-4 w-4 text-muted-foreground shrink-0" />;
}

export function ClientDocuments({ clientId }: { clientId: string }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    const res = await fetch(`/api/clients/${clientId}/documents`);
    if (res.ok) setDocuments(await res.json());
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  async function deleteDocument(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/clients/${clientId}/documents/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        toast.success("Document deleted");
      } else {
        toast.error("Failed to delete document");
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Documents
        </p>
        <UploadButton<OurFileRouter, "clientDocumentUploader">
          endpoint="clientDocumentUploader"
          headers={{ "x-client-id": clientId }}
          onClientUploadComplete={() => {
            fetchDocuments();
            toast.success("Document uploaded");
          }}
          onUploadError={(err) => { toast.error(err.message); }}
          appearance={{
            button:
              "h-7 px-3 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors ut-uploading:opacity-50",
            allowedContent: "hidden",
          }}
          content={{ button: "Upload File" }}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-6 text-xs text-muted-foreground border border-dashed border-border rounded-lg">
          No documents uploaded yet
        </div>
      ) : (
        <div className="space-y-1">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-muted/40 transition-colors group"
            >
              <FileIcon mimeType={doc.mimeType} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{doc.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {formatFileSize(doc.size)}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
                <button
                  onClick={() => deleteDocument(doc.id)}
                  disabled={deletingId === doc.id}
                  className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                >
                  {deletingId === doc.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
