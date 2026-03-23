import type { Config } from "@netlify/functions";

// Runs weekly on Sunday at 3:00 AM UTC — cleans up expired data per retention policy
export default async () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.URL;
  if (!baseUrl) {
    console.error("[cron] NEXT_PUBLIC_APP_URL not set");
    return;
  }

  try {
    const res = await fetch(`${baseUrl}/api/cron/cleanup`, {
      headers: {
        authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
    });
    const data = await res.json();
    console.log("[cron] cleanup result:", data);
  } catch (err) {
    console.error("[cron] cleanup failed:", err);
  }
};

export const config: Config = {
  schedule: "0 3 * * 0", // Every Sunday at 3:00 AM UTC
};
