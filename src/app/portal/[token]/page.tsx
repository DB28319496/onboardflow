import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Check, Clock, ArrowRight, Mail, FileText, ImageIcon, File } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";

type Params = { params: Promise<{ token: string }> };

function parseChecklist(json: string | null): string[] {
  try {
    const raw: unknown[] = json ? JSON.parse(json) : [];
    return raw.map((item) => {
      if (typeof item === "string") return item;
      if (typeof item === "object" && item !== null) {
        const obj = item as Record<string, unknown>;
        return String(obj.title ?? obj.text ?? obj.label ?? "");
      }
      return String(item);
    });
  } catch {
    return [];
  }
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  STAGE_CHANGE: <ArrowRight className="h-3.5 w-3.5" />,
  EMAIL_SENT: <Mail className="h-3.5 w-3.5" />,
  CLIENT_CREATED: <Check className="h-3.5 w-3.5" />,
};

export default async function PortalPage({ params }: Params) {
  const { token } = await params;

  const client = await prisma.client.findUnique({
    where: { portalToken: token },
    include: {
      workspace: {
        select: {
          name: true,
          brandColor: true,
          portalEnabled: true,
          emailFromName: true,
        },
      },
      currentStage: true,
      pipeline: {
        include: {
          stages: { orderBy: { order: "asc" } },
        },
      },
      stageCompletions: {
        where: { checklistItemId: { not: null } },
      },
      activities: {
        where: { type: { in: ["STAGE_CHANGE", "EMAIL_SENT", "CLIENT_CREATED"] } },
        orderBy: { createdAt: "desc" },
        take: 8,
      },
      documents: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!client || !client.workspace.portalEnabled) notFound();

  const { workspace } = client;
  const stages = client.pipeline?.stages ?? [];
  const currentStageIndex = stages.findIndex((s) => s.id === client.currentStageId);

  const checklist = parseChecklist(client.currentStage?.checklist ?? null);
  const completedIds = new Set(
    client.stageCompletions
      .filter((c) => c.stageId === client.currentStageId)
      .map((c) => c.checklistItemId!)
  );
  const checklistItems = checklist.map((text, i) => ({
    id: String(i),
    text,
    completed: completedIds.has(String(i)),
  }));
  const doneCount = checklistItems.filter((i) => i.completed).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Branded header */}
      <header
        className="px-6 py-4"
        style={{ background: workspace.brandColor }}
      >
        <p className="text-white font-semibold text-lg tracking-tight">
          {workspace.emailFromName ?? workspace.name}
        </p>
        <p className="text-white/60 text-xs mt-0.5">Client Project Portal</p>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Client info card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {client.projectType && (
              <span className="text-sm text-gray-500">{client.projectType}</span>
            )}
            {client.currentStage && (
              <>
                <span className="text-gray-300">·</span>
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ background: client.currentStage.color }}
                >
                  {client.currentStage.name}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Pipeline progress */}
        {stages.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <p className="text-sm font-semibold text-gray-700 mb-5">
              Project Progress
            </p>

            {/* Steps */}
            <div className="flex items-start gap-0 overflow-x-auto pb-2">
              {stages.map((stage, i) => {
                const isCompleted = i < currentStageIndex;
                const isCurrent = stage.id === client.currentStageId;
                const isFuture = i > currentStageIndex;

                return (
                  <div key={stage.id} className="flex items-center shrink-0">
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                          isCompleted
                            ? "bg-emerald-500 text-white"
                            : isFuture
                            ? "bg-gray-100 text-gray-400"
                            : "text-white"
                        )}
                        style={isCurrent ? { background: stage.color } : undefined}
                      >
                        {isCompleted ? (
                          <Check className="h-4 w-4 stroke-[3]" />
                        ) : (
                          <span>{i + 1}</span>
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-[10px] text-center leading-tight max-w-[52px]",
                          isCurrent ? "font-semibold text-gray-900" : "text-gray-400"
                        )}
                      >
                        {stage.name}
                      </span>
                    </div>

                    {i < stages.length - 1 && (
                      <div
                        className={cn(
                          "h-0.5 w-8 -mt-5 shrink-0",
                          isCompleted ? "bg-emerald-500" : "bg-gray-200"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Checklist */}
        {checklistItems.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-700">
                {client.currentStage?.name} — Checklist
              </p>
              <span className="text-xs text-gray-500">
                {doneCount}/{checklistItems.length} complete
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  doneCount === checklistItems.length ? "bg-emerald-500" : "bg-blue-500"
                )}
                style={{
                  width: `${Math.round((doneCount / checklistItems.length) * 100)}%`,
                }}
              />
            </div>

            <div className="space-y-2">
              {checklistItems.map((item) => (
                <div key={item.id} className="flex items-start gap-2.5">
                  <div
                    className={cn(
                      "mt-0.5 h-4 w-4 rounded border-2 flex items-center justify-center shrink-0",
                      item.completed
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-gray-300"
                    )}
                  >
                    {item.completed && (
                      <Check className="h-2.5 w-2.5 text-white stroke-[3]" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm leading-snug",
                      item.completed ? "text-gray-400 line-through" : "text-gray-700"
                    )}
                  >
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents */}
        {client.documents.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <p className="text-sm font-semibold text-gray-700 mb-4">Documents</p>
            <div className="space-y-1">
              {client.documents.map((doc) => {
                const isImage = doc.mimeType.startsWith("image/");
                const isPdf = doc.mimeType === "application/pdf" || doc.mimeType.includes("word") || doc.mimeType.includes("sheet");
                return (
                  <a
                    key={doc.id}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {isImage ? (
                      <ImageIcon className="h-4 w-4 text-purple-500 shrink-0" />
                    ) : isPdf ? (
                      <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                    ) : (
                      <File className="h-4 w-4 text-gray-400 shrink-0" />
                    )}
                    <span className="text-sm text-gray-700 truncate">{doc.name}</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Activity timeline */}
        {client.activities.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <p className="text-sm font-semibold text-gray-700 mb-4">Recent Updates</p>
            <div className="space-y-3">
              {client.activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="mt-0.5 h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-500">
                    {ACTIVITY_ICONS[activity.type] ?? (
                      <Clock className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">{activity.title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {formatRelativeTime(activity.createdAt.toISOString())}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6">
        <p className="text-xs text-gray-400">
          Powered by{" "}
          <span className="font-medium text-gray-500">Cadence</span>
        </p>
      </footer>
    </div>
  );
}
