import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import {
  checkLockout,
  recordFailedAttempt,
  clearAttempts,
  logSuccessfulLogin,
} from "@/lib/login-security";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const ip =
          request?.headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim() ??
          "unknown";

        // Check if account is locked out
        const lockout = checkLockout(email);
        if (lockout.locked) {
          const minutes = Math.ceil(lockout.remainingMs / 60_000);
          console.warn(
            `[SECURITY] Login blocked (locked): email=${email} ip=${ip} unlock_in=${minutes}m`
          );
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) {
          // Log failed attempt even if user doesn't exist (prevents enumeration timing)
          recordFailedAttempt(email, ip);
          return null;
        }

        const valid = await compare(password, user.passwordHash);
        if (!valid) {
          recordFailedAttempt(email, ip);
          return null;
        }

        // Success — clear any accumulated attempts
        clearAttempts(email);
        logSuccessfulLogin(email, ip, user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
});
