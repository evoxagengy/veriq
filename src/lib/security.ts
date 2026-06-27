import crypto from "node:crypto";
import { headers } from "next/headers";
import { requireServerSecret } from "@/lib/env";

export function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function hmacSha256(value: string, secret = requireServerSecret("SESSION_SECRET")) {
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export function randomToken() {
  return crypto.randomBytes(48).toString("base64url");
}

export async function getRequestFingerprint() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for") ?? "";
  const ip = forwardedFor.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "unknown";
  const userAgent = headerStore.get("user-agent") ?? "unknown";

  return {
    ipHash: sha256(`${ip}:${requireServerSecret("SECURITY_PEPPER")}`),
    userAgentHash: sha256(`${userAgent}:${requireServerSecret("SECURITY_PEPPER")}`)
  };
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

