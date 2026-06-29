"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { optionalString } from "@/lib/forms";
import { assertRole, supervisorRoles } from "@/lib/rbac";
import { writeAuditLog } from "@/lib/audit";

const equipmentSchema = z.object({
  name: z.string().min(3).max(120),
  tag: z.string().min(2).max(40),
  category: z.string().min(2).max(80),
  area: z.string().min(2).max(80),
  model: z.string().max(80).optional(),
  manufacturer: z.string().max(80).optional(),
  serialNumber: z.string().max(80).optional(),
  location: z.string().max(120).optional(),
  description: z.string().max(500).optional(),
  responsibleId: z.string().optional(),
  status: z.enum(["OPERATING", "MAINTENANCE", "INACTIVE", "CRITICAL", "ATTENTION"]),
  criticality: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  monitorOnDashboard: z.boolean().default(true),
  allowChecklists: z.boolean().default(true),
  requiresStopApproval: z.boolean().default(false)
});

function boolValue(formData: FormData, name: string, defaultValue = false) {
  const value = formData.get(name);
  if (value === null) {
    return defaultValue;
  }
  return ["on", "true"].includes(String(value));
}

function parseEquipment(formData: FormData) {
  return equipmentSchema.parse({
    name: formData.get("name"),
    tag: formData.get("tag"),
    category: formData.get("category"),
    area: formData.get("area"),
    model: optionalString(formData.get("model")),
    manufacturer: optionalString(formData.get("manufacturer")),
    serialNumber: optionalString(formData.get("serialNumber")),
    location: optionalString(formData.get("location")),
    description: optionalString(formData.get("description")),
    responsibleId: optionalString(formData.get("responsibleId")),
    status: formData.get("status"),
    criticality: formData.get("criticality"),
    monitorOnDashboard: boolValue(formData, "monitorOnDashboard", true),
    allowChecklists: boolValue(formData, "allowChecklists", true),
    requiresStopApproval: boolValue(formData, "requiresStopApproval")
  });
}

async function resolveResponsible(tenantId: string, responsibleId?: string) {
  if (!responsibleId) {
    return null;
  }

  const responsible = await prisma.user.findFirst({
    where: { id: responsibleId, tenantId, active: true }
  });

  if (!responsible) {
    throw new Error("Responsável inválido para esta empresa.");
  }

  return responsible;
}

export async function createEquipmentAction(formData: FormData) {
  const session = await requireSession();
  assertRole(session.user.role, supervisorRoles);

  const parsed = parseEquipment(formData);
  const responsible = await resolveResponsible(session.user.tenantId, parsed.responsibleId);

  await prisma.$transaction(async (tx) => {
    const equipment = await tx.equipment.create({
      data: {
        tenantId: session.user.tenantId,
        responsibleId: responsible?.id ?? session.user.id,
        tag: parsed.tag.toUpperCase(),
        name: parsed.name,
        category: parsed.category,
        area: parsed.area,
        model: parsed.model,
        manufacturer: parsed.manufacturer,
        serialNumber: parsed.serialNumber,
        location: parsed.location,
        description: parsed.description,
        status: parsed.status,
        criticality: parsed.criticality,
        monitorOnDashboard: parsed.monitorOnDashboard,
        allowChecklists: parsed.allowChecklists,
        requiresStopApproval: parsed.requiresStopApproval,
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
  revalidatePath("/checklists");
}

export async function updateEquipmentAction(formData: FormData) {
  const session = await requireSession();
  assertRole(session.user.role, supervisorRoles);

  const id = z.string().min(1).parse(formData.get("id"));
  const parsed = equipmentSchema.extend({ active: z.boolean() }).parse({
    ...parseEquipment(formData),
    active: formData.get("active") !== "false"
  });

  const existing = await prisma.equipment.findFirst({
    where: { id, tenantId: session.user.tenantId }
  });

  if (!existing) {
    throw new Error("Equipamento não encontrado.");
  }

  const responsible = await resolveResponsible(session.user.tenantId, parsed.responsibleId);

  await prisma.equipment.update({
    where: { id: existing.id },
    data: {
      name: parsed.name,
      tag: parsed.tag.toUpperCase(),
      category: parsed.category,
      area: parsed.area,
      model: parsed.model,
      manufacturer: parsed.manufacturer,
      serialNumber: parsed.serialNumber,
      location: parsed.location,
      description: parsed.description,
      responsibleId: responsible?.id ?? existing.responsibleId,
      status: parsed.status,
      criticality: parsed.criticality,
      active: parsed.active,
      monitorOnDashboard: parsed.monitorOnDashboard,
      allowChecklists: parsed.allowChecklists,
      requiresStopApproval: parsed.requiresStopApproval
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
  revalidatePath("/checklists");
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
  revalidatePath("/dashboard");
}
