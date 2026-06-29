"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { optionalString } from "@/lib/forms";
import { assertRole, supervisorRoles } from "@/lib/rbac";
import { writeAuditLog } from "@/lib/audit";

const createChecklistSchema = z.object({
  name: z.string().min(3).max(120),
  category: z.string().min(2).max(80),
  area: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  periodicity: z.enum(["Diária", "Semanal", "Quinzenal", "Mensal"]),
  estimatedMinutes: z.coerce.number().int().min(5).max(240)
});

export async function createChecklistAction(formData: FormData) {
  const session = await requireSession();

  assertRole(session.user.role, supervisorRoles);

  const parsed = createChecklistSchema.parse({
    name: formData.get("name"),
    category: formData.get("category"),
    area: formData.get("area"),
    description: formData.get("description") || undefined,
    periodicity: formData.get("periodicity"),
    estimatedMinutes: formData.get("estimatedMinutes")
  });

  const count = await prisma.checklistTemplate.count({
    where: { tenantId: session.user.tenantId }
  });

  await prisma.$transaction(async (tx) => {
    const checklist = await tx.checklistTemplate.create({
      data: {
        tenantId: session.user.tenantId,
        code: `CHK-${String(count + 1).padStart(3, "0")}`,
        name: parsed.name,
        category: parsed.category,
        area: parsed.area,
        description: parsed.description,
        periodicity: parsed.periodicity,
        estimatedMinutes: parsed.estimatedMinutes,
        responsibleId: session.user.id,
        items: {
          create: [
            {
              position: 1,
              description: "Verificar condição geral do equipamento",
              responseType: "Sim/Não",
              criticality: "MEDIUM"
            },
            {
              position: 2,
              description: "Registrar evidências e observações",
              responseType: "Texto",
              criticality: "LOW",
              required: false
            }
          ]
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
}

export async function updateChecklistAction(formData: FormData) {
  const session = await requireSession();
  assertRole(session.user.role, supervisorRoles);

  const id = z.string().min(1).parse(formData.get("id"));
  const parsed = createChecklistSchema.extend({
    status: z.enum(["ACTIVE", "DRAFT", "REVIEW", "ARCHIVED"]),
    requiresApproval: z.boolean(),
    allowsPhotos: z.boolean(),
    requiresSignature: z.boolean(),
    mobileEnabled: z.boolean()
  }).parse({
    name: formData.get("name"),
    category: formData.get("category"),
    area: formData.get("area"),
    description: optionalString(formData.get("description")),
    periodicity: formData.get("periodicity"),
    estimatedMinutes: formData.get("estimatedMinutes"),
    status: formData.get("status"),
    requiresApproval: formData.get("requiresApproval") === "on",
    allowsPhotos: formData.get("allowsPhotos") === "on",
    requiresSignature: formData.get("requiresSignature") === "on",
    mobileEnabled: formData.get("mobileEnabled") === "on"
  });

  const existing = await prisma.checklistTemplate.findFirst({
    where: { id, tenantId: session.user.tenantId }
  });

  if (!existing) {
    throw new Error("Checklist não encontrado.");
  }

  await prisma.checklistTemplate.update({
    where: { id: existing.id },
    data: parsed
  });

  await writeAuditLog({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: "CHECKLIST_UPDATE",
    resource: "ChecklistTemplate",
    resourceId: existing.id
  });

  revalidatePath("/checklists");
  revalidatePath(`/checklists/${existing.id}`);
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
}
