import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  SESSION_SECRET: z.string().min(32).optional(),
  SECURITY_PEPPER: z.string().min(32).optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional()
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  SECURITY_PEPPER: process.env.SECURITY_PEPPER,
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL
});

export function requireServerSecret(name: "SESSION_SECRET" | "SECURITY_PEPPER") {
  const value = env[name];
  if (value) {
    return value;
  }

  if (env.NODE_ENV === "production") {
    throw new Error(`${name} is required in production`);
  }

  return `dev-only-${name.toLowerCase()}-replace-before-production-32-characters`;
}

