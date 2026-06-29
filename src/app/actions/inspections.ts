"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { assertRole, executorRoles, supervisorRoles } from "@/lib/rbac";
import { optionalString, requiredString } from "@/lib/forms";
import { writeAuditLog } from "@/lib/audit";

const scheduleInspectionSchema = z.object({
  templateId: z.string().min(1),
  equipmentId: z.string().optional(),
  assignedToId: z.string().optional(),
  dueAt: z.coerce.date()
});

export async function scheduleInspectionAction(formData: FormData) {
  const session = await requireSession();
  assertRole(session.user.role, supervisorRoles);

  const parsed = scheduleInspectionSchema.parse({
    templateId: formData.get("templateId"),
    equipmentId: optionalString(formData.get("equipmentId")),
    assignedToId: optionalString(formData.get("assignedToId")),
    dueAt: formData.get("dueAt")
  });

  const [template, equipment, assignee] = await prisma.$transaction([
    prisma.checklistTemplate.findFirst({
      where: { id: parsed.templateId, tenantId: session.user.tenantId, status: { not: "ARCHIVED" } }
    }),
    parsed.equipmentId
      ? prisma.equipment.findFirst({
          where: { id: parsed.equipmentId, tenantId: session.user.tenantId, active: true }
        })
      : prisma.equipment.findFirst({ where: { id: "__none__" } }),
    parsed.assignedToId
      ? prisma.user.findFirst({
          where: { id: parsed.assignedToId, tenantId: session.user.tenantId, active: true }
        })
      : prisma.user.findFirst({ where: { id: "__none__" } })
  ]);

  if (!template || (parsed.equipmentId && !equipment) || (parsed.assignedToId && !assignee)) {
    throw new Error("Registro inválido para este tenant.");
  }

  const inspection = await prisma.inspection.create({
    data: {
      tenantId: session.user.tenantId,
      templateId: template.id,
      equipmentId: parsed.equipmentId,
      assignedToId: parsed.assignedToId,
      dueAt: parsed.dueAt,
      status: parsed.dueAt < new Date() ? "OVERDUE" : "SCHEDULED"
    }
  });

  await writeAuditLog({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: "INSPECTION_SCHEDULE",
    resource: "Inspection",
    resourceId: inspection.id
  });

  revalidatePath("/inspecoes");
  revalidatePath("/dashboard");
}

export async function startInspectionAction(formData: FormData) {
  const session = await requireSession();
  assertRole(session.user.role, executorRoles);
  const inspectionId = requiredString(formData.get("inspectionId"));

  const inspection = await prisma.inspection.findFirst({
    where: {
      id: inspectionId,
      tenantId: session.user.tenantId
    }
  });

  if (!inspection) {
    throw new Error("Inspeção não encontrada.");
  }

  if (inspection.status === "COMPLETED") {
    redirect(`/inspecoes/${inspection.id}`);
  }

  if (!["PENDING", "SCHEDULED", "OVERDUE", "IN_PROGRESS"].includes(inspection.status)) {
    throw new Error("Status inválido para iniciar checklist.");
  }

  const canStart =
    inspection.assignedToId === session.user.id ||
    inspection.assignedToId === null ||
    supervisorRoles.includes(session.user.role);

  if (!canStart) {
    throw new Error("Acesso negado.");
  }

  await prisma.inspection.update({
    where: { id: inspection.id },
    data: {
      status: "IN_PROGRESS",
      assignedToId: inspection.assignedToId ?? session.user.id,
      startedAt: inspection.startedAt ?? new Date()
    }
  });

  await writeAuditLog({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: "INSPECTION_START",
    resource: "Inspection",
    resourceId: inspection.id
  });

  redirect(`/inspecoes/${inspection.id}`);
}

export async function completeInspectionAction(formData: FormData) {
  const session = await requireSession();
  assertRole(session.user.role, executorRoles);
  const inspectionId = requiredString(formData.get("inspectionId"));

  const inspection = await prisma.inspection.findFirst({
    where: {
      id: inspectionId,
      tenantId: session.user.tenantId
    },
    include: {
      template: { include: { items: { where: { active: true }, orderBy: { position: "asc" } } } },
      equipment: true
    }
  });

  if (!inspection) {
    throw new Error("Inspeção não encontrada.");
  }

  const canExecute =
    inspection.assignedToId === session.user.id ||
    inspection.assignedToId === null ||
    supervisorRoles.includes(session.user.role);

  if (!canExecute) {
    throw new Error("Acesso negado.");
  }

  const notes = optionalString(formData.get("notes"));
  const answers = inspection.template.items.map((item) => {
    const value = requiredString(formData.get(`answer_${item.id}`));
    const note = optionalString(formData.get(`note_${item.id}`));
    const compliant = formData.get(`compliant_${item.id}`) !== "false";

    if (item.required && !value) {
      throw new Error(`Item obrigatório sem resposta: ${item.description}`);
    }

    return {
      item,
      value: value || "Não informado",
      note,
      compliant
    };
  });

  const compliantCount = answers.filter((answer) => answer.compliant).length;
  const score = Math.round((compliantCount / Math.max(answers.length, 1)) * 10000) / 100;
  const nonCompliant = answers.filter((answer) => !answer.compliant);

  await prisma.$transaction(async (tx) => {
    await Promise.all(
      answers.map((answer) =>
        tx.inspectionAnswer.upsert({
          where: {
            inspectionId_itemId: {
              inspectionId: inspection.id,
              itemId: answer.item.id
            }
          },
          create: {
            inspectionId: inspection.id,
            itemId: answer.item.id,
            value: answer.value,
            note: answer.note,
            compliant: answer.compliant
          },
          update: {
            value: answer.value,
            note: answer.note,
            compliant: answer.compliant
          }
        })
      )
    );

    await tx.inspection.update({
      where: { id: inspection.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        startedAt: inspection.startedAt ?? new Date(),
        assignedToId: inspection.assignedToId ?? session.user.id,
        score,
        notes
      }
    });

    if (inspection.equipmentId) {
      await tx.equipment.update({
        where: { id: inspection.equipmentId },
        data: {
          lastChecklistAt: new Date(),
          nextInspectionAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });
    }

    for (const answer of nonCompliant) {
      const count = await tx.nonConformity.count({ where: { tenantId: session.user.tenantId } });
      await tx.nonConformity.create({
        data: {
          tenantId: session.user.tenantId,
          code: `NC-${String(count + 1).padStart(4, "0")}`,
          title: `Não conformidade: ${answer.item.description}`,
          description: answer.note ?? `Item marcado como não conforme na inspeção ${inspection.template.name}.`,
          severity: answer.item.criticality,
          status: "OPEN",
          dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          reportedById: session.user.id,
          assignedToId: inspection.assignedToId ?? session.user.id,
          inspectionId: inspection.id,
          equipmentId: inspection.equipmentId,
          checklistId: inspection.templateId
        }
      });
    }

    await tx.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        action: "INSPECTION_COMPLETE",
        resource: "Inspection",
        resourceId: inspection.id,
        metadata: {
          score,
          nonConformitiesOpened: nonCompliant.length
        }
      }
    });
  });

  revalidatePath("/dashboard");
  revalidatePath("/inspecoes");
  revalidatePath(`/inspecoes/${inspection.id}`);
  revalidatePath("/nao-conformidades");
  redirect(`/inspecoes/${inspection.id}`);
}
