"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Send, FileText } from "lucide-react";
import { toast } from "sonner";

type Template = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

export function SendEmailDialog({
  open,
  onClose,
  clientId,
  clientEmail,
}: {
  open: boolean;
  onClose: () => void;
  clientId: string;
  clientEmail: string | null;
}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState<"template" | "custom">("template");

  useEffect(() => {
    if (open) {
      fetch("/api/email-templates")
        .then((r) => r.json())
        .then((data) => setTemplates(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [open]);

  function handleTemplateSelect(templateId: string) {
    setSelectedTemplate(templateId);
    const tmpl = templates.find((t) => t.id === templateId);
    if (tmpl) {
      setSubject(tmpl.subject);
      setBody(tmpl.body);
    }
  }

  async function handleSend() {
    if (!clientEmail) {
      toast.error("Client has no email address");
      return;
    }

    setSending(true);
    try {
      const payload =
        mode === "template" && selectedTemplate
          ? { templateId: selectedTemplate }
          : { subject, body };

      const res = await fetch(`/api/clients/${clientId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to send email");
        return;
      }
      toast.success("Email sent successfully");
      handleClose();
    } catch {
      toast.error("Failed to send email");
    } finally {
      setSending(false);
    }
  }

  function handleClose() {
    setSelectedTemplate("");
    setSubject("");
    setBody("");
    setMode("template");
    onClose();
  }

  const canSend =
    mode === "template"
      ? !!selectedTemplate
      : subject.trim() && body.trim();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">To</p>
            <p className="text-sm font-medium">
              {clientEmail ?? <span className="text-red-500">No email address</span>}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2">
            <Button
              variant={mode === "template" ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setMode("template")}
            >
              <FileText className="h-3.5 w-3.5 mr-1" />
              From Template
            </Button>
            <Button
              variant={mode === "custom" ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setMode("custom")}
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              Custom
            </Button>
          </div>

          {mode === "template" ? (
            <div>
              <label className="text-xs font-medium mb-1.5 block">
                Select Template
              </label>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate && (
                <div className="mt-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-xs font-medium mb-1">Subject: {subject}</p>
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {body.replace(/<[^>]*>/g, "").slice(0, 200)}...
                  </p>
                  <p className="text-[11px] text-muted-foreground/60 mt-2">
                    Merge fields (e.g. {"{{client_name}}"}) will be filled automatically.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Subject</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject..."
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Body</label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your email content... Supports merge fields like {{client_name}}"
                  rows={6}
                  className="text-sm resize-none"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={!canSend || sending || !clientEmail}>
            {sending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <Send className="h-3.5 w-3.5 mr-1.5" />
            )}
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
