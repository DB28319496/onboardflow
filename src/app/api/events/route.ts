import { requireAuth, requireWorkspace } from "@/lib/api-helpers";
import { eventBus, type ServerEvent } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId, error } = await requireAuth();
  if (error) return error;
  const { workspace, error: wsError } = await requireWorkspace(userId);
  if (wsError) return wsError;

  const workspaceId = workspace.id;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial keepalive
      controller.enqueue(encoder.encode(": connected\n\n"));

      // Subscribe to workspace events
      const unsubscribe = eventBus.subscribe(workspaceId, (event: ServerEvent) => {
        try {
          const data = JSON.stringify({ type: event.type, payload: event.payload });
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {
          // stream may be closed
        }
      });

      // Keepalive every 30s
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepalive);
        }
      }, 30_000);

      // Cleanup on close — use a timeout to periodically check
      // (ReadableStream doesn't provide a close callback in all runtimes)
      const cleanup = () => {
        clearInterval(keepalive);
        unsubscribe();
      };

      // Auto-close after 5 minutes (client will reconnect)
      setTimeout(() => {
        cleanup();
        try {
          controller.close();
        } catch {
          // already closed
        }
      }, 5 * 60 * 1000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
