/**
 * Starter Templates Script
 * Adds a library of email templates to an existing workspace.
 *
 * Usage:
 *   pnpm starter-templates <workspace-slug>
 *
 * Example:
 *   pnpm starter-templates my-agency
 */

import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Template definitions
// Each template uses only supported merge fields:
//   {{client_name}}  {{client_email}}  {{client_phone}}
//   {{project_type}} {{project_value}} {{stage_name}} {{workspace_name}}
// ---------------------------------------------------------------------------

const templates = [
  // ─── UNIVERSAL (works for any service business) ───────────────────────────

  {
    name: "🎉 New Inquiry — Welcome",
    type: "WELCOME",
    subject: "We received your inquiry — {{workspace_name}}",
    body: `<h2>Hi {{client_name}},</h2>
<p>Thanks for reaching out to {{workspace_name}}! We've received your inquiry about your <strong>{{project_type}}</strong> and we're excited to learn more.</p>
<p>Here's what happens next:</p>
<ol>
  <li>We'll review your project details within 1 business day.</li>
  <li>Someone from our team will reach out to schedule a discovery call.</li>
  <li>We'll follow up with a tailored proposal based on your needs.</li>
</ol>
<p>In the meantime, feel free to reply to this email with any questions.</p>
<p>Talk soon,<br/>{{workspace_name}}</p>`,
  },

  {
    name: "📞 Discovery Call — Confirmation",
    type: "STAGE_CHANGE",
    subject: "Your discovery call is confirmed — {{workspace_name}}",
    body: `<h2>Hi {{client_name}},</h2>
<p>Great news — your discovery call with {{workspace_name}} is confirmed. We'll be discussing your <strong>{{project_type}}</strong> project and getting aligned on your goals, timeline, and budget.</p>
<p><strong>To make the most of our time together, please come prepared with:</strong></p>
<ul>
  <li>A summary of what you're trying to achieve</li>
  <li>Any examples, inspiration, or references you love</li>
  <li>A rough budget range you're comfortable with</li>
  <li>Your ideal timeline or any hard deadlines</li>
</ul>
<p>Looking forward to it!<br/>{{workspace_name}}</p>`,
  },

  {
    name: "📄 Proposal — Ready for Review",
    type: "STAGE_CHANGE",
    subject: "Your proposal is ready — {{workspace_name}}",
    body: `<h2>Hi {{client_name}},</h2>
<p>Your custom proposal for your <strong>{{project_type}}</strong> project is ready for review.</p>
<p>The proposal outlines:</p>
<ul>
  <li>Full scope of work</li>
  <li>Project timeline and milestones</li>
  <li>Investment breakdown</li>
  <li>Next steps if you'd like to move forward</li>
</ul>
<p>Take your time reviewing it. If anything is unclear or you'd like to adjust the scope, just reply to this email — we're happy to walk through it together.</p>
<p>Best,<br/>{{workspace_name}}</p>`,
  },

  {
    name: "⏰ Proposal Follow-Up — 3 Days",
    type: "FOLLOW_UP",
    subject: "Checking in on your proposal — {{workspace_name}}",
    body: `<h2>Hi {{client_name}},</h2>
<p>Just following up on the proposal we sent for your <strong>{{project_type}}</strong> project. We know it's a big decision and we want to make sure you have everything you need.</p>
<p>Have questions about the scope, timeline, or investment? We're happy to jump on a quick call to walk through anything.</p>
<p>Simply reply to this email or reach out directly. We're here to help.</p>
<p>Best,<br/>{{workspace_name}}</p>`,
  },

  {
    name: "⏰ Proposal Follow-Up — 7 Days",
    type: "FOLLOW_UP",
    subject: "One last follow-up on your proposal — {{workspace_name}}",
    body: `<h2>Hi {{client_name}},</h2>
<p>We wanted to check in one more time regarding the proposal for your <strong>{{project_type}}</strong> project. Our schedule fills up quickly, and we want to make sure we can accommodate your project if you'd like to move forward.</p>
<p>If now isn't the right time, no worries at all — just let us know and we can reconnect when you're ready.</p>
<p>If there are concerns we haven't addressed, we'd love a chance to talk through them.</p>
<p>Warmly,<br/>{{workspace_name}}</p>`,
  },

  {
    name: "✅ Contract Signed — Project Kickoff",
    type: "STAGE_CHANGE",
    subject: "We're officially getting started — {{workspace_name}}",
    body: `<h2>Welcome aboard, {{client_name}}!</h2>
<p>Your <strong>{{project_type}}</strong> project is officially underway. We're thrilled to be working with you and committed to delivering an exceptional result.</p>
<p><strong>What to expect from here:</strong></p>
<ol>
  <li>We'll send a kickoff questionnaire to gather any final details we need.</li>
  <li>You'll receive regular updates as we hit key milestones.</li>
  <li>You'll have a dedicated point of contact throughout the project.</li>
</ol>
<p>If you ever have questions or feedback along the way, don't hesitate to reach out. Open communication makes for the best projects.</p>
<p>Let's build something great,<br/>{{workspace_name}}</p>`,
  },

  {
    name: "🔍 Deliverable — Ready for Review",
    type: "STAGE_CHANGE",
    subject: "Your {{project_type}} deliverable is ready for review — {{workspace_name}}",
    body: `<h2>Hi {{client_name}},</h2>
<p>We've completed the latest milestone on your <strong>{{project_type}}</strong> project and it's ready for your review.</p>
<p><strong>What we need from you:</strong></p>
<ul>
  <li>Review the deliverable thoroughly</li>
  <li>Note any changes or feedback using specific, actionable language (e.g. "Change the headline font to bold" rather than "Make it pop more")</li>
  <li>Reply with your feedback within 3 business days so we can keep the project on schedule</li>
</ul>
<p>We're proud of how this is shaping up and can't wait to hear your thoughts.</p>
<p>Best,<br/>{{workspace_name}}</p>`,
  },

  {
    name: "🚀 Project Complete — Launch",
    type: "STAGE_CHANGE",
    subject: "You're live! — {{workspace_name}}",
    body: `<h2>Congratulations, {{client_name}}! 🎉</h2>
<p>Your <strong>{{project_type}}</strong> project is officially complete and live. It's been a pleasure working with you to bring this to life.</p>
<p><strong>A few things to keep in mind going forward:</strong></p>
<ul>
  <li>Save any login credentials or access links in a secure place</li>
  <li>Reach out if you notice anything that needs attention in the first 30 days</li>
  <li>We offer ongoing support and maintenance packages if you ever need them</li>
</ul>
<p>We'd truly appreciate a review or referral if you enjoyed working with us. Word of mouth means the world to small teams like ours.</p>
<p>Thanks again,<br/>{{workspace_name}}</p>`,
  },

  {
    name: "💬 Post-Project Check-In (30 Days)",
    type: "FOLLOW_UP",
    subject: "How's everything going? — {{workspace_name}}",
    body: `<h2>Hi {{client_name}},</h2>
<p>It's been about a month since we wrapped up your <strong>{{project_type}}</strong> project, and we wanted to check in to see how things are going.</p>
<ul>
  <li>Is everything working as expected?</li>
  <li>Any questions that have come up since launch?</li>
  <li>Anything you'd like to add or improve?</li>
</ul>
<p>We're here if you need anything. And if you know anyone who could use our help, we'd love a warm introduction.</p>
<p>Best,<br/>{{workspace_name}}</p>`,
  },

  // ─── WEB / APP DEVELOPMENT ───────────────────────────────────────────────

  {
    name: "🖥️ [Web] Kickoff Questionnaire",
    type: "STAGE_CHANGE",
    subject: "Kickoff questionnaire for your {{project_type}} — {{workspace_name}}",
    body: `<h2>Hi {{client_name}},</h2>
<p>We're kicking off your <strong>{{project_type}}</strong> project and want to make sure we have everything we need before we dive in.</p>
<p>Please reply to this email with the following:</p>
<ol>
  <li><strong>Brand assets:</strong> Logo files (SVG/PNG), brand colors (hex codes), fonts if applicable</li>
  <li><strong>Login credentials:</strong> Domain registrar, current hosting (if applicable)</li>
  <li><strong>Content:</strong> Copy/text for pages, images, team bios, etc.</li>
  <li><strong>Integrations:</strong> Any third-party tools you use (CRM, booking system, analytics, etc.)</li>
  <li><strong>Competitors / inspiration:</strong> 2–3 sites you admire and why</li>
</ol>
<p>The faster we get these, the faster we can get started. No rush — take the time you need to gather everything properly.</p>
<p>Let's build something great,<br/>{{workspace_name}}</p>`,
  },

  {
    name: "🖥️ [Web] Staging Environment Ready",
    type: "STAGE_CHANGE",
    subject: "Your staging site is ready for review — {{workspace_name}}",
    body: `<h2>Hi {{client_name}},</h2>
<p>Your <strong>{{project_type}}</strong> is ready for review on our staging environment. This is where you can click through everything before we go live.</p>
<p><strong>How to review:</strong></p>
<ul>
  <li>Click through every page and test all links</li>
  <li>Test on both desktop and your phone</li>
  <li>Fill out any forms to make sure they work</li>
  <li>Check that all content is accurate</li>
</ul>
<p><strong>How to submit feedback:</strong><br/>
Reply to this email with a numbered list of changes. Be as specific as possible (e.g. "On the About page, paragraph 2, change 'we build' to 'we craft'").</p>
<p>We allow up to 2 rounds of revisions as outlined in our agreement. Please consolidate all feedback into a single response.</p>
<p>Looking forward to your thoughts,<br/>{{workspace_name}}</p>`,
  },

  {
    name: "📱 [App] TestFlight / Beta Ready",
    type: "STAGE_CHANGE",
    subject: "Your app is ready for beta testing — {{workspace_name}}",
    body: `<h2>Hi {{client_name}},</h2>
<p>Your <strong>{{project_type}}</strong> is now available for beta testing via TestFlight. This is your chance to test the app on a real device before we submit to the App Store.</p>
<p><strong>Getting started:</strong></p>
<ol>
  <li>Check your email for a TestFlight invitation from Apple</li>
  <li>Download the TestFlight app from the App Store if you haven't already</li>
  <li>Accept the invitation and install your app</li>
</ol>
<p><strong>What to test:</strong></p>
<ul>
  <li>Go through every screen and user flow</li>
  <li>Try edge cases — empty states, error messages, network issues</li>
  <li>Test on multiple devices if possible</li>
  <li>Note anything that feels off, confusing, or broken</li>
</ul>
<p>Please compile all feedback and send it to us within 5 business days. We'll address it in a final revision before App Store submission.</p>
<p>Exciting times ahead,<br/>{{workspace_name}}</p>`,
  },

  {
    name: "📱 [App] Submitted to App Store Review",
    type: "STAGE_CHANGE",
    subject: "Your app has been submitted to the App Store — {{workspace_name}}",
    body: `<h2>Hi {{client_name}},</h2>
<p>We've officially submitted your <strong>{{project_type}}</strong> to Apple for App Store review. 🎉</p>
<p><strong>What happens now:</strong></p>
<ul>
  <li>Apple's review process typically takes <strong>24–72 hours</strong>, though it can occasionally take longer</li>
  <li>You'll receive an email from Apple when the review is complete</li>
  <li>If Apple requests any changes, we'll handle them promptly at no extra charge</li>
  <li>Once approved, the app will be live on the App Store within a few hours</li>
</ul>
<p>We'll keep you posted the moment it's approved. This is an exciting milestone — well done for getting here!</p>
<p>Almost there,<br/>{{workspace_name}}</p>`,
  },

  {
    name: "📱 [App] Live on App Store",
    type: "STAGE_CHANGE",
    subject: "Your app is live on the App Store! — {{workspace_name}}",
    body: `<h2>Your app is live, {{client_name}}! 🚀</h2>
<p>Your <strong>{{project_type}}</strong> is officially available on the App Store. This is a huge milestone and we're proud to have been part of making it happen.</p>
<p><strong>Next steps to drive downloads:</strong></p>
<ul>
  <li>Share your App Store link across your social channels</li>
  <li>Ask friends, family, and early users to download and leave a review — early reviews significantly boost visibility</li>
  <li>Add the App Store badge to your website</li>
  <li>Consider a small launch promotion or press release</li>
</ul>
<p><strong>Ongoing support:</strong><br/>
If you encounter any bugs or need updates after launch, we're available for ongoing maintenance. Reach out anytime.</p>
<p>Congratulations — you shipped it,<br/>{{workspace_name}}</p>`,
  },

  // ─── GENERAL SERVICE BUSINESS ────────────────────────────────────────────

  {
    name: "📋 Onboarding — Questionnaire",
    type: "STAGE_CHANGE",
    subject: "A few questions before we get started — {{workspace_name}}",
    body: `<h2>Hi {{client_name}},</h2>
<p>We're looking forward to getting started on your <strong>{{project_type}}</strong> project. Before we dive in, we'd like to understand your goals a bit better.</p>
<p>Please reply with answers to the following:</p>
<ol>
  <li>What does success look like for this project? How will you measure it?</li>
  <li>Who is the primary audience or end user?</li>
  <li>Are there any constraints we should know about (technical, brand, regulatory)?</li>
  <li>Who on your team should we coordinate with day-to-day?</li>
  <li>Is there anything that didn't work well in past projects like this?</li>
</ol>
<p>There are no wrong answers — the more context you give us, the better the outcome.</p>
<p>Best,<br/>{{workspace_name}}</p>`,
  },

  {
    name: "🔄 Project Update — Milestone Reached",
    type: "STAGE_CHANGE",
    subject: "Project update: {{stage_name}} — {{workspace_name}}",
    body: `<h2>Hi {{client_name}},</h2>
<p>We have a quick update on your <strong>{{project_type}}</strong> project. We've reached the <strong>{{stage_name}}</strong> milestone and wanted to keep you in the loop.</p>
<p>Things are progressing well. Here's a quick summary of where we are and what's coming next.</p>
<p>If you have any questions or need to discuss anything, just reply to this email — we're always happy to connect.</p>
<p>Best,<br/>{{workspace_name}}</p>`,
  },

  {
    name: "⭐ Review Request",
    type: "FOLLOW_UP",
    subject: "Would you share your experience? — {{workspace_name}}",
    body: `<h2>Hi {{client_name}},</h2>
<p>Now that your <strong>{{project_type}}</strong> project is complete, we'd love to hear about your experience working with {{workspace_name}}.</p>
<p>If you're happy with how things went, a short review would mean a tremendous amount to our team. It helps other clients find us and helps us continue to grow.</p>
<p>Even a sentence or two goes a long way. Thank you so much for your trust in us — it was a genuine pleasure working with you.</p>
<p>With gratitude,<br/>{{workspace_name}}</p>`,
  },
];

// ---------------------------------------------------------------------------

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("❌ Please provide a workspace slug:");
    console.error("   pnpm starter-templates <workspace-slug>");
    process.exit(1);
  }

  console.log(`🔍 Looking up workspace: ${slug}`);
  const workspace = await prisma.workspace.findUnique({ where: { slug } });
  if (!workspace) {
    console.error(`❌ Workspace with slug "${slug}" not found.`);
    process.exit(1);
  }

  console.log(`✅ Found workspace: ${workspace.name}`);
  console.log(`📧 Adding ${templates.length} email templates...`);

  let added = 0;
  for (const t of templates) {
    await prisma.emailTemplate.create({
      data: {
        name: t.name,
        subject: t.subject,
        body: t.body,
        type: t.type,
        isActive: true,
        workspaceId: workspace.id,
      },
    });
    console.log(`   ✓ ${t.name}`);
    added++;
  }

  console.log(`\n🎉 Done! Added ${added} templates to "${workspace.name}".`);
  console.log(`   Go to /email-templates in your app to see and customize them.`);
}

main()
  .catch((e) => {
    console.error("❌ Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
