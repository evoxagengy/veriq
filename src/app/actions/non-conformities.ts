"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { optionalString } from "@/lib/forms";
import { assertRole, executorRoles, supervisorRoles } from "@/lib/rbac";
import { writeAuditLog } from "@/lib/audit";

const createNonConformitySchema = z.object({
  title: z.string().min(3).max(140),
  description: z.string().min(5).max(1000),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  equipmentId: z.string().optional(),
  checklistId: z.string().optional(),
  assignedToId: z.string().optional(),
  dueAt: z.coerce.date().optional()
});

export async function createNonConformityAction(formData: FormData) {
  const session = await requireSession();
  assertRole(session.user.role, executorRoles);

  const parsed = createNonConformitySchema.parse({
    title: formData.get("title"),
    description: formData.get("description"),
    severity: formData.get("severity"),
    equipmentId: optionalString(formData.get("equipmentId")),
    checklistId: optionalString(formData.get("checklistId")),
    assignedToId: optionalString(formData.get("assignedToId")),
    dueAt: optionalString(formData.get("dueAt"))
  });

  const count = await prisma.nonConformity.count({ where: { tenantId: session.user.tenantId } });
  const nonConformity = await prisma.nonConformity.create({
    data: {
      tenantId: session.user.tenantId,
      code: `NC-${String(count + 1).padStart(4, "0")}`,
      title: parsed.title,
      description: parsed.description,
      severity: parsed.severity,
      equipmentId: parsed.equipmentId,
      checklistId: parsed.checklistId,
      assignedToId: parsed.assignedToId,
      dueAt: parsed.dueAt,
      reportedById: session.user.id
    }
  });

  await writeAuditLog({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: "NON_CONFORMITY_CREATE",
    resource: "NonConformity",
    resourceId: nonConformity.id
  });

  revalidatePath("/nao-conformidades");
  revalidatePath("/dashboard");
}

export async function updateNonConformityAction(formData: FormData) {
  const session = await requireSession();
  assertRole(session.user.role, supervisorRoles);

  const id = z.string().min(1).parse(formData.get("id"));
  const status = z.enum(["OPEN", "IN_TREATMENT", "RESOLVED", "CANCELLED"]).parse(formData.get("status"));
  const rootCause = optionalString(formData.get("rootCause"));
  const correctiveAction = optionalString(formData.get("correctiveAction"));

  const existing = await prisma.nonConformity.findFirst({
    where: { id, tenantId: session.user.tenantId }
  });

  if (!existing) {
    throw new Error("Não conformidade não encontrada.");
  }

  await prisma.nonConformity.update({
    where: { id: existing.id },
    data: {
      status,
      rootCause,
      correctiveAction,
      resolvedAt: status === "RESOLVED" ? new Date() : null
    }
  });

  await writeAuditLog({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: "NON_CONFORMITY_UPDATE",
    resource: "NonConformity",
    resourceId: existing.id,
    metadata: { status }
  });

  revalidatePath("/nao-conformidades");
  revalidatePath("/dashboard");
}

