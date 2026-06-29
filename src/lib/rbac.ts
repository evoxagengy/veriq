import type { Role } from "@prisma/client";
import { hasAnyRole } from "@/lib/auth/session";

export const adminRoles: Role[] = ["ADMIN", "MANAGER"];
export const supervisorRoles: Role[] = ["ADMIN", "MANAGER", "SUPERVISOR"];
export const executorRoles: Role[] = ["ADMIN", "MANAGER", "SUPERVISOR", "OPERATOR", "TECHNICIAN", "INSPECTOR"];

export function assertRole(role: Role, allowed: Role[]) {
  if (!hasAnyRole(role, allowed)) {
    throw new Error("Acesso negado.");
  }
}

