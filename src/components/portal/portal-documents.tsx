"use client";

import { useState } from "react";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";
import { FileText, ImageIcon, File, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Document = {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  createdAt: string;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PortalDocuments({
  documents: initialDocs,
  token,
  brandColor,
}: {
  documents: Document[];
  token: string;
  brandColor: string;
}) {
  const [documents, setDocuments] = useState(initialDocs);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-700">Documents</p>
        <UploadButton<OurFileRouter, "portalDocumentUploader">
          endpoint="portalDocumentUploader"
          headers={{ "x-portal-token": token }}
          onClientUploadComplete={(res) => {
            if (res?.[0]) {
              const file = res[0];
              setDocuments((prev) => [
                {
                  id: file.key,
                  name: file.name,
                  url: file.ufsUrl,
                  size: file.size,
                  mimeType: file.type,
                  createdAt: new Date().toISOString(),
                },
                ...prev,
              ]);
              toast.success("Document uploaded");
            }
          }}
          onUploadError={(error) => {
            toast.error(error.message || "Upload failed");
          }}
          appearance={{
            button: {
              background: brandColor,
              fontSize: "12px",
              padding: "6px 12px",
              height: "32px",
            },
            allowedContent: { display: "none" },
          }}
          content={{
            button: (
              <span className="flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5" />
                Upload
              </span>
            ),
          }}
        />
      </div>

      {documents.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">
          No documents yet. Upload files to share with your project team.
        </p>
      ) : (
        <div className="space-y-1">
          {documents.map((doc) => {
            const isImage = doc.mimeType.startsWith("image/");
            const isPdf =
              doc.mimeType === "application/pdf" ||
              doc.mimeType.includes("word") ||
              doc.mimeType.includes("sheet");
            return (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {isImage ? (
                  <ImageIcon className="h-4 w-4 text-purple-500 shrink-0" />
                ) : isPdf ? (
                  <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                ) : (
                  <File className="h-4 w-4 text-gray-400 shrink-0" />
                )}
                <span className="text-sm text-gray-700 truncate flex-1">{doc.name}</span>
                <span className="text-xs text-gray-400 shrink-0">{formatFileSize(doc.size)}</span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
