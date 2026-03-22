"use client";

import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Webhook, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "@/components/dashboard/role-context";

type WebhookEntry = {
  id: string;
  url: string;
  events: string;
  secret: string;
  isActive: boolean;
  createdAt: string;
};

const EVENTS = [
  { value: "CLIENT_CREATED", label: "Client Created" },
  { value: "STAGE_CHANGE", label: "Stage Changed" },
  { value: "CLIENT_COMPLETED", label: "Client Completed" },
  { value: "CLIENT_DELETED", label: "Client Deleted" },
  { value: "EMAIL_SENT", label: "Email Sent" },
];

const schema = z.object({
  url: z.string().url("Invalid URL"),
  events: z.array(z.string()).min(1, "Select at least one event"),
});

type FormValues = z.infer<typeof schema>;

export function WebhooksTab() {
  const { canManage } = useRole();
  const [webhooks, setWebhooks] = useState<WebhookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: { url: "", events: [] },
  });

  useEffect(() => {
    fetch("/api/webhooks")
      .then((r) => r.json())
      .then((data) => setWebhooks(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function onCreate(values: FormValues) {
    setCreating(true);
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Failed to create webhook");
        return;
      }
      const webhook = await res.json();
      setWebhooks((prev) => [webhook, ...prev]);
      form.reset();
      setShowForm(false);
      toast.success("Webhook created");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/webhooks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    setWebhooks((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isActive } : w))
    );
  }

  async function deleteWebhook(id: string) {
    await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
    toast.success("Webhook deleted");
  }

  function copySecret(id: string, secret: string) {
    navigator.clipboard.writeText(secret);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Webhooks</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Send real-time event data to external services.
          </p>
        </div>
        {canManage && !showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Webhook
          </Button>
        )}
      </div>

      {showForm && canManage && (
        <div className="rounded-xl border border-border p-4 space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCreate)} className="space-y-4">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Endpoint URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://example.com/webhook" className="h-9" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="events"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-xs">Events</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {EVENTS.map((event) => (
                        <FormField
                          key={event.value}
                          control={form.control}
                          name="events"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(event.value)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    field.onChange(
                                      checked
                                        ? [...current, event.value]
                                        : current.filter((v: string) => v !== event.value)
                                    );
                                  }}
                                />
                              </FormControl>
                              <span className="text-xs">{event.label}</span>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => { setShowForm(false); form.reset(); }}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={creating}>
                  {creating && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                  Create
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}

      {webhooks.length === 0 && !showForm ? (
        <div className="text-center py-12">
          <Webhook className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No webhooks configured</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Add a webhook to send event data to external services like Zapier or Make.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {webhooks.map((wh) => {
            const events: string[] = (() => { try { return JSON.parse(wh.events); } catch { return []; } })();
            return (
              <div
                key={wh.id}
                className="rounded-xl border border-border px-4 py-3 flex items-start gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono truncate">{wh.url}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {events.map((e) => (
                      <Badge key={e} variant="secondary" className="text-[10px]">
                        {e}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] text-muted-foreground font-mono truncate max-w-32">
                      Secret: {wh.secret.slice(0, 8)}...
                    </span>
                    <button
                      onClick={() => copySecret(wh.id, wh.secret)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {copiedId === wh.id ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={wh.isActive}
                    onCheckedChange={(v) => toggleActive(wh.id, v)}
                    className="data-[state=checked]:bg-emerald-500"
                    disabled={!canManage}
                  />
                  {canManage && (
                    <button
                      onClick={() => deleteWebhook(wh.id)}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
