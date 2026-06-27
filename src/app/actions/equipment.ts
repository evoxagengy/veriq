"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasAnyRole, requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getRequestFingerprint } from "@/lib/security";

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

  if (!hasAnyRole(session.user.role, ["ADMIN", "MANAGER", "SUPERVISOR"])) {
    throw new Error("Acesso negado.");
  }

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

  const { ipHash } = await getRequestFingerprint();

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
        resourceId: equipment.id,
        ipHash
      }
    });
  });

  revalidatePath("/equipamentos");
  revalidatePath("/dashboard");
}

