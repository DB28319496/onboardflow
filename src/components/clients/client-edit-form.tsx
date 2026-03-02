"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, Trash2, Link2, Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  projectType: z.string().optional(),
  projectValue: z.coerce.number().min(0).optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  status: z.string(),
});

type FormValues = z.infer<typeof schema>;

type Stage = { id: string; name: string; color: string; order: number };
type Pipeline = { id: string; name: string; stages: Stage[] };

type ClientData = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  projectType: string | null;
  projectValue: number | null;
  source: string;
  notes: string | null;
  status: string;
  currentStageId: string | null;
  pipeline: Pipeline | null;
  stageEnteredAt: string;
  portalToken: string | null;
  portalEnabled: boolean;
};

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active", color: "bg-blue-100 text-blue-700" },
  { value: "COMPLETED", label: "Completed", color: "bg-emerald-100 text-emerald-700" },
  { value: "LOST", label: "Lost", color: "bg-red-100 text-red-600" },
  { value: "ON_HOLD", label: "On Hold", color: "bg-amber-100 text-amber-700" },
  { value: "ARCHIVED", label: "Archived", color: "bg-muted text-muted-foreground" },
];

const SOURCE_OPTIONS = [
  "MANUAL", "REFERRAL", "WEBSITE", "SOCIAL_MEDIA", "ADVERTISING", "OTHER",
];

export function ClientEditForm({
  client: initialClient,
}: {
  client: ClientData;
}) {
  const router = useRouter();
  const [client, setClient] = useState(initialClient);
  const [saving, setSaving] = useState(false);
  const [movingStage, setMovingStage] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [generatingPortal, setGeneratingPortal] = useState(false);
  const [copiedPortal, setCopiedPortal] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      name: client.name,
      email: client.email ?? "",
      phone: client.phone ?? "",
      companyName: client.companyName ?? "",
      projectType: client.projectType ?? "",
      projectValue: client.projectValue ?? undefined,
      source: client.source,
      notes: client.notes ?? "",
      status: client.status,
    },
  });

  async function onSave(values: FormValues) {
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          email: values.email || null,
          projectValue: values.projectValue ?? null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Changes saved");
      router.refresh();
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  async function handleMoveStage(stageId: string) {
    if (stageId === client.currentStageId) return;
    setMovingStage(true);
    try {
      const res = await fetch(`/api/clients/${client.id}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Stage updated");
      router.refresh();
    } catch {
      toast.error("Failed to move stage");
    } finally {
      setMovingStage(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete ${client.name}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Client deleted");
      router.push("/clients");
    } catch {
      toast.error("Failed to delete client");
      setDeleting(false);
    }
  }

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === form.watch("status"));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">

        {/* Status + Stage */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Status & Stage
          </p>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className={cn("px-1.5 py-0.5 rounded-full text-xs font-medium", opt.color)}>
                            {opt.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {client.pipeline && (
              <div>
                <p className="text-xs font-medium mb-1.5">Stage</p>
                <Select
                  value={client.currentStageId ?? ""}
                  onValueChange={handleMoveStage}
                  disabled={movingStage}
                >
                  <SelectTrigger className="h-9">
                    {movingStage ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <SelectValue placeholder="No stage" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {client.pipeline.stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ background: stage.color }} />
                          {stage.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Contact */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Contact
          </p>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Name *</FormLabel>
                <FormControl>
                  <Input {...field} className="h-9" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} className="h-9" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Phone</FormLabel>
                  <FormControl>
                    <Input {...field} className="h-9" />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Company</FormLabel>
                <FormControl>
                  <Input {...field} className="h-9" placeholder="Optional" />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Project */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Project
          </p>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="projectType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Type</FormLabel>
                  <FormControl>
                    <Input {...field} className="h-9" placeholder="e.g. Kitchen Remodel" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="projectValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Value ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.value)}
                      className="h-9"
                      placeholder="0"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Lead Source</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SOURCE_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Notes
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  rows={4}
                  placeholder="Internal notes about this client…"
                  className="resize-none text-sm"
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Separator />

        {/* Portal */}
        <PortalSection
          clientId={client.id}
          portalToken={client.portalToken}
          portalEnabled={client.portalEnabled}
          generating={generatingPortal}
          copied={copiedPortal}
          onGenerate={async (reset = false) => {
            setGeneratingPortal(true);
            try {
              const res = await fetch(`/api/clients/${client.id}/portal-token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reset }),
              });
              if (!res.ok) throw new Error();
              const data = await res.json();
              setClient((prev) => ({ ...prev, portalToken: data.portalToken }));
              toast.success(reset ? "Portal link regenerated" : "Portal link created");
            } catch {
              toast.error("Failed to generate portal link");
            } finally {
              setGeneratingPortal(false);
            }
          }}
          onCopy={async () => {
            if (!client.portalToken) return;
            const url = `${window.location.origin}/portal/${client.portalToken}`;
            await navigator.clipboard.writeText(url);
            setCopiedPortal(true);
            setTimeout(() => setCopiedPortal(false), 2000);
          }}
        />

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            )}
            Delete Client
          </Button>

          <Button type="submit" size="sm" disabled={saving}>
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <Save className="h-3.5 w-3.5 mr-1.5" />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}

function PortalSection({
  clientId,
  portalToken,
  portalEnabled,
  generating,
  copied,
  onGenerate,
  onCopy,
}: {
  clientId: string;
  portalToken: string | null;
  portalEnabled: boolean;
  generating: boolean;
  copied: boolean;
  onGenerate: (reset?: boolean) => Promise<void>;
  onCopy: () => Promise<void>;
}) {
  if (!portalEnabled) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Client Portal
        </p>
        <div className="rounded-lg border border-border/60 px-4 py-3 text-sm text-muted-foreground">
          Client portal is disabled.{" "}
          <Link href="/settings" className="text-primary hover:underline">
            Enable it in Settings
          </Link>{" "}
          to share a status link with your client.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Client Portal
      </p>

      {!portalToken ? (
        <div className="rounded-lg border border-border/60 px-4 py-3">
          <p className="text-sm text-muted-foreground mb-3">
            Generate a unique link so your client can view their project status.
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onGenerate()}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <Link2 className="h-3.5 w-3.5 mr-1.5" />
            )}
            Generate Portal Link
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border/60 px-4 py-3 space-y-3">
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-muted/60 px-2 py-1.5 rounded font-mono truncate text-muted-foreground">
              {typeof window !== "undefined"
                ? `${window.location.origin}/portal/${portalToken}`
                : `/portal/${portalToken}`}
            </code>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-7 w-7 shrink-0"
              onClick={onCopy}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-7 w-7 shrink-0"
              asChild
            >
              <a
                href={`/portal/${portalToken}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
          <button
            type="button"
            onClick={() => onGenerate(true)}
            disabled={generating}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {generating ? "Regenerating…" : "Regenerate link"}
          </button>
        </div>
      )}
    </div>
  );
}
