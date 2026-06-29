import { prisma } from "@/lib/prisma";
import { getRequestFingerprint } from "@/lib/security";
import type { Prisma } from "@prisma/client";

export async function writeAuditLog({
  tenantId,
  userId,
  action,
  resource,
  resourceId,
  metadata
}: {
  tenantId?: string | null;
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  const { ipHash } = await getRequestFingerprint();

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId,
      action,
      resource,
      resourceId,
      metadata,
      ipHash
    }
  });
}
