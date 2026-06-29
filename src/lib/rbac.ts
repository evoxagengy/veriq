import type { Role } from "@prisma/client";
import { hasAnyRole } from "@/lib/auth/session";

export const masterRoles: Role[] = ["MASTER"];
export const adminRoles: Role[] = ["MASTER", "ADMIN", "MANAGER"];
export const supervisorRoles: Role[] = ["MASTER", "ADMIN", "MANAGER", "SUPERVISOR"];
export const executorRoles: Role[] = ["MASTER", "ADMIN", "MANAGER", "SUPERVISOR", "OPERATOR", "TECHNICIAN", "INSPECTOR"];

export function assertRole(role: Role, allowed: Role[]) {
  if (!hasAnyRole(role, allowed)) {
    throw new Error("Acesso negado.");
  }
}
