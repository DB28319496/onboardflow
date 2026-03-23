import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { sendEmail } from "@/lib/email";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { STARTER_TEMPLATES, STARTER_AUTOMATIONS } from "@/lib/starter-content";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  // Rate limit: 5 signups per minute per IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { success, resetAt } = await rateLimit({ key: `signup:${ip}`, limit: 5, windowMs: 60_000 });
  if (!success) return rateLimitResponse(resetAt);

  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, companyName } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 12);
    const baseSlug = slugify(companyName);

    // Ensure slug is unique
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.workspace.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email, passwordHash },
      });

      const workspace = await tx.workspace.create({
        data: {
          name: companyName,
          slug,
          emailFromName: companyName,
        },
      });

      await tx.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: "OWNER",
        },
      });

      // Seed starter email templates
      const templateMap = new Map<string, string>();
      for (const t of STARTER_TEMPLATES) {
        const created = await tx.emailTemplate.create({
          data: {
            name: t.name,
            type: t.type,
            subject: t.subject,
            body: t.body,
            workspaceId: workspace.id,
          },
        });
        templateMap.set(t.name, created.id);
      }

      // Seed starter automation rules (linked to templates)
      for (const a of STARTER_AUTOMATIONS) {
        const templateId = a._templateName ? templateMap.get(a._templateName) ?? null : null;
        await tx.automationRule.create({
          data: {
            name: a.name,
            triggerType: a.triggerType,
            triggerConfig: a.triggerConfig,
            actionType: a.actionType,
            actionConfig: a.actionConfig,
            templateId,
            workspaceId: workspace.id,
          },
        });
      }
    });

    // Send verification email (non-blocking)
    sendVerificationEmail(email, name ?? email, req.url).catch(console.error);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[signup error]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

async function sendVerificationEmail(email: string, name: string, requestUrl: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  const baseUrl = new URL(requestUrl).origin;
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Verify your email — Cadence",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="font-size: 20px; margin-bottom: 16px;">Welcome to Cadence, ${name}!</h2>
        <p style="color: #555; font-size: 15px; line-height: 1.6;">
          Please verify your email address to complete your account setup.
        </p>
        <a href="${verifyUrl}" style="display: inline-block; background: #1E3A5F; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 20px 0;">
          Verify Email
        </a>
        <p style="color: #999; font-size: 13px; margin-top: 24px;">
          This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `,
    fromName: "Cadence",
  });
}
