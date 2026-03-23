// Simple in-memory event bus for SSE real-time updates
// In production with multiple instances, replace with Redis pub/sub

type Listener = (event: ServerEvent) => void;

export type ServerEvent = {
  type: "CLIENT_UPDATED" | "CLIENT_CREATED" | "CLIENT_DELETED" | "STAGE_CHANGE" | "NOTIFICATION" | "REFRESH";
  workspaceId: string;
  payload?: Record<string, unknown>;
};

class EventBus {
  private listeners = new Map<string, Set<Listener>>();

  subscribe(workspaceId: string, listener: Listener): () => void {
    if (!this.listeners.has(workspaceId)) {
      this.listeners.set(workspaceId, new Set());
    }
    this.listeners.get(workspaceId)!.add(listener);
    return () => {
      this.listeners.get(workspaceId)?.delete(listener);
      if (this.listeners.get(workspaceId)?.size === 0) {
        this.listeners.delete(workspaceId);
      }
    };
  }

  emit(event: ServerEvent) {
    const listeners = this.listeners.get(event.workspaceId);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(event);
        } catch {
          // ignore listener errors
        }
      }
    }
  }
}

const globalForEvents = globalThis as unknown as { eventBus: EventBus };
export const eventBus = globalForEvents.eventBus ?? new EventBus();
if (process.env.NODE_ENV !== "production") globalForEvents.eventBus = eventBus;
