import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { getRequestFingerprint, hmacSha256, randomToken } from "@/lib/security";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const REMEMBER_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

export type AuthSession = Awaited<ReturnType<typeof getCurrentSession>>;

export async function createSession(userId: string, remember = false) {
  const token = randomToken();
  const tokenHash = hmacSha256(token);
  const fingerprint = await getRequestFingerprint();
  const maxAge = remember ? REMEMBER_MAX_AGE_SECONDS : SESSION_MAX_AGE_SECONDS;
  const expiresAt = new Date(Date.now() + maxAge * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      ipHash: fingerprint.ipHash,
      userAgentHash: fingerprint.userAgentHash,
      expiresAt
    }
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge
  });
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hmacSha256(token) },
    include: {
      user: {
        include: {
          tenant: true
        }
      }
    }
  });

  if (
    !session ||
    session.revokedAt ||
    session.expiresAt <= new Date() ||
    !session.user.active ||
    !session.user.tenant.active
  ) {
    return null;
  }

  return session;
}

export async function requireSession() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export function hasAnyRole(role: Role, allowed: Role[]) {
  return allowed.includes(role);
}

export async function revokeCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.updateMany({
      where: {
        tokenHash: hmacSha256(token),
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
  }

  cookieStore.delete(SESSION_COOKIE);
}
