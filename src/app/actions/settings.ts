"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { checkboxValue } from "@/lib/forms";
import { assertRole, adminRoles } from "@/lib/rbac";
import { writeAuditLog } from "@/lib/audit";

const settingsSchema = z.object({
  companyName: z.string().min(2).max(120),
  checklistApprovalEnabled: z.boolean(),
  inspectionGraceMinutes: z.coerce.number().int().min(0).max(1440),
  evidenceRequired: z.boolean(),
  notifyOverdue: z.boolean(),
  notifyCriticalFailures: z.boolean(),
  dataRetentionDays: z.coerce.number().int().min(365).max(3650)
});

export async function updateSettingsAction(formData: FormData) {
  const session = await requireSession();
  assertRole(session.user.role, adminRoles);

  const parsed = settingsSchema.parse({
    companyName: formData.get("companyName"),
    checklistApprovalEnabled: checkboxValue(formData.get("checklistApprovalEnabled")),
    inspectionGraceMinutes: formData.get("inspectionGraceMinutes"),
    evidenceRequired: checkboxValue(formData.get("evidenceRequired")),
    notifyOverdue: checkboxValue(formData.get("notifyOverdue")),
    notifyCriticalFailures: checkboxValue(formData.get("notifyCriticalFailures")),
    dataRetentionDays: formData.get("dataRetentionDays")
  });

  await prisma.tenantSettings.upsert({
    where: { tenantId: session.user.tenantId },
    create: {
      tenantId: session.user.tenantId,
      ...parsed
    },
    update: parsed
  });

  await writeAuditLog({
    tenantId: session.user.tenantId,
    userId: session.user.id,
    action: "TENANT_SETTINGS_UPDATE",
    resource: "TenantSettings",
    resourceId: session.user.tenantId
  });

  revalidatePath("/configuracoes");
}

