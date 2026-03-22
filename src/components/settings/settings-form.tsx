"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, Copy, Check, ShieldAlert, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "@/components/dashboard/role-context";

type WorkspaceData = {
  id: string;
  name: string;
  slug: string;
  brandColor: string;
  portalEnabled: boolean;
  intakeEnabled: boolean;
  emailFromName: string | null;
  emailReplyTo: string | null;
  apiKey: string;
};

const schema = z.object({
  name: z.string().min(1, "Workspace name is required"),
  emailFromName: z.string().optional(),
  emailReplyTo: z.string().email("Invalid email").optional().or(z.literal("")),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color"),
  portalEnabled: z.boolean(),
  intakeEnabled: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function SettingsForm({ workspace: initial }: { workspace: WorkspaceData }) {
  const { canManage } = useRole();
  const [saving, setSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedIntake, setCopiedIntake] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      name: initial.name,
      emailFromName: initial.emailFromName ?? "",
      emailReplyTo: initial.emailReplyTo ?? "",
      brandColor: initial.brandColor,
      portalEnabled: initial.portalEnabled,
      intakeEnabled: initial.intakeEnabled,
    },
  });

  async function onSave(values: FormValues) {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          emailFromName: values.emailFromName || null,
          emailReplyTo: values.emailReplyTo || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function copyApiKey() {
    await navigator.clipboard.writeText(initial.apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  }

  async function copyIntakeUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setCopiedIntake(true);
    setTimeout(() => setCopiedIntake(false), 2000);
  }

  const portalEnabled = form.watch("portalEnabled");
  const intakeEnabled = form.watch("intakeEnabled");
  const intakeUrl = typeof window !== "undefined"
    ? `${window.location.origin}/intake/${initial.slug}`
    : `/intake/${initial.slug}`;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-8 max-w-xl">

        {/* ── General ──────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div>
            <p className="text-sm font-semibold">General</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Basic workspace information.
            </p>
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Workspace Name *</FormLabel>
                <FormControl>
                  <Input {...field} className="h-9" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <p className="text-xs font-medium mb-1.5">Slug</p>
            <Input
              value={initial.slug}
              disabled
              className="h-9 bg-muted/50 text-muted-foreground font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Slug cannot be changed after creation.
            </p>
          </div>

          <FormField
            control={form.control}
            name="brandColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Brand Color</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="h-9 w-12 rounded border border-input cursor-pointer p-0.5 bg-background"
                    />
                    <Input
                      {...field}
                      className="h-9 font-mono uppercase w-32"
                      maxLength={7}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <Separator />

        {/* ── Email ────────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div>
            <p className="text-sm font-semibold">Email Settings</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Displayed as the sender name for automated emails.
            </p>
          </div>

          <FormField
            control={form.control}
            name="emailFromName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Sender Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="h-9"
                    placeholder={initial.name}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emailReplyTo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Reply-To Address</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    {...field}
                    className="h-9"
                    placeholder="hello@yourbusiness.com"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <Separator />

        {/* ── Portal ───────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div>
            <p className="text-sm font-semibold">Client Portal</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Give clients a read-only link to view their project status and checklist.
            </p>
          </div>

          <FormField
            control={form.control}
            name="portalEnabled"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3">
                  <div>
                    <FormLabel className="text-sm font-medium cursor-pointer">
                      Enable Client Portal
                    </FormLabel>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Clients can access their portal via a unique link.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />

          {portalEnabled && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
              <p className="text-xs font-medium text-emerald-800">
                Portal is active
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Share portal links from any client&apos;s detail page. Links look like{" "}
                <code className="font-mono bg-emerald-100 px-1 rounded">/portal/[token]</code>.
              </p>
            </div>
          )}
        </section>

        <Separator />

        {/* ── Intake Form ──────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div>
            <p className="text-sm font-semibold">Intake Form</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              A public form new clients can fill out to enter your pipeline.
            </p>
          </div>

          <FormField
            control={form.control}
            name="intakeEnabled"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3">
                  <div>
                    <FormLabel className="text-sm font-medium cursor-pointer">
                      Enable Intake Form
                    </FormLabel>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Share a public link for new clients to submit their info.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />

          {intakeEnabled && (
            <div className="space-y-2">
              <p className="text-xs font-medium">Intake Form URL</p>
              <div className="flex items-center gap-2">
                <Input
                  value={intakeUrl}
                  readOnly
                  className="h-9 font-mono text-xs bg-muted/50 text-muted-foreground flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-9 shrink-0"
                  onClick={() => copyIntakeUrl(intakeUrl)}
                >
                  {copiedIntake ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Share this link with prospective clients. Submissions appear instantly in your pipeline.
              </p>
            </div>
          )}
        </section>

        <Separator />

        {/* ── API Key ──────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div>
            <p className="text-sm font-semibold">API Access</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Use this key to authenticate API requests from external integrations.
            </p>
          </div>

          <div>
            <p className="text-xs font-medium mb-1.5">API Key</p>
            <div className="flex items-center gap-2">
              <Input
                value={initial.apiKey}
                readOnly
                className="h-9 font-mono text-xs bg-muted/50 text-muted-foreground flex-1"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9 shrink-0"
                onClick={copyApiKey}
              >
                {copiedKey ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Keep this secret. Do not expose it in client-side code.
            </p>
          </div>
        </section>

        {/* ── Data Management ──────────────────────────────────────────────── */}
        {canManage && (
          <>
            <Separator />
            <section className="space-y-4">
              <div>
                <p className="text-sm font-semibold">Data Management</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Export your workspace data or generate reports.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open("/api/export", "_blank")}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Export All Data (JSON)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open("/api/reports?type=pipeline", "_blank")}
                >
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                  Pipeline Report (PDF)
                </Button>
              </div>
            </section>
          </>
        )}

        {/* ── Save ─────────────────────────────────────────────────────────── */}
        {canManage ? (
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={saving}>
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save Changes
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800">
              Only admins and owners can modify workspace settings.
            </p>
          </div>
        )}
      </form>
    </Form>
  );
}
