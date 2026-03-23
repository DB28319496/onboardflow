"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Save, CheckCircle2, AlertCircle, User, Lock } from "lucide-react";
import { toast } from "sonner";

type Profile = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  emailVerified: string | null;
  createdAt: string;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setName(data.name ?? "");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      const updated = await res.json();
      setProfile(updated);
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) return null;

  const initials = (profile.name ?? profile.email)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Profile Info */}
      <section className="rounded-xl border bg-card p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.image ?? undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold">{profile.name ?? "No name"}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              {profile.emailVerified ? (
                <Badge variant="secondary" className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950 text-[10px]">
                  <CheckCircle2 className="h-3 w-3 mr-0.5" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-amber-600 bg-amber-50 dark:bg-amber-950 text-[10px]">
                  <AlertCircle className="h-3 w-3 mr-0.5" />
                  Unverified
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Member since {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <User className="h-4 w-4" />
            Personal Information
          </div>
          <div className="grid gap-3">
            <div>
              <Label htmlFor="name" className="text-xs">
                Full Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input value={profile.email} disabled className="mt-1 opacity-60" />
              <p className="text-[10px] text-muted-foreground mt-1">
                Email cannot be changed.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSaveProfile} disabled={saving}>
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save Changes
            </Button>
          </div>
        </div>
      </section>

      {/* Password */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Lock className="h-4 w-4" />
          Change Password
        </div>
        <div className="grid gap-3">
          <div>
            <Label htmlFor="current" className="text-xs">
              Current Password
            </Label>
            <Input
              id="current"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="new" className="text-xs">
                New Password
              </Label>
              <Input
                id="new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="confirm" className="text-xs">
                Confirm Password
              </Label>
              <Input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={handleChangePassword}
            disabled={saving || !currentPassword || !newPassword}
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Change Password
          </Button>
        </div>
      </section>
    </div>
  );
}
