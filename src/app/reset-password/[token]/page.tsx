"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Building2, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });
type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) as never });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: params.token, password: data.password }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setDone(true);
      toast.success("Password updated! Redirecting…");
      setTimeout(() => router.push("/login"), 2000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <Card className="shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Building2 className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg tracking-tight">Cadence</span>
            </div>
            <CardTitle className="text-2xl font-bold">Set new password</CardTitle>
            <CardDescription>Choose a strong password for your account.</CardDescription>
          </CardHeader>
          <CardContent>
            {done ? (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
                <p className="text-sm text-green-800 font-medium">Password updated!</p>
                <p className="text-xs text-green-700 mt-1">Redirecting you to sign in…</p>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="password">New password</Label>
                    <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
                    {errors.password && (
                      <p className="text-xs text-destructive">{errors.password.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm">Confirm password</Label>
                    <Input id="confirm" type="password" placeholder="••••••••" {...register("confirm")} />
                    {errors.confirm && (
                      <p className="text-xs text-destructive">{errors.confirm.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update password
                  </Button>
                </form>
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  <Link href="/login" className="inline-flex items-center gap-1.5 hover:underline text-primary">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to sign in
                  </Link>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
