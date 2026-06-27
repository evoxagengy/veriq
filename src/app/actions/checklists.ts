"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasAnyRole, requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getRequestFingerprint } from "@/lib/security";

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

  if (!hasAnyRole(session.user.role, ["ADMIN", "MANAGER", "SUPERVISOR"])) {
    throw new Error("Acesso negado.");
  }

  const parsed = createChecklistSchema.parse({
    name: formData.get("name"),
    category: formData.get("category"),
    area: formData.get("area"),
    description: formData.get("description") || undefined,
    periodicity: formData.get("periodicity"),
    estimatedMinutes: formData.get("estimatedMinutes")
  });

  const { ipHash } = await getRequestFingerprint();
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
        resourceId: checklist.id,
        ipHash
      }
    });
  });

  revalidatePath("/checklists");
  revalidatePath("/dashboard");
}

