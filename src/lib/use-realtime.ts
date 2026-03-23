"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

const MAX_RETRIES = 3; // Stop trying after 3 failed connections

export function useRealtime() {
  const queryClient = useQueryClient();
  const retryCount = useRef(0);

  useEffect(() => {
    // Skip SSE in environments that don't support it
    if (typeof EventSource === "undefined") return;

    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let disposed = false;

    function connect() {
      if (disposed) return;
      if (retryCount.current >= MAX_RETRIES) {
        // SSE not supported on this host — fall back to polling-free mode
        return;
      }

      eventSource = new EventSource("/api/events");

      eventSource.onopen = () => {
        retryCount.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as { type: string };

          switch (data.type) {
            case "CLIENT_UPDATED":
            case "CLIENT_CREATED":
            case "CLIENT_DELETED":
            case "STAGE_CHANGE":
              queryClient.invalidateQueries({ queryKey: ["clients"] });
              queryClient.invalidateQueries({ queryKey: ["pipeline"] });
              break;
            case "NOTIFICATION":
              queryClient.invalidateQueries({ queryKey: ["notifications"] });
              break;
            case "REFRESH":
              queryClient.invalidateQueries();
              break;
          }
        } catch {
          // ignore parse errors
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        retryCount.current++;

        if (retryCount.current >= MAX_RETRIES) {
          // SSE not available — silently stop
          return;
        }

        const delay = Math.min(1000 * 2 ** retryCount.current, 30_000);
        reconnectTimer = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      disposed = true;
      eventSource?.close();
      clearTimeout(reconnectTimer);
    };
  }, [queryClient]);
}
