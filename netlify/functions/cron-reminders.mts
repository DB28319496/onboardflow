import type { Config } from "@netlify/functions";

// Runs every hour to check for due reminders and send notifications
export default async () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.URL;
  if (!baseUrl) {
    console.error("[cron] NEXT_PUBLIC_APP_URL not set");
    return;
  }

  try {
    const res = await fetch(`${baseUrl}/api/cron/check-reminders`, {
      headers: {
        authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
    });
    const data = await res.json();
    console.log("[cron] check-reminders result:", data);
  } catch (err) {
    console.error("[cron] failed:", err);
  }
};

export const config: Config = {
  schedule: "0 * * * *", // Every hour
};
