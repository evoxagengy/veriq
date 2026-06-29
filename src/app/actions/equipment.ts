"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { optionalString } from "@/lib/forms";
import { assertRole, supervisorRoles } from "@/lib/rbac";
import { writeAuditLog } from "@/lib/audit";

const createEquipmentSchema = z.object({
  name: z.string().min(3).max(120),
  tag: z.string().min(2).max(40),
  category: z.string().min(2).max(80),
  area: z.string().min(2).max(80),
  model: z.string().max(80).optional(),
  manufacturer: z.string().max(80).optional(),
  location: z.string().max(120).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(["OPERATING", "MAINTENANCE", "INACTIVE", "CRITICAL", "ATTENTION"]),
  criticality: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
});

export async function createEquipmentAction(formData: FormData) {
  const session = await requireSession();

  assertRole(session.user.role, supervisorRoles);

  const parsed = createEquipmentSchema.parse({
    name: formData.get("name"),
    tag: formData.get("tag"),
    category: formData.get("category"),
    area: formData.get("area"),
    model: formData.get("model") || undefined,
    manufacturer: formData.get("manufacturer") || undefined,
    location: formData.get("location") || undefined,
    description: formData.get("description") || undefined,
    status: formData.get("status"),
    criticality: formData.get("criticality")
  });

  await prisma.$transaction(async (tx) => {
    const equipment = await tx.equipment.create({
      data: {
        tenantId: session.user.tenantId,
        responsibleId: session.user.id,
        tag: parsed.tag.toUpperCase(),
        name: parsed.name,
        category: parsed.category,
        area: parsed.area,
        model: parsed.model,
        manufacturer: parsed.manufacturer,
        location: parsed.location,
        description: parsed.description,
        status: parsed.status,
        criticality: parsed.criticality,
        nextInspectionAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
      }
    });

    await tx.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: "EQUIPMENT_CREATE",
        resource: "Equipment",
        resourceId: equipment.id
      }
    });
  });

  revalidatePath("/equipamentos");
  revalidatePath("/dashboard");
}

export async function updateEquipmentAction(formData: FormData) {
  const session = await requireSession();
  assertRole(session.user.role, supervisorRoles);

  const id = z.string().min(1).parse(formData.get("id"));
  const parsed = createEquipmentSchema.extend({
    active: z.boolean(),
    monitorOnDashboard: z.boolean(),
    allowChecklists: z.boolean(),
    requiresStopApproval: z.boolean()
  }).parse({
    name: formData.get("name"),
    tag: formData.get("tag"),
    category: formData.get("category"),
    area: formData.get("area"),
    model: optionalString(formData.get("model")),
    manufacturer: optionalString(formData.get("manufacturer")),
    location: optionalString(formData.get("location")),
    description: optionalString(formData.get("description")),
    status: formData.get("status"),
    criticality: formData.get("criticality"),
    active: formData.get("active") !== "false",
    monitorOnDashboard: formData.get("monitorOnDashboard") === "on",
    allowChecklists: formData.get("allowChecklists") === "on",
    requiresStopApproval: formData.get("requiresStopApproval") === "on"
  });

  const existing = await prisma.equipment.findFirst({
    where: { id, tenantId: session.user.tenantId }
  });

  if (!existing) {
    throw new Error("Equipamento não encontrado.");
  }

  await prisma.equipment.update({
    where: { id: existing.id },
    data: {
      ...parsed,
      tag: parsed.tag.toUpperCase()
    }
  });

  await writeAuditLog({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: "EQUIPMENT_UPDATE",
    resource: "Equipment",
    resourceId: existing.id
  });

  revalidatePath("/equipamentos");
  revalidatePath(`/equipamentos/${existing.id}`);
}

export async function deactivateEquipmentAction(formData: FormData) {
  const session = await requireSession();
  assertRole(session.user.role, supervisorRoles);
  const id = z.string().min(1).parse(formData.get("id"));

  const existing = await prisma.equipment.findFirst({
    where: { id, tenantId: session.user.tenantId }
  });

  if (!existing) {
    throw new Error("Equipamento não encontrado.");
  }

  await prisma.equipment.update({
    where: { id: existing.id },
    data: { active: false, status: "INACTIVE" }
  });

  await writeAuditLog({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: "EQUIPMENT_DEACTIVATE",
    resource: "Equipment",
    resourceId: existing.id
  });

  revalidatePath("/equipamentos");
}
