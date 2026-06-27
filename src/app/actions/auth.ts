"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { burnPasswordTime, verifyPassword } from "@/lib/auth/password";
import { createSession, revokeCurrentSession } from "@/lib/auth/session";
import { getRequestFingerprint, normalizeEmail } from "@/lib/security";

const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido.").max(255),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres.").max(128),
  remember: z.boolean().default(false)
});

export type LoginState = {
  ok: boolean;
  message?: string;
};

const GENERIC_LOGIN_ERROR = "E-mail ou senha inválidos.";
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

async function getAttempt(identifier: string, ipHash: string) {
  return prisma.loginAttempt.upsert({
    where: {
      identifier_ipHash: {
        identifier,
        ipHash
      }
    },
    create: {
      identifier,
      ipHash,
      attempts: 0
    },
    update: {}
  });
}

async function registerFailedAttempt(identifier: string, ipHash: string, userId?: string) {
  const attempt = await getAttempt(identifier, ipHash);
  const attempts = attempt.attempts + 1;
  const lockedUntil =
    attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : null;

  await prisma.$transaction([
    prisma.loginAttempt.update({
      where: {
        identifier_ipHash: {
          identifier,
          ipHash
        }
      },
      data: {
        attempts,
        lockedUntil
      }
    }),
    ...(userId
      ? [
          prisma.user.update({
            where: { id: userId },
            data: {
              failedLoginCount: { increment: 1 },
              lockedUntil
            }
          })
        ]
      : [])
  ]);
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    remember: formData.get("remember") === "on"
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? GENERIC_LOGIN_ERROR
    };
  }

  const email = normalizeEmail(parsed.data.email);
  const { ipHash } = await getRequestFingerprint();
  const attempt = await getAttempt(email, ipHash);
  const now = new Date();

  if (attempt.lockedUntil && attempt.lockedUntil > now) {
    await burnPasswordTime(parsed.data.password);
    return { ok: false, message: GENERIC_LOGIN_ERROR };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { tenant: true }
  });

  if (!user || !user.active || (user.lockedUntil && user.lockedUntil > now)) {
    await burnPasswordTime(parsed.data.password);
    await registerFailedAttempt(email, ipHash, user?.id);
    return { ok: false, message: GENERIC_LOGIN_ERROR };
  }

  const passwordOk = await verifyPassword(user.passwordHash, parsed.data.password);

  if (!passwordOk) {
    await registerFailedAttempt(email, ipHash, user.id);
    return { ok: false, message: GENERIC_LOGIN_ERROR };
  }

  await prisma.$transaction([
    prisma.loginAttempt.update({
      where: {
        identifier_ipHash: {
          identifier: email,
          ipHash
        }
      },
      data: {
        attempts: 0,
        lockedUntil: null
      }
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: now,
        failedLoginCount: 0,
        lockedUntil: null
      }
    }),
    prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: "AUTH_LOGIN",
        resource: "Session",
        ipHash
      }
    })
  ]);

  await createSession(user.id, parsed.data.remember);
  redirect("/dashboard");
}

export async function logoutAction() {
  const session = await revokeCurrentSession();
  void session;
  redirect("/login");
}

