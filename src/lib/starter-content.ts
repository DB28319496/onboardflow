// Starter email templates and automation rules seeded into every new workspace

export const STARTER_TEMPLATES = [
  // ── Welcome ────────────────────────────────────────────────────────
  {
    name: "Welcome — New Client",
    type: "WELCOME",
    subject: "Welcome to {{workspace_name}}, {{client_name}}!",
    body: `<p>Hi {{client_name}},</p>
<p>Thank you for choosing <strong>{{workspace_name}}</strong>! We're excited to work with you on your {{project_type}} project.</p>
<p>Here's what happens next:</p>
<ol>
  <li>We'll review the details you submitted</li>
  <li>A team member will reach out within 1 business day</li>
  <li>We'll set up your personalized project timeline</li>
</ol>
<p>In the meantime, you can track your project progress anytime through your <a href="{{portal_url}}">client portal</a>.</p>
<p>If you have any questions, just reply to this email — we're here to help.</p>
<p>Best regards,<br>The {{workspace_name}} Team</p>`,
  },
  {
    name: "Welcome — Portal Access",
    type: "WELCOME",
    subject: "Your client portal is ready — {{workspace_name}}",
    body: `<p>Hi {{client_name}},</p>
<p>Great news — your client portal is now set up and ready for you!</p>
<p><a href="{{portal_url}}" style="display:inline-block;background:#1E3A5F;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;">Open Your Portal</a></p>
<p>Through your portal you can:</p>
<ul>
  <li>Track your project status in real-time</li>
  <li>View and complete your onboarding checklist</li>
  <li>Upload documents securely</li>
  <li>Message our team directly</li>
</ul>
<p>Bookmark the link above for easy access anytime.</p>
<p>Cheers,<br>{{workspace_name}}</p>`,
  },

  // ── Stage Change ───────────────────────────────────────────────────
  {
    name: "Stage Update — Moving Forward",
    type: "STAGE_CHANGE",
    subject: "Project update: You've moved to {{stage_name}}",
    body: `<p>Hi {{client_name}},</p>
<p>Good news — your project has progressed to the <strong>{{stage_name}}</strong> phase!</p>
<p>This means we've completed the previous step and are now focused on what comes next. You can always check the latest status in your <a href="{{portal_url}}">client portal</a>.</p>
<p>If you have any questions about this stage or what to expect, don't hesitate to reach out.</p>
<p>Best,<br>The {{workspace_name}} Team</p>`,
  },
  {
    name: "Stage Update — Review Required",
    type: "STAGE_CHANGE",
    subject: "Action needed: {{stage_name}} — {{workspace_name}}",
    body: `<p>Hi {{client_name}},</p>
<p>Your project has reached the <strong>{{stage_name}}</strong> phase, and we need your input to continue.</p>
<p>Please log into your <a href="{{portal_url}}">client portal</a> to:</p>
<ul>
  <li>Review the deliverables we've prepared</li>
  <li>Complete any outstanding checklist items</li>
  <li>Provide your feedback or approval</li>
</ul>
<p>The sooner we hear back, the sooner we can keep things moving!</p>
<p>Thanks,<br>{{workspace_name}}</p>`,
  },

  // ── Follow-Up ──────────────────────────────────────────────────────
  {
    name: "Follow-Up — Checking In",
    type: "FOLLOW_UP",
    subject: "Checking in on your project — {{workspace_name}}",
    body: `<p>Hi {{client_name}},</p>
<p>Just wanted to check in and see how everything is going. You've been in the <strong>{{stage_name}}</strong> phase for {{days_in_stage}} days now.</p>
<p>Is there anything you need from us? Any questions or concerns we can address?</p>
<p>You can always reach us by replying to this email or through your <a href="{{portal_url}}">client portal</a>.</p>
<p>Looking forward to hearing from you!</p>
<p>Best,<br>{{workspace_name}}</p>`,
  },
  {
    name: "Follow-Up — Waiting on Documents",
    type: "FOLLOW_UP",
    subject: "Friendly reminder: We're waiting on a few items",
    body: `<p>Hi {{client_name}},</p>
<p>We hope everything is going well! We noticed there are a few outstanding items we need from you to keep your project moving forward.</p>
<p>Could you please check your <a href="{{portal_url}}">client portal</a> and:</p>
<ul>
  <li>Upload any requested documents</li>
  <li>Complete the items on your checklist</li>
  <li>Let us know if you need more time or have questions</li>
</ul>
<p>No rush — but the sooner we receive these, the sooner we can proceed to the next step.</p>
<p>Thanks,<br>{{workspace_name}}</p>`,
  },

  // ── Reminder ───────────────────────────────────────────────────────
  {
    name: "Reminder — Overdue Checklist",
    type: "REMINDER",
    subject: "Reminder: Checklist items are waiting — {{workspace_name}}",
    body: `<p>Hi {{client_name}},</p>
<p>This is a friendly reminder that you have pending checklist items in your <a href="{{portal_url}}">client portal</a>.</p>
<p>Completing these items helps us deliver the best results on time. If you're having trouble or need clarification on any item, just reply to this email.</p>
<p>Thanks for your attention to this!</p>
<p>Best regards,<br>{{workspace_name}}</p>`,
  },
  {
    name: "Reminder — Payment Due",
    type: "REMINDER",
    subject: "Payment reminder — {{workspace_name}}",
    body: `<p>Hi {{client_name}},</p>
<p>This is a friendly reminder that your payment for the {{project_type}} project is due.</p>
<p><strong>Project:</strong> {{project_type}}<br>
<strong>Amount:</strong> {{project_value}}</p>
<p>If you've already sent payment, please disregard this message. Otherwise, please arrange payment at your earliest convenience.</p>
<p>If you have any questions about the invoice, feel free to reply to this email.</p>
<p>Thank you,<br>{{workspace_name}}</p>`,
  },

  // ── Custom / Milestone ─────────────────────────────────────────────
  {
    name: "Project Complete — Thank You",
    type: "CUSTOM",
    subject: "Your project is complete! 🎉 — {{workspace_name}}",
    body: `<p>Hi {{client_name}},</p>
<p>We're thrilled to let you know that your <strong>{{project_type}}</strong> project is now complete!</p>
<p>It's been a pleasure working with you. Here's a quick summary:</p>
<ul>
  <li>All deliverables have been finalized</li>
  <li>Final files are available in your <a href="{{portal_url}}">client portal</a></li>
</ul>
<p>We'd love to hear your feedback — it helps us improve and serve you better in the future. If you'd like to work together again, you know where to find us!</p>
<p>Thank you for trusting {{workspace_name}}.</p>
<p>Warm regards,<br>The {{workspace_name}} Team</p>`,
  },
  {
    name: "Re-engagement — Past Client",
    type: "CUSTOM",
    subject: "We'd love to work with you again, {{client_name}}",
    body: `<p>Hi {{client_name}},</p>
<p>It's been a while since we completed your {{project_type}} project, and we wanted to reach out.</p>
<p>We've been working on some exciting new services and would love the opportunity to help you again. Whether it's a new project or an update to your existing one, we're here for you.</p>
<p>Reply to this email or visit our website to get started. We'd love to catch up!</p>
<p>Best wishes,<br>{{workspace_name}}</p>`,
  },
];

export const STARTER_AUTOMATIONS = [
  {
    name: "Welcome email on new client",
    triggerType: "CLIENT_CREATED",
    triggerConfig: JSON.stringify({}),
    actionType: "SEND_EMAIL",
    actionConfig: JSON.stringify({}),
    // Links to template "Welcome — New Client" (matched by name at seed time)
    _templateName: "Welcome — New Client",
  },
  {
    name: "Follow-up after 3 days in any stage",
    triggerType: "TIME_IN_STAGE",
    triggerConfig: JSON.stringify({ days: 3 }),
    actionType: "SEND_EMAIL",
    actionConfig: JSON.stringify({}),
    _templateName: "Follow-Up — Checking In",
  },
  {
    name: "Reminder after 7 days in any stage",
    triggerType: "TIME_IN_STAGE",
    triggerConfig: JSON.stringify({ days: 7 }),
    actionType: "SEND_EMAIL",
    actionConfig: JSON.stringify({}),
    _templateName: "Reminder — Overdue Checklist",
  },
  {
    name: "Weekly AI Summary",
    triggerType: "WEEKLY_SUMMARY",
    triggerConfig: JSON.stringify({}),
    actionType: "AI_SUMMARY",
    actionConfig: JSON.stringify({}),
    _templateName: null,
  },
];
