import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { hash } from "bcryptjs";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function hoursAgo(hours: number): Date {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d;
}

const CHECKLIST_BY_STAGE = {
  "New Lead": JSON.stringify([
    { id: "nl-1", title: "Review lead information", isRequired: true, assignedTo: "team" },
    { id: "nl-2", title: "Qualify project scope", isRequired: true, assignedTo: "team" },
  ]),
  "Intake & Discovery": JSON.stringify([
    { id: "id-1", title: "Complete intake form", isRequired: true, assignedTo: "client" },
    { id: "id-2", title: "Review project photos", isRequired: true, assignedTo: "team" },
    { id: "id-3", title: "Assess project scope", isRequired: true, assignedTo: "team" },
    { id: "id-4", title: "Schedule consultation call", isRequired: true, assignedTo: "team" },
  ]),
  "Consultation": JSON.stringify([
    { id: "co-1", title: "Conduct in-home consultation", isRequired: true, assignedTo: "team" },
    { id: "co-2", title: "Collect measurements & photos", isRequired: true, assignedTo: "team" },
    { id: "co-3", title: "Discuss budget and timeline", isRequired: true, assignedTo: "team" },
    { id: "co-4", title: "Identify material preferences", isRequired: false, assignedTo: "client" },
  ]),
  "Proposal Sent": JSON.stringify([
    { id: "ps-1", title: "Prepare detailed proposal", isRequired: true, assignedTo: "team" },
    { id: "ps-2", title: "Send proposal to client", isRequired: true, assignedTo: "team" },
    { id: "ps-3", title: "Confirm client received proposal", isRequired: false, assignedTo: "team" },
  ]),
  "Proposal Review": JSON.stringify([
    { id: "pr-1", title: "Client reviews proposal", isRequired: true, assignedTo: "client" },
    { id: "pr-2", title: "Answer client questions", isRequired: false, assignedTo: "team" },
    { id: "pr-3", title: "Negotiate scope if needed", isRequired: false, assignedTo: "team" },
  ]),
  "Contract Signed": JSON.stringify([
    { id: "cs-1", title: "Finalize contract details", isRequired: true, assignedTo: "team" },
    { id: "cs-2", title: "Client signs contract", isRequired: true, assignedTo: "client" },
    { id: "cs-3", title: "Collect initial deposit", isRequired: true, assignedTo: "team" },
    { id: "cs-4", title: "Send welcome packet to client", isRequired: true, assignedTo: "team" },
  ]),
  "Pre-Project Prep": JSON.stringify([
    { id: "pp-1", title: "Order materials and supplies", isRequired: true, assignedTo: "team" },
    { id: "pp-2", title: "Schedule subcontractors", isRequired: true, assignedTo: "team" },
    { id: "pp-3", title: "Obtain permits if required", isRequired: true, assignedTo: "team" },
    { id: "pp-4", title: "Client completes pre-project checklist", isRequired: true, assignedTo: "client" },
    { id: "pp-5", title: "Confirm project start date", isRequired: true, assignedTo: "team" },
  ]),
  "Project Kickoff": JSON.stringify([
    { id: "pk-1", title: "Pre-construction walkthrough", isRequired: true, assignedTo: "team" },
    { id: "pk-2", title: "Client signs off on final plans", isRequired: true, assignedTo: "client" },
    { id: "pk-3", title: "Project officially begins", isRequired: true, assignedTo: "team" },
  ]),
};

async function main() {
  console.log("🌱 Seeding database...");

  // ==================== WORKSPACE & USER ====================
  const passwordHash = await hash("password123", 12);

  const user = await prisma.user.create({
    data: {
      name: "Alex Johnson",
      email: "alex@summitremodeling.com",
      passwordHash,
    },
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: "Summit Remodeling",
      slug: "summit-remodeling",
      brandColor: "#1E3A5F",
      secondaryColor: "#4F8FD6",
      emailFromName: "Summit Remodeling",
      emailReplyTo: "hello@summitremodeling.com",
      portalEnabled: true,
    },
  });

  await prisma.workspaceMember.create({
    data: { userId: user.id, workspaceId: workspace.id, role: "OWNER" },
  });

  console.log("✅ Workspace and user created");

  // ==================== PIPELINE & STAGES ====================
  const pipeline = await prisma.pipeline.create({
    data: {
      name: "Client Journey",
      description: "Complete onboarding pipeline from lead to project kickoff",
      isDefault: true,
      isActive: true,
      workspaceId: workspace.id,
    },
  });

  const stageData = [
    { name: "New Lead", color: "#6366F1", daysExpected: 2, order: 0 },
    { name: "Intake & Discovery", color: "#8B5CF6", daysExpected: 3, order: 1 },
    { name: "Consultation", color: "#3B82F6", daysExpected: 5, order: 2 },
    { name: "Proposal Sent", color: "#F59E0B", daysExpected: 3, order: 3 },
    { name: "Proposal Review", color: "#F97316", daysExpected: 7, order: 4 },
    { name: "Contract Signed", color: "#10B981", daysExpected: 2, order: 5 },
    { name: "Pre-Project Prep", color: "#14B8A6", daysExpected: 14, order: 6 },
    { name: "Project Kickoff", color: "#06B6D4", daysExpected: 1, order: 7 },
  ];

  const stages: Array<{ id: string; name: string; daysExpected: number | null; order: number }> = [];
  for (const s of stageData) {
    const stage = await prisma.stage.create({
      data: {
        ...s,
        pipelineId: pipeline.id,
        checklist: CHECKLIST_BY_STAGE[s.name as keyof typeof CHECKLIST_BY_STAGE] ?? null,
        description: `Clients in the ${s.name} stage`,
      },
    });
    stages.push(stage);
  }

  console.log("✅ Pipeline and 8 stages created");

  // ==================== CLIENTS ====================
  const projectTypes = [
    "Kitchen Remodel",
    "Bathroom Addition",
    "Whole House Renovation",
    "Deck Build",
    "Basement Finishing",
    "ADU Construction",
    "Master Bath Remodel",
    "Home Office Addition",
  ];

  const clientsData = [
    // New Lead (5)
    { name: "Marcus & Linda Chen", email: "mchen@email.com", phone: "555-0101", projectType: "Kitchen Remodel", projectValue: 45000, stageIdx: 0, daysInStage: 1 },
    { name: "Darnell Williams", email: "dwilliams@email.com", phone: "555-0102", projectType: "Bathroom Addition", projectValue: 28000, stageIdx: 0, daysInStage: 2 },
    { name: "The Peterson Family", email: "petersons@email.com", phone: "555-0103", projectType: "Deck Build", projectValue: 18500, stageIdx: 0, daysInStage: 1 },
    { name: "Roberto Sanchez", email: "rsanchez@email.com", phone: "555-0104", projectType: "Basement Finishing", projectValue: 55000, stageIdx: 0, daysInStage: 3, overdue: true },
    { name: "Amanda Kowalski", email: "akowalski@email.com", phone: "555-0105", projectType: "Home Office Addition", projectValue: 22000, stageIdx: 0, daysInStage: 1 },
    // Intake & Discovery (3)
    { name: "Thomas & Grace Murphy", email: "tmurphy@email.com", phone: "555-0201", projectType: "Whole House Renovation", projectValue: 185000, stageIdx: 1, daysInStage: 2 },
    { name: "Keisha Robinson", email: "krobinson@email.com", phone: "555-0202", projectType: "Kitchen Remodel", projectValue: 67000, stageIdx: 1, daysInStage: 5, overdue: true },
    { name: "James Okonkwo", email: "jokonkwo@email.com", phone: "555-0203", projectType: "ADU Construction", projectValue: 150000, stageIdx: 1, daysInStage: 1 },
    // Consultation (3)
    { name: "Priya & Raj Patel", email: "rpatel@email.com", phone: "555-0301", projectType: "Master Bath Remodel", projectValue: 38000, stageIdx: 2, daysInStage: 3 },
    { name: "Christopher Blake", email: "cblake@email.com", phone: "555-0302", projectType: "Deck Build", projectValue: 32000, stageIdx: 2, daysInStage: 8, overdue: true },
    { name: "Nicole & David Thornton", email: "nthornton@email.com", phone: "555-0303", projectType: "Basement Finishing", projectValue: 72000, stageIdx: 2, daysInStage: 4 },
    // Proposal Sent (2)
    { name: "Susan Kim", email: "skim@email.com", phone: "555-0401", projectType: "Kitchen Remodel", projectValue: 89000, stageIdx: 3, daysInStage: 2 },
    { name: "Michael Andersen", email: "mandersen@email.com", phone: "555-0402", projectType: "Whole House Renovation", projectValue: 220000, stageIdx: 3, daysInStage: 1 },
    // Proposal Review (2)
    { name: "The Harrison Family", email: "harrisons@email.com", phone: "555-0501", projectType: "ADU Construction", projectValue: 175000, stageIdx: 4, daysInStage: 10, overdue: true },
    { name: "Elena Vasquez", email: "evasquez@email.com", phone: "555-0502", projectType: "Kitchen Remodel", projectValue: 52000, stageIdx: 4, daysInStage: 5 },
    // Contract Signed (2)
    { name: "Robert Fitzpatrick", email: "rfitz@email.com", phone: "555-0601", projectType: "Master Bath Remodel", projectValue: 48000, stageIdx: 5, daysInStage: 1 },
    { name: "Diana & Steven Park", email: "dpark@email.com", phone: "555-0602", projectType: "Bathroom Addition", projectValue: 35000, stageIdx: 5, daysInStage: 2 },
    // Pre-Project Prep (1)
    { name: "George & Mary Wallace", email: "gwallace@email.com", phone: "555-0701", projectType: "Whole House Renovation", projectValue: 250000, stageIdx: 6, daysInStage: 11 },
    // Project Kickoff (1)
    { name: "The Nguyen Family", email: "nguyens@email.com", phone: "555-0801", projectType: "Kitchen Remodel", projectValue: 78000, stageIdx: 7, daysInStage: 1 },
  ] as const;

  const clients: Array<{ id: string; name: string; stageIdx: number }> = [];
  for (const c of clientsData) {
    const stage = stages[c.stageIdx];
    const stageEnteredAt = daysAgo(c.daysInStage);
    const sourceOptions = ["MANUAL", "WEBSITE", "REFERRAL", "ADVERTISING"] as const;
    const source = sourceOptions[Math.floor(Math.random() * sourceOptions.length)];

    const client = await prisma.client.create({
      data: {
        name: c.name,
        email: c.email,
        phone: c.phone,
        projectType: c.projectType,
        projectValue: c.projectValue,
        source,
        status: "ACTIVE",
        workspaceId: workspace.id,
        pipelineId: pipeline.id,
        currentStageId: stage.id,
        stageEnteredAt,
        assignedToId: user.id,
        portalToken: `portal-${Math.random().toString(36).slice(2, 12)}`,
      },
    });
    clients.push({ id: client.id, name: c.name, stageIdx: c.stageIdx });

    // CLIENT_CREATED activity
    await prisma.activity.create({
      data: {
        type: "CLIENT_CREATED",
        title: "Client added to pipeline",
        description: `${c.name} was added as a new lead`,
        clientId: client.id,
        userId: user.id,
        createdAt: daysAgo(c.daysInStage + c.stageIdx + 2),
      },
    });

    // STAGE_CHANGE activities for previous stages
    for (let i = 0; i < c.stageIdx; i++) {
      await prisma.activity.create({
        data: {
          type: "STAGE_CHANGE",
          title: `Moved to ${stages[i + 1].name}`,
          description: `Client advanced from ${stages[i].name} to ${stages[i + 1].name}`,
          clientId: client.id,
          userId: user.id,
          createdAt: daysAgo(c.daysInStage + (c.stageIdx - i) * 2),
        },
      });
    }

    // Add some notes for later-stage clients
    if (c.stageIdx >= 3) {
      await prisma.activity.create({
        data: {
          type: "NOTE_ADDED",
          title: "Note added",
          description: "Client is very motivated to start. Prefers natural materials and open layouts.",
          clientId: client.id,
          userId: user.id,
          createdAt: hoursAgo(6 + c.stageIdx * 12),
        },
      });
    }
  }

  console.log("✅ 19 clients created with activities");

  // ==================== EMAIL TEMPLATES ====================
  const templateMergeNote = "Supports merge fields: {{client_name}}, {{current_stage}}, {{portal_link}}, {{assigned_team_member}}, {{project_type}}, {{company_name}}";

  const emailTemplates = [
    {
      name: "Welcome Email",
      subject: "Welcome to {{company_name}}, {{client_name}}!",
      type: "WELCOME",
      body: `<h2>Welcome, {{client_name}}!</h2>
<p>We're thrilled to be working with you on your {{project_type}} project. My name is {{assigned_team_member}} and I'll be your dedicated project coordinator throughout this journey.</p>
<p>We've created a personalized portal where you can track your project's progress, complete checklist items, and upload documents. You can access it anytime at the link below:</p>
<p><a href="{{portal_link}}" style="background:#1E3A5F;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">View Your Project Portal →</a></p>
<p>Our next step is to complete your intake form. You'll hear from us within 24 hours to schedule your discovery call.</p>
<p>Warm regards,<br/>{{assigned_team_member}}<br/>{{company_name}}</p>`,
    },
    {
      name: "Intake Form Request",
      subject: "Action required: Complete your intake form — {{company_name}}",
      type: "STAGE_CHANGE",
      body: `<h2>Hi {{client_name}},</h2>
<p>To help us prepare for your {{project_type}} consultation, please complete the intake form linked in your client portal. It only takes about 5 minutes.</p>
<p>We'll also need a few photos of the space — don't worry about making it look perfect, we just want to see the current condition!</p>
<p><a href="{{portal_link}}">Complete your intake form →</a></p>
<p>Best,<br/>{{assigned_team_member}}</p>`,
    },
    {
      name: "Consultation Prep Guide",
      subject: "Preparing for your consultation — {{company_name}}",
      type: "STAGE_CHANGE",
      body: `<h2>Your consultation is coming up, {{client_name}}!</h2>
<p>We're looking forward to meeting with you about your {{project_type}} project. To make the most of our time together, here's what to prepare:</p>
<ul>
<li>Any inspiration photos (Pinterest boards, magazine clippings, etc.)</li>
<li>Your wish list — must-haves vs. nice-to-haves</li>
<li>Any concerns about the current space</li>
<li>A rough budget range you're comfortable with</li>
</ul>
<p>See you soon!<br/>{{assigned_team_member}}</p>`,
    },
    {
      name: "Proposal Delivery",
      subject: "Your project proposal is ready — {{company_name}}",
      type: "STAGE_CHANGE",
      body: `<h2>Your proposal is ready, {{client_name}}!</h2>
<p>We've put together a detailed proposal for your {{project_type}} based on everything we discussed during our consultation. You can view it in your client portal.</p>
<p><a href="{{portal_link}}">Review your proposal →</a></p>
<p>The proposal includes a full scope of work, material selections, project timeline, and investment summary. Please review it carefully and let us know if you have any questions.</p>
<p>We're excited to bring your vision to life!<br/>{{assigned_team_member}}</p>`,
    },
    {
      name: "Proposal Follow-Up (3 Day)",
      subject: "Quick check-in on your proposal — {{company_name}}",
      type: "FOLLOW_UP",
      body: `<h2>Hi {{client_name}},</h2>
<p>Just checking in — it's been a few days since we sent your {{project_type}} proposal. We know it's a big decision and want to make sure you have everything you need to feel confident moving forward.</p>
<p>If you have any questions about the scope, timeline, or investment, please reply to this email or call us directly. We're happy to walk through the details together.</p>
<p>Your proposal is also available anytime in your client portal: <a href="{{portal_link}}">View proposal →</a></p>
<p>Best,<br/>{{assigned_team_member}}</p>`,
    },
    {
      name: "Proposal Follow-Up (7 Day)",
      subject: "We'd love to move forward — {{company_name}}",
      type: "FOLLOW_UP",
      body: `<h2>Hi {{client_name}},</h2>
<p>We noticed your proposal has been under review for about a week. Our calendars fill up quickly and we want to ensure we can accommodate your {{project_type}} in our upcoming schedule.</p>
<p>If there are concerns about any aspect of the proposal — scope, timeline, or budget — we'd welcome a conversation to explore options. Sometimes a small adjustment can make a big difference.</p>
<p>Please don't hesitate to reach out. We're committed to finding a solution that works for you.</p>
<p>Warmly,<br/>{{assigned_team_member}}<br/>{{company_name}}</p>`,
    },
    {
      name: "Contract Welcome Packet",
      subject: "You're officially on the calendar! — {{company_name}}",
      type: "STAGE_CHANGE",
      body: `<h2>Congratulations, {{client_name}}! Your {{project_type}} project is officially on!</h2>
<p>We're so excited to begin this journey with you. Here's what happens next:</p>
<ol>
<li><strong>Pre-Project Checklist:</strong> We'll share a checklist of items to prepare before we break ground. You can complete these through your client portal.</li>
<li><strong>Materials & Permits:</strong> Our team will begin ordering materials and securing any required permits. This typically takes 2–4 weeks.</li>
<li><strong>Project Start Date:</strong> We'll confirm your official start date once materials are secured.</li>
</ol>
<p>Access your portal anytime to track progress: <a href="{{portal_link}}">Your Client Portal →</a></p>
<p>Here's to a beautiful new space!<br/>{{assigned_team_member}}<br/>{{company_name}}</p>`,
    },
  ];

  const createdTemplates: Array<{ id: string; name: string }> = [];
  for (const t of emailTemplates) {
    const template = await prisma.emailTemplate.create({
      data: {
        ...t,
        isActive: true,
        workspaceId: workspace.id,
      },
    });
    createdTemplates.push({ id: template.id, name: t.name });
  }

  console.log("✅ 7 email templates created");

  // ==================== AUTOMATION RULES ====================
  const stageByName = Object.fromEntries(stages.map((s) => [s.name, s]));

  const automationRules = [
    {
      name: "Welcome Email on Client Creation",
      triggerType: "CLIENT_CREATED",
      triggerConfig: JSON.stringify({}),
      actionType: "SEND_EMAIL",
      actionConfig: JSON.stringify({ templateId: createdTemplates[0].id }),
      templateId: createdTemplates[0].id,
    },
    {
      name: "Intake Form Request on Stage Entry",
      triggerType: "STAGE_ENTRY",
      triggerConfig: JSON.stringify({ stageId: stageByName["Intake & Discovery"].id }),
      actionType: "SEND_EMAIL",
      actionConfig: JSON.stringify({ templateId: createdTemplates[1].id }),
      stageId: stageByName["Intake & Discovery"].id,
      templateId: createdTemplates[1].id,
    },
    {
      name: "Consultation Prep Guide on Stage Entry",
      triggerType: "STAGE_ENTRY",
      triggerConfig: JSON.stringify({ stageId: stageByName["Consultation"].id }),
      actionType: "SEND_EMAIL",
      actionConfig: JSON.stringify({ templateId: createdTemplates[2].id }),
      stageId: stageByName["Consultation"].id,
      templateId: createdTemplates[2].id,
    },
    {
      name: "Proposal Delivery on Stage Entry",
      triggerType: "STAGE_ENTRY",
      triggerConfig: JSON.stringify({ stageId: stageByName["Proposal Sent"].id }),
      actionType: "SEND_EMAIL",
      actionConfig: JSON.stringify({ templateId: createdTemplates[3].id }),
      stageId: stageByName["Proposal Sent"].id,
      templateId: createdTemplates[3].id,
    },
    {
      name: "3-Day Follow-Up in Proposal Review",
      triggerType: "TIME_IN_STAGE",
      triggerConfig: JSON.stringify({ stageId: stageByName["Proposal Review"].id, days: 3 }),
      actionType: "SEND_EMAIL",
      actionConfig: JSON.stringify({ templateId: createdTemplates[4].id }),
      stageId: stageByName["Proposal Review"].id,
      templateId: createdTemplates[4].id,
    },
    {
      name: "7-Day Follow-Up in Proposal Review",
      triggerType: "TIME_IN_STAGE",
      triggerConfig: JSON.stringify({ stageId: stageByName["Proposal Review"].id, days: 7 }),
      actionType: "SEND_EMAIL",
      actionConfig: JSON.stringify({ templateId: createdTemplates[5].id }),
      stageId: stageByName["Proposal Review"].id,
      templateId: createdTemplates[5].id,
    },
    {
      name: "Contract Welcome Packet on Stage Entry",
      triggerType: "STAGE_ENTRY",
      triggerConfig: JSON.stringify({ stageId: stageByName["Contract Signed"].id }),
      actionType: "SEND_EMAIL",
      actionConfig: JSON.stringify({ templateId: createdTemplates[6].id }),
      stageId: stageByName["Contract Signed"].id,
      templateId: createdTemplates[6].id,
    },
  ];

  for (const rule of automationRules) {
    await prisma.automationRule.create({
      data: {
        ...rule,
        isActive: true,
        workspaceId: workspace.id,
      },
    });
  }

  console.log("✅ 7 automation rules created");

  // ==================== SAMPLE EMAIL LOGS ====================
  // Add email logs for clients who passed through earlier stages
  const laterStageClients = clients.filter((c) => c.stageIdx >= 2);
  for (const c of laterStageClients.slice(0, 8)) {
    await prisma.emailLog.create({
      data: {
        subject: "Welcome to Summit Remodeling!",
        body: `<p>Welcome email sent to ${c.name}</p>`,
        status: "DELIVERED",
        clientId: c.id,
        templateId: createdTemplates[0].id,
        sentAt: daysAgo(10 + c.stageIdx),
      },
    });
  }

  console.log("✅ Sample email logs created");
  console.log("\n🎉 Seed complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Login: alex@summitremodeling.com");
  console.log("Password: password123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
