import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const verification = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verification) {
    return NextResponse.redirect(new URL("/login?error=invalid-token", req.url));
  }

  if (verification.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return NextResponse.redirect(new URL("/login?error=token-expired", req.url));
  }

  // Mark user as verified
  await prisma.user.updateMany({
    where: { email: verification.identifier },
    data: { emailVerified: new Date() },
  });

  // Clean up token
  await prisma.verificationToken.delete({ where: { token } });

  return NextResponse.redirect(new URL("/login?verified=true", req.url));
}
