import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Mail, Plus, FileText, AlertCircle } from "lucide-react";
import Link from "next/link";

type Activity = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: Date;
  user: { name: string | null; image: string | null } | null;
  client: { id: string; name: string } | null;
};

const TYPE_ICONS: Record<string, typeof Plus> = {
  CLIENT_CREATED: Plus,
  STAGE_CHANGE: ArrowRight,
  EMAIL_SENT: Mail,
  NOTE_ADDED: FileText,
  STATUS_CHANGE: AlertCircle,
};

export function ActivityFeed({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity) => {
        const Icon = TYPE_ICONS[activity.type] ?? FileText;
        return (
          <div
            key={activity.id}
            className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors"
          >
            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-snug">
                {activity.user?.name && (
                  <span className="font-medium">{activity.user.name} </span>
                )}
                <span className="text-muted-foreground">{activity.title}</span>
              </p>
              {activity.client && (
                <Link
                  href={`/clients/${activity.client.id}`}
                  className="text-xs text-primary hover:underline"
                >
                  {activity.client.name}
                </Link>
              )}
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
