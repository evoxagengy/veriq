"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { optionalString } from "@/lib/forms";
import { normalizeEmail } from "@/lib/security";
import { assertRole, adminRoles } from "@/lib/rbac";
import { writeAuditLog } from "@/lib/audit";

const userSchema = z.object({
  name: z.string().min(3).max(120),
  email: z.string().email().max(255),
  role: z.enum(["ADMIN", "MANAGER", "SUPERVISOR", "OPERATOR", "TECHNICIAN", "INSPECTOR"]),
  department: z.string().max(80).optional(),
  position: z.string().max(80).optional(),
  phone: z.string().max(40).optional(),
  password: z.string().min(8).max(128).optional()
});

export async function createUserAction(formData: FormData) {
  const session = await requireSession();
  assertRole(session.user.role, adminRoles);

  const parsed = userSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    department: optionalString(formData.get("department")),
    position: optionalString(formData.get("position")),
    phone: optionalString(formData.get("phone")),
    password: optionalString(formData.get("password")) ?? "Veriq@2026"
  });

  const user = await prisma.user.create({
    data: {
      tenantId: session.user.tenantId,
      name: parsed.name,
      email: normalizeEmail(parsed.email),
      role: parsed.role,
      department: parsed.department,
      position: parsed.position,
      phone: parsed.phone,
      passwordHash: await hashPassword(parsed.password ?? "Veriq@2026")
    }
  });

  await writeAuditLog({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: "USER_CREATE",
    resource: "User",
    resourceId: user.id
  });

  revalidatePath("/equipe");
}

export async function updateUserAction(formData: FormData) {
  const session = await requireSession();
  assertRole(session.user.role, adminRoles);

  const id = z.string().min(1).parse(formData.get("id"));
  const active = formData.get("active") !== "false";
  const parsed = userSchema.omit({ password: true }).parse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    department: optionalString(formData.get("department")),
    position: optionalString(formData.get("position")),
    phone: optionalString(formData.get("phone"))
  });

  const user = await prisma.user.findFirst({
    where: { id, tenantId: session.user.tenantId }
  });

  if (!user) {
    throw new Error("Usuário não encontrado.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.name,
      email: normalizeEmail(parsed.email),
      role: parsed.role,
      department: parsed.department,
      position: parsed.position,
      phone: parsed.phone,
      active
    }
  });

  await writeAuditLog({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: "USER_UPDATE",
    resource: "User",
    resourceId: user.id
  });

  revalidatePath("/equipe");
}

export async function updateProfileAction(formData: FormData) {
  const session = await requireSession();
  const parsed = z
    .object({
      name: z.string().min(3).max(120),
      department: z.string().max(80).optional(),
      position: z.string().max(80).optional(),
      phone: z.string().max(40).optional()
    })
    .parse({
      name: formData.get("name"),
      department: optionalString(formData.get("department")),
      position: optionalString(formData.get("position")),
      phone: optionalString(formData.get("phone"))
    });

  await prisma.user.update({
    where: { id: session.user.id },
    data: parsed
  });

  await writeAuditLog({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: "PROFILE_UPDATE",
    resource: "User",
    resourceId: session.user.id
  });

  revalidatePath("/perfil");
}

