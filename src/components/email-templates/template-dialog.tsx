"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Copy } from "lucide-react";
import { toast } from "sonner";
import { MERGE_FIELD_TOKENS } from "@/lib/email";

const TEMPLATE_TYPES = [
  { value: "WELCOME", label: "Welcome" },
  { value: "STAGE_CHANGE", label: "Stage Change" },
  { value: "FOLLOW_UP", label: "Follow-Up" },
  { value: "REMINDER", label: "Reminder" },
  { value: "CUSTOM", label: "Custom" },
];

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string(),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
});

type FormValues = z.infer<typeof schema>;

export type TemplateRow = {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: string;
  isActive: boolean;
  _count: { emailLogs: number };
};

export function TemplateDialog({
  open,
  onClose,
  template,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  template?: TemplateRow | null;
  onSaved: (t: TemplateRow) => void;
}) {
  const [saving, setSaving] = useState(false);
  const isEdit = !!template;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      name: "",
      type: "CUSTOM",
      subject: "",
      body: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        template
          ? { name: template.name, type: template.type, subject: template.subject, body: template.body }
          : { name: "", type: "CUSTOM", subject: "", body: "" }
      );
    }
  }, [open, template, form]);

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      const url = isEdit ? `/api/email-templates/${template.id}` : "/api/email-templates";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed");
      const saved = await res.json();
      toast.success(isEdit ? "Template updated" : "Template created");
      onSaved(saved);
      onClose();
    } catch {
      toast.error("Failed to save template");
    } finally {
      setSaving(false);
    }
  }

  function insertToken(token: string) {
    const bodyField = form.getValues("body");
    form.setValue("body", bodyField + token, { shouldDirty: true });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Template" : "New Template"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Template Name *</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-9" placeholder="e.g. Welcome Email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TEMPLATE_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Subject Line *</FormLabel>
                  <FormControl>
                    <Input {...field} className="h-9" placeholder="e.g. Welcome to {{workspace_name}}!" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Merge fields reference */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">
                Merge fields — click to insert into body:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {MERGE_FIELD_TOKENS.map((t) => (
                  <button
                    key={t.token}
                    type="button"
                    onClick={() => insertToken(t.token)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted hover:bg-muted/70 text-xs font-mono transition-colors"
                  >
                    <Copy className="h-2.5 w-2.5" />
                    {t.token}
                  </button>
                ))}
              </div>
            </div>

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Body (HTML) *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={12}
                      className="resize-y font-mono text-xs"
                      placeholder={"<p>Hi {{client_name}},</p>\n<p>Welcome to {{workspace_name}}!</p>"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                {isEdit ? "Save Changes" : "Create Template"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
