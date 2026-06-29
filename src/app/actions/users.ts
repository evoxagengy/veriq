"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { optionalString } from "@/lib/forms";
import { normalizeEmail } from "@/lib/security";
import { assertRole, adminRoles, masterRoles } from "@/lib/rbac";
import { writeAuditLog } from "@/lib/audit";

const userSchema = z.object({
  tenantId: z.string().optional(),
  name: z.string().min(3).max(120),
  email: z.string().email().max(255),
  role: z.enum(["MASTER", "ADMIN", "MANAGER", "SUPERVISOR", "OPERATOR", "TECHNICIAN", "INSPECTOR"]),
  department: z.string().max(80).optional(),
  position: z.string().max(80).optional(),
  phone: z.string().max(40).optional(),
  password: z.string().min(8).max(128).optional()
});

const companySchema = z.object({
  name: z.string().min(3).max(120),
  slug: z.string().min(3).max(80).regex(/^[a-z0-9-]+$/)
});

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function resolveTenantForMutation(sessionTenantId: string, requestedTenantId: string | undefined, isMaster: boolean) {
  const tenantId = isMaster && requestedTenantId ? requestedTenantId : sessionTenantId;
  const tenant = await prisma.tenant.findFirst({ where: { id: tenantId, active: true } });

  if (!tenant) {
    throw new Error("Empresa inválida ou inativa.");
  }

  return tenant;
}

function assertCanAssignRole(currentRole: string, targetRole: string) {
  if (targetRole === "MASTER" && currentRole !== "MASTER") {
    throw new Error("Apenas usuários master podem conceder perfil Master.");
  }
}

export async function createTenantAction(formData: FormData) {
  const session = await requireSession();
  assertRole(session.user.role, masterRoles);

  const name = String(formData.get("name") ?? "").trim();
  const parsed = companySchema.parse({
    name,
    slug: String(formData.get("slug") || slugify(name)).trim()
  });

  const tenant = await prisma.$transaction(async (tx) => {
    const created = await tx.tenant.create({
      data: {
        name: parsed.name,
        slug: parsed.slug
      }
    });

    await tx.tenantSettings.create({
      data: {
        tenantId: created.id,
        companyName: parsed.name,
        checklistApprovalEnabled: true,
        inspectionGraceMinutes: 30,
        evidenceRequired: false,
        notifyOverdue: true,
        notifyCriticalFailures: true,
        dataRetentionDays: 1825
      }
    });

    await tx.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: "TENANT_CREATE",
        resource: "Tenant",
        resourceId: created.id
      }
    });

    return created;
  });

  revalidatePath("/usuarios");
  revalidatePath("/configuracoes");
  void tenant;
}

export async function createUserAction(formData: FormData) {
  const session = await requireSession();
  assertRole(session.user.role, adminRoles);

  const parsed = userSchema.parse({
    tenantId: optionalString(formData.get("tenantId")),
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    department: optionalString(formData.get("department")),
    position: optionalString(formData.get("position")),
    phone: optionalString(formData.get("phone")),
    password: optionalString(formData.get("password")) ?? "Veriq@2026"
  });

  assertCanAssignRole(session.user.role, parsed.role);
  const tenant = await resolveTenantForMutation(session.user.tenantId, parsed.tenantId, session.user.role === "MASTER");

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
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
    tenantId: tenant.id,
    userId: session.user.id,
    action: "USER_CREATE",
    resource: "User",
    resourceId: user.id
  });

  revalidatePath("/usuarios");
}

export async function updateUserAction(formData: FormData) {
  const session = await requireSession();
  assertRole(session.user.role, adminRoles);

  const id = z.string().min(1).parse(formData.get("id"));
  const active = formData.get("active") !== "false";
  const parsed = userSchema.omit({ password: true }).parse({
    tenantId: optionalString(formData.get("tenantId")),
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    department: optionalString(formData.get("department")),
    position: optionalString(formData.get("position")),
    phone: optionalString(formData.get("phone"))
  });

  assertCanAssignRole(session.user.role, parsed.role);

  if (id === session.user.id && !active) {
    throw new Error("Você não pode desativar a própria conta.");
  }

  const user = await prisma.user.findFirst({
    where: session.user.role === "MASTER" ? { id } : { id, tenantId: session.user.tenantId }
  });

  if (!user) {
    throw new Error("Usuário não encontrado.");
  }

  const tenant = await resolveTenantForMutation(user.tenantId, parsed.tenantId, session.user.role === "MASTER");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      tenantId: tenant.id,
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
    tenantId: tenant.id,
    userId: session.user.id,
    action: "USER_UPDATE",
    resource: "User",
    resourceId: user.id
  });

  revalidatePath("/usuarios");
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
