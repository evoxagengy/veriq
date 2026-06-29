"use server";

import { revalidatePath } from "next/cache";
import type { Criticality, Prisma } from "@prisma/client";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { optionalString } from "@/lib/forms";
import { assertRole, supervisorRoles } from "@/lib/rbac";
import { writeAuditLog } from "@/lib/audit";

const checklistSchema = z.object({
  name: z.string().min(3).max(120),
  category: z.string().min(2).max(80),
  area: z.string().max(120).optional(),
  blockId: z.string().optional(),
  blockName: z.string().min(2).max(100),
  equipmentId: z.string().optional(),
  responsibleId: z.string().optional(),
  description: z.string().max(500).optional(),
  periodicity: z.enum(["Diária", "Semanal", "Quinzenal", "Mensal"]),
  estimatedMinutes: z.coerce.number().int().min(5).max(240),
  status: z.enum(["ACTIVE", "DRAFT", "REVIEW", "ARCHIVED"]).default("ACTIVE"),
  requiresApproval: z.boolean().default(false),
  allowsPhotos: z.boolean().default(true),
  requiresSignature: z.boolean().default(false),
  mobileEnabled: z.boolean().default(true)
});

const criticalityValues: Criticality[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function parseChecklist(formData: FormData) {
  return checklistSchema.parse({
    name: formData.get("name"),
    category: formData.get("category"),
    area: optionalString(formData.get("area")),
    blockId: optionalString(formData.get("blockId")),
    blockName: formData.get("blockName"),
    equipmentId: optionalString(formData.get("equipmentId")),
    responsibleId: optionalString(formData.get("responsibleId")),
    description: optionalString(formData.get("description")),
    periodicity: formData.get("periodicity"),
    estimatedMinutes: formData.get("estimatedMinutes"),
    status: formData.get("status") ?? "ACTIVE",
    requiresApproval: formData.get("requiresApproval") === "on",
    allowsPhotos: formData.get("allowsPhotos") !== "false",
    requiresSignature: formData.get("requiresSignature") === "on",
    mobileEnabled: formData.get("mobileEnabled") !== "false"
  });
}

function parseChecklistItems(formData: FormData) {
  const descriptions = formData.getAll("itemDescription").map((value) => String(value).trim());
  const responseTypes = formData.getAll("itemResponseType").map((value) => String(value).trim());
  const criticalities = formData.getAll("itemCriticality").map((value) => String(value).trim());
  const actions = formData.getAll("itemAction").map((value) => String(value).trim());

  const items = descriptions
    .map((description, index) => {
      const criticality = criticalities[index] as Criticality | undefined;

      return {
        position: index + 1,
        description,
        responseType: responseTypes[index] || "Sim/Não",
        criticality: criticality && criticalityValues.includes(criticality) ? criticality : "MEDIUM",
        required: formData.get(`itemRequired_${index}`) !== "false",
        nonConformityAction: actions[index] || "OPEN_OCCURRENCE"
      };
    })
    .filter((item) => item.description.length > 0);

  if (items.length === 0) {
    throw new Error("Adicione pelo menos um item ao checklist.");
  }

  return items;
}

async function resolveBlock(tx: Prisma.TransactionClient, tenantId: string, blockId: string | undefined, blockName: string) {
  if (blockId) {
    const existing = await tx.checklistBlock.findFirst({ where: { id: blockId, tenantId, active: true } });
    if (existing) {
      return existing;
    }
  }

  return tx.checklistBlock.upsert({
    where: {
      tenantId_name: {
        tenantId,
        name: blockName
      }
    },
    update: {
      active: true
    },
    create: {
      tenantId,
      name: blockName
    }
  });
}

async function resolveEquipment(tenantId: string, equipmentId?: string) {
  if (!equipmentId) {
    return null;
  }

  const equipment = await prisma.equipment.findFirst({
    where: { id: equipmentId, tenantId, active: true, allowChecklists: true }
  });

  if (!equipment) {
    throw new Error("Equipamento inválido para esta empresa.");
  }

  return equipment;
}

async function resolveResponsible(tenantId: string, responsibleId?: string) {
  if (!responsibleId) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: { id: responsibleId, tenantId, active: true }
  });

  if (!user) {
    throw new Error("Responsável inválido para esta empresa.");
  }

  return user;
}

export async function createChecklistAction(formData: FormData) {
  const session = await requireSession();
  assertRole(session.user.role, supervisorRoles);

  const parsed = parseChecklist(formData);
  const items = parseChecklistItems(formData);
  const [count, equipment, responsible] = await Promise.all([
    prisma.checklistTemplate.count({ where: { tenantId: session.user.tenantId } }),
    resolveEquipment(session.user.tenantId, parsed.equipmentId),
    resolveResponsible(session.user.tenantId, parsed.responsibleId)
  ]);

  await prisma.$transaction(async (tx) => {
    const block = await resolveBlock(tx, session.user.tenantId, parsed.blockId, parsed.blockName);
    const checklist = await tx.checklistTemplate.create({
      data: {
        tenantId: session.user.tenantId,
        code: `CHK-${String(count + 1).padStart(3, "0")}`,
        name: parsed.name,
        category: parsed.category,
        area: parsed.area || (equipment ? `${equipment.tag} / ${equipment.area}` : parsed.blockName),
        description: parsed.description,
        periodicity: parsed.periodicity,
        estimatedMinutes: parsed.estimatedMinutes,
        status: parsed.status,
        blockId: block.id,
        equipmentId: equipment?.id,
        responsibleId: responsible?.id ?? session.user.id,
        requiresApproval: parsed.requiresApproval,
        allowsPhotos: parsed.allowsPhotos,
        requiresSignature: parsed.requiresSignature,
        mobileEnabled: parsed.mobileEnabled,
        items: {
          create: items
        }
      }
    });

    await tx.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: "CHECKLIST_CREATE",
        resource: "ChecklistTemplate",
        resourceId: checklist.id
      }
    });
  });

  revalidatePath("/checklists");
  revalidatePath("/dashboard");
  revalidatePath("/inspecoes");
}

export async function updateChecklistAction(formData: FormData) {
  const session = await requireSession();
  assertRole(session.user.role, supervisorRoles);

  const id = z.string().min(1).parse(formData.get("id"));
  const parsed = parseChecklist(formData);
  const items = parseChecklistItems(formData);
  const [existing, equipment, responsible] = await Promise.all([
    prisma.checklistTemplate.findFirst({
      where: { id, tenantId: session.user.tenantId }
    }),
    resolveEquipment(session.user.tenantId, parsed.equipmentId),
    resolveResponsible(session.user.tenantId, parsed.responsibleId)
  ]);

  if (!existing) {
    throw new Error("Checklist não encontrado.");
  }

  await prisma.$transaction(async (tx) => {
    const block = await resolveBlock(tx, session.user.tenantId, parsed.blockId, parsed.blockName);

    await tx.checklistTemplate.update({
      where: { id: existing.id },
      data: {
        name: parsed.name,
        category: parsed.category,
        area: parsed.area || (equipment ? `${equipment.tag} / ${equipment.area}` : parsed.blockName),
        description: parsed.description,
        periodicity: parsed.periodicity,
        estimatedMinutes: parsed.estimatedMinutes,
        status: parsed.status,
        blockId: block.id,
        equipmentId: equipment?.id,
        responsibleId: responsible?.id ?? session.user.id,
        requiresApproval: parsed.requiresApproval,
        allowsPhotos: parsed.allowsPhotos,
        requiresSignature: parsed.requiresSignature,
        mobileEnabled: parsed.mobileEnabled
      }
    });

    await Promise.all(
      items.map((item) =>
        tx.checklistItem.upsert({
          where: {
            templateId_position: {
              templateId: existing.id,
              position: item.position
            }
          },
          create: {
            ...item,
            active: true,
            templateId: existing.id
          },
          update: {
            description: item.description,
            responseType: item.responseType,
            criticality: item.criticality,
            required: item.required,
            nonConformityAction: item.nonConformityAction,
            active: true
          }
        })
      )
    );

    await tx.checklistItem.updateMany({
      where: {
        templateId: existing.id,
        position: { gt: items.length }
      },
      data: {
        active: false,
        required: false
      }
    });

    await tx.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: "CHECKLIST_UPDATE",
        resource: "ChecklistTemplate",
        resourceId: existing.id
      }
    });
  });

  revalidatePath("/checklists");
  revalidatePath(`/checklists/${existing.id}`);
  revalidatePath("/inspecoes");
}

export async function archiveChecklistAction(formData: FormData) {
  const session = await requireSession();
  assertRole(session.user.role, supervisorRoles);
  const id = z.string().min(1).parse(formData.get("id"));

  const existing = await prisma.checklistTemplate.findFirst({
    where: { id, tenantId: session.user.tenantId }
  });

  if (!existing) {
    throw new Error("Checklist não encontrado.");
  }

  await prisma.checklistTemplate.update({
    where: { id: existing.id },
    data: { status: "ARCHIVED" }
  });

  await writeAuditLog({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: "CHECKLIST_ARCHIVE",
    resource: "ChecklistTemplate",
    resourceId: existing.id
  });

  revalidatePath("/checklists");
  revalidatePath("/dashboard");
  revalidatePath("/inspecoes");
}
