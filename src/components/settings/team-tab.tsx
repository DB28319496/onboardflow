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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, UserPlus, Trash2, Mail } from "lucide-react";
import { toast } from "sonner";

type Member = {
  id: string;
  role: string;
  user: { id: string; name: string | null; email: string; image: string | null };
};

type Invitation = {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
  invitedBy: { name: string | null; email: string };
};

const inviteSchema = z.object({
  email: z.string().email("Invalid email"),
  role: z.enum(["ADMIN", "MEMBER"]),
});

type InviteValues = z.infer<typeof inviteSchema>;

export function TeamTab({ currentUserId }: { currentUserId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const form = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema) as never,
    defaultValues: { email: "", role: "MEMBER" },
  });

  async function load() {
    const [mRes, iRes] = await Promise.all([
      fetch("/api/members"),
      fetch("/api/invitations"),
    ]);
    if (mRes.ok) setMembers(await mRes.json());
    if (iRes.ok) setInvitations(await iRes.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function onInvite(values: InviteValues) {
    setInviting(true);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to send invitation");
        return;
      }
      toast.success(`Invitation sent to ${values.email}`);
      form.reset();
      load();
    } finally {
      setInviting(false);
    }
  }

  async function revokeInvite(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/invitations/${id}`, { method: "DELETE" });
      setInvitations((prev) => prev.filter((i) => i.id !== id));
      toast.success("Invitation revoked");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-xl">
      {/* Invite Form */}
      <section className="space-y-4">
        <div>
          <p className="text-sm font-semibold">Invite Team Member</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            They'll receive an email with a link to join your workspace.
          </p>
        </div>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onInvite)}
            className="flex items-end gap-2"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="text-xs">Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="colleague@example.com"
                      className="h-9"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="w-32">
                  <FormLabel className="text-xs">Role</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="sm" className="h-9 shrink-0" disabled={inviting}>
              {inviting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <UserPlus className="h-3.5 w-3.5" />
              )}
              <span className="ml-1.5">Invite</span>
            </Button>
          </form>
        </Form>
      </section>

      <Separator />

      {/* Current Members */}
      <section className="space-y-3">
        <p className="text-sm font-semibold">Members ({members.length})</p>
        <div className="space-y-1">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                {(m.user.name ?? m.user.email).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {m.user.name ?? m.user.email}
                  {m.user.id === currentUserId && (
                    <span className="ml-1.5 text-xs text-muted-foreground font-normal">(you)</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground truncate">{m.user.email}</p>
              </div>
              <Badge
                variant="secondary"
                className="text-[10px] font-medium shrink-0"
              >
                {m.role}
              </Badge>
            </div>
          ))}
        </div>
      </section>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <>
          <Separator />
          <section className="space-y-3">
            <p className="text-sm font-semibold">
              Pending Invitations ({invitations.length})
            </p>
            <div className="space-y-1">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors group"
                >
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <Mail className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Expires {new Date(inv.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-medium text-amber-700 border-amber-300 shrink-0"
                  >
                    {inv.role}
                  </Badge>
                  <button
                    onClick={() => revokeInvite(inv.id)}
                    disabled={deletingId === inv.id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive disabled:opacity-50"
                  >
                    {deletingId === inv.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
