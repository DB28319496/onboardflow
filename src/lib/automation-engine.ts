import { prisma } from "@/lib/prisma";
import { applyMergeFields, sendEmail, MergeFields } from "@/lib/email";
import { formatCurrency } from "@/lib/utils";

type TriggerEvent =
  | { type: "CLIENT_CREATED" }
  | { type: "STAGE_ENTRY"; stageId: string }
  | { type: "TIME_IN_STAGE"; stageId: string; daysInStage: number };

type ClientForAutomation = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  projectType: string | null;
  projectValue: number | null;
};

type WorkspaceForAutomation = {
  id: string;
  name: string;
  emailFromName: string | null;
  emailReplyTo: string | null;
};

export async function fireAutomations(
  event: TriggerEvent,
  client: ClientForAutomation,
  workspace: WorkspaceForAutomation,
  stageName?: string
) {
  if (!client.email) return; // nothing to do without an email address

  const rules = await prisma.automationRule.findMany({
    where: { workspaceId: workspace.id, isActive: true, triggerType: event.type },
    include: { template: true },
  });

  for (const rule of rules) {
    if (!rule.template) continue;

    // Match trigger config
    try {
      const config: Record<string, unknown> = JSON.parse(rule.triggerConfig || "{}");

      if (event.type === "STAGE_ENTRY") {
        if (config.stageId && config.stageId !== event.stageId) continue;
      }

      if (event.type === "TIME_IN_STAGE") {
        if (config.stageId && config.stageId !== event.stageId) continue;
        if (config.days && Number(config.days) !== event.daysInStage) continue;
      }
    } catch {
      continue;
    }

    const mergeFields: MergeFields = {
      client_name: client.name,
      client_email: client.email ?? undefined,
      client_phone: client.phone ?? undefined,
      project_type: client.projectType ?? undefined,
      project_value: client.projectValue ? formatCurrency(client.projectValue) : undefined,
      stage_name: stageName ?? undefined,
      workspace_name: workspace.name,
    };

    const subject = applyMergeFields(rule.template.subject, mergeFields);
    const html = applyMergeFields(rule.template.body, mergeFields);

    const result = await sendEmail({
      to: client.email,
      subject,
      html,
      fromName: workspace.emailFromName ?? workspace.name,
      replyTo: workspace.emailReplyTo ?? undefined,
    });

    await prisma.emailLog.create({
      data: {
        subject,
        body: html,
        status: result.success ? "SENT" : "FAILED",
        clientId: client.id,
        templateId: rule.template.id,
        automationRuleId: rule.id,
      },
    });

    await prisma.activity.create({
      data: {
        type: "EMAIL_SENT",
        title: `Email sent: ${rule.template.name}`,
        description: `To: ${client.email}`,
        clientId: client.id,
      },
    });
  }
}
