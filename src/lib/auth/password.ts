import argon2 from "argon2";
import { requireServerSecret } from "@/lib/env";

const argonOptions = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1
} satisfies argon2.Options;

function withPepper(password: string) {
  return `${password}:${requireServerSecret("SECURITY_PEPPER")}`;
}

export async function hashPassword(password: string) {
  return argon2.hash(withPepper(password), argonOptions);
}

export async function verifyPassword(hash: string, password: string) {
  try {
    return await argon2.verify(hash, withPepper(password));
  } catch {
    return false;
  }
}

export async function burnPasswordTime(password: string) {
  await argon2.hash(withPepper(password), argonOptions);
}

