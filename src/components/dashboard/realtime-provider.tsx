"use client";

import { useRealtime } from "@/lib/use-realtime";

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  useRealtime();
  return <>{children}</>;
}
