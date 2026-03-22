import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export type WebhookEvent =
  | "CLIENT_CREATED"
  | "STAGE_CHANGE"
  | "CLIENT_COMPLETED"
  | "CLIENT_DELETED"
  | "EMAIL_SENT";

export async function fireWebhooks(
  workspaceId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>
) {
  const webhooks = await prisma.webhook.findMany({
    where: { workspaceId, isActive: true },
  });

  for (const webhook of webhooks) {
    try {
      const events: string[] = JSON.parse(webhook.events);
      if (!events.includes(event)) continue;

      const body = JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data: payload,
      });

      const signature = crypto
        .createHmac("sha256", webhook.secret)
        .update(body)
        .digest("hex");

      fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Cadence-Event": event,
          "X-Cadence-Signature": signature,
        },
        body,
      }).catch(() => {});
    } catch {
      // skip malformed webhook config
    }
  }
}
