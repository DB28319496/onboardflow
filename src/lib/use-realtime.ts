"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useRealtime() {
  const queryClient = useQueryClient();
  const retryCount = useRef(0);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      eventSource = new EventSource("/api/events");

      eventSource.onopen = () => {
        retryCount.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as { type: string };

          // Invalidate relevant queries based on event type
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
        // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
        const delay = Math.min(1000 * 2 ** retryCount.current, 30_000);
        retryCount.current++;
        reconnectTimer = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      eventSource?.close();
      clearTimeout(reconnectTimer);
    };
  }, [queryClient]);
}
