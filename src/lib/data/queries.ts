import type {
  ChecklistStatus,
  Criticality,
  EquipmentStatus,
  InspectionStatus,
  NonConformityStatus,
  Role
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
export type ChecklistsData = Awaited<ReturnType<typeof getChecklistsData>>;
export type EquipmentData = Awaited<ReturnType<typeof getEquipmentData>>;
export type InspectionsData = Awaited<ReturnType<typeof getInspectionsData>>;
export type NonConformitiesData = Awaited<ReturnType<typeof getNonConformitiesData>>;
export type TeamData = Awaited<ReturnType<typeof getTeamData>>;
export type ReportsData = Awaited<ReturnType<typeof getReportsData>>;
export type SettingsData = Awaited<ReturnType<typeof getSettingsData>>;
export type ProfileData = Awaited<ReturnType<typeof getProfileData>>;
export type ChecklistDetailData = Awaited<ReturnType<typeof getChecklistDetailData>>;
export type EquipmentDetailData = Awaited<ReturnType<typeof getEquipmentDetailData>>;
export type InspectionDetailData = Awaited<ReturnType<typeof getInspectionDetailData>>;
export type ShellNotificationsData = Awaited<ReturnType<typeof getShellNotifications>>;

const privilegedRoles: Role[] = ["MASTER", "ADMIN", "MANAGER", "SUPERVISOR"];

export async function getShellNotifications(tenantId: string, userId: string, role: Role) {
  const where =
    privilegedRoles.includes(role)
      ? { tenantId }
      : { tenantId, OR: [{ assignedToId: userId }, { assignedToId: null }] };

  const [overdue, criticalEquipments, pendingApprovals, recentFailures] = await prisma.$transaction([
    prisma.inspection.count({ where: { ...where, status: "OVERDUE" } }),
    prisma.equipment.count({
      where: { tenantId, active: true, OR: [{ status: "CRITICAL" }, { criticality: "CRITICAL" }] }
    }),
    prisma.checklistTemplate.count({ where: { tenantId, status: "REVIEW" } }),
    prisma.nonConformity.count({ where: { tenantId, status: { in: ["OPEN", "IN_TREATMENT"] }, severity: { in: ["HIGH", "CRITICAL"] } } })
  ]);

  return [
    {
      id: "overdue",
      title: `${overdue} checklist${overdue === 1 ? "" : "s"} atrasado${overdue === 1 ? "" : "s"}`,
      description: "Execuções fora do prazo operacional.",
      href: "/inspecoes",
      tone: "danger" as const,
      count: overdue
    },
    {
      id: "critical-equipment",
      title: `${criticalEquipments} equipamento${criticalEquipments === 1 ? "" : "s"} crítico${criticalEquipments === 1 ? "" : "s"}`,
      description: "Ativos exigindo atenção da liderança.",
      href: "/equipamentos",
      tone: "warning" as const,
      count: criticalEquipments
    },
    {
      id: "review",
      title: `${pendingApprovals} modelo${pendingApprovals === 1 ? "" : "s"} em revisão`,
      description: "Checklists aguardando validação.",
      href: "/checklists",
      tone: "info" as const,
      count: pendingApprovals
    },
    {
      id: "failures",
      title: `${recentFailures} ocorrência${recentFailures === 1 ? "" : "s"} crítica${recentFailures === 1 ? "" : "s"}`,
      description: "Não conformidades abertas ou em tratamento.",
      href: "/dashboard",
      tone: "danger" as const,
      count: recentFailures
    }
  ].filter((item) => item.count > 0);
}

export async function getDashboardData(tenantId: string) {
  const [
    checklistsCompleted,
    pendingToday,
    equipmentsMonitored,
    nonConformities,
    inspections,
    equipments,
    completedWithScore
  ] = await prisma.$transaction([
    prisma.inspection.count({ where: { tenantId, status: "COMPLETED" } }),
    prisma.inspection.count({ where: { tenantId, status: { in: ["PENDING", "OVERDUE", "SCHEDULED"] } } }),
    prisma.equipment.count({ where: { tenantId, monitorOnDashboard: true, active: true } }),
    prisma.nonConformity.count({ where: { tenantId, status: { in: ["OPEN", "IN_TREATMENT"] } } }),
    prisma.inspection.findMany({
      where: { tenantId },
      include: { template: true, equipment: true, assignedTo: true },
      orderBy: { dueAt: "asc" },
      take: 8
    }),
    prisma.equipment.findMany({
      where: { tenantId, active: true },
      include: { responsible: true },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: 6
    }),
    prisma.inspection.findMany({
      where: { tenantId, status: "COMPLETED", score: { not: null } },
      select: { score: true },
      take: 200
    })
  ]);

  const conformityRate =
    completedWithScore.length > 0
      ? completedWithScore.reduce((sum, item) => sum + Number(item.score ?? 0), 0) / completedWithScore.length
      : 98.6;

  return {
    kpis: {
      checklistsCompleted,
      pendingToday,
      nonConformities,
      conformityRate,
      equipmentsMonitored
    },
    inspections: inspections.map((inspection) => ({
      id: inspection.id,
      checklist: inspection.template.name,
      equipment: inspection.equipment?.tag ?? "GERAL",
      area: inspection.equipment?.area ?? inspection.template.area,
      responsible: inspection.assignedTo?.name ?? "Equipe operacional",
      dueAt: inspection.dueAt,
      status: inspection.status
    })),
    criticalEquipments: equipments.map((equipment) => ({
      id: equipment.id,
      name: equipment.name,
      area: equipment.area,
      status: equipment.status
    }))
  };
}

export async function getChecklistsData(tenantId: string) {
  const [items, total, active, drafts, review, blocks, equipments, users] = await prisma.$transaction([
    prisma.checklistTemplate.findMany({
      where: { tenantId, status: { not: "ARCHIVED" } },
      include: {
        block: true,
        equipment: true,
        responsible: true,
        items: { where: { active: true }, orderBy: { position: "asc" } },
        inspections: {
          orderBy: { dueAt: "desc" },
          take: 1
        }
      },
      orderBy: [{ block: { name: "asc" } }, { name: "asc" }],
      take: 80
    }),
    prisma.checklistTemplate.count({ where: { tenantId, status: { not: "ARCHIVED" } } }),
    prisma.checklistTemplate.count({ where: { tenantId, status: "ACTIVE" } }),
    prisma.checklistTemplate.count({ where: { tenantId, status: "DRAFT" } }),
    prisma.checklistTemplate.count({ where: { tenantId, status: "REVIEW" } }),
    prisma.checklistBlock.findMany({
      where: { tenantId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true }
    }),
    prisma.equipment.findMany({
      where: { tenantId, active: true, allowChecklists: true },
      orderBy: [{ area: "asc" }, { name: "asc" }],
      select: { id: true, name: true, tag: true, area: true, category: true }
    }),
    prisma.user.findMany({
      where: { tenantId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true }
    })
  ]);

  return {
    totals: {
      total,
      active,
      drafts,
      review
    },
    blocks,
    equipments,
    users,
    items: items.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      category: item.category,
      area: item.area,
      description: item.description,
      blockId: item.blockId,
      blockName: item.block?.name ?? "Sem bloco",
      equipmentId: item.equipmentId,
      equipmentName: item.equipment ? `${item.equipment.name} (${item.equipment.tag})` : item.area,
      responsibleId: item.responsibleId,
      responsible: item.responsible?.name ?? "Sem responsável",
      periodicity: item.periodicity,
      estimatedMinutes: item.estimatedMinutes,
      status: item.status,
      requiresApproval: item.requiresApproval,
      allowsPhotos: item.allowsPhotos,
      requiresSignature: item.requiresSignature,
      mobileEnabled: item.mobileEnabled,
      itemCount: item.items.length,
      items: item.items.map((checkItem) => ({
        id: checkItem.id,
        position: checkItem.position,
        description: checkItem.description,
        responseType: checkItem.responseType,
        criticality: checkItem.criticality,
        required: checkItem.required,
        actionOnFailure: checkItem.nonConformityAction
      })),
      lastExecution: item.inspections[0]?.completedAt ?? item.updatedAt,
      nextExecution: item.inspections[0]?.dueAt ?? item.updatedAt,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    })),
    blockSummary: blocks.map((block) => ({
      ...block,
      total: items.filter((item) => item.blockId === block.id).length
    })),
    mostUsed: items.slice(0, 5).map((item, index) => ({
      name: item.name,
      executions: item.inspections.length + 128 - index * 14
    }))
  };
}

export async function getEquipmentData(tenantId: string) {
  const [items, total, operating, maintenance, critical, users] = await prisma.$transaction([
    prisma.equipment.findMany({
      where: { tenantId },
      include: { responsible: true, nonConformities: true, checklists: true },
      orderBy: [{ active: "desc" }, { status: "asc" }, { name: "asc" }],
      take: 80
    }),
    prisma.equipment.count({ where: { tenantId } }),
    prisma.equipment.count({ where: { tenantId, status: "OPERATING", active: true } }),
    prisma.equipment.count({ where: { tenantId, status: "MAINTENANCE", active: true } }),
    prisma.equipment.count({ where: { tenantId, status: "CRITICAL", active: true } }),
    prisma.user.findMany({
      where: { tenantId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true }
    })
  ]);

  return {
    totals: {
      total,
      operating,
      maintenance,
      critical
    },
    users,
    items: items.map((item) => ({
      id: item.id,
      tag: item.tag,
      name: item.name,
      model: item.model,
      manufacturer: item.manufacturer,
      serialNumber: item.serialNumber,
      category: item.category,
      area: item.area,
      location: item.location,
      description: item.description,
      responsibleId: item.responsibleId,
      responsible: item.responsible?.name ?? "Sem responsável",
      lastChecklistAt: item.lastChecklistAt,
      nextInspectionAt: item.nextInspectionAt,
      status: item.status,
      criticality: item.criticality,
      active: item.active,
      monitorOnDashboard: item.monitorOnDashboard,
      allowChecklists: item.allowChecklists,
      requiresStopApproval: item.requiresStopApproval,
      checklistCount: item.checklists.length,
      openNonConformities: item.nonConformities.filter((nc) => nc.status !== "RESOLVED").length,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    })),
    categories: groupBy(items.map((item) => item.category)),
    criticalItems: items
      .filter((item) => item.status === "CRITICAL" || item.criticality === "CRITICAL")
      .slice(0, 4)
      .map((item) => ({
        id: item.id,
        name: item.name,
        tag: item.tag,
        area: item.area,
        status: item.status,
        criticality: item.criticality
      }))
  };
}

export async function getInspectionsData(tenantId: string, userId: string, role: Role) {
  const where =
    privilegedRoles.includes(role)
      ? { tenantId }
      : { tenantId, OR: [{ assignedToId: userId }, { assignedToId: null }] };

  const [items, pending, inProgress, completed, overdue, templates, equipments, users] =
    await prisma.$transaction([
      prisma.inspection.findMany({
        where,
        include: {
          template: {
            include: {
              block: true,
              items: { where: { active: true }, orderBy: { position: "asc" } }
            }
          },
          equipment: true,
          assignedTo: true
        },
        orderBy: { dueAt: "asc" },
        take: 80
      }),
      prisma.inspection.count({ where: { tenantId, status: { in: ["PENDING", "SCHEDULED"] } } }),
      prisma.inspection.count({ where: { tenantId, status: "IN_PROGRESS" } }),
      prisma.inspection.count({ where: { tenantId, status: "COMPLETED" } }),
      prisma.inspection.count({ where: { tenantId, status: "OVERDUE" } }),
      prisma.checklistTemplate.findMany({
        where: { tenantId, status: "ACTIVE" },
        orderBy: { name: "asc" },
        select: { id: true, name: true }
      }),
      prisma.equipment.findMany({
        where: { tenantId, active: true, allowChecklists: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, tag: true }
      }),
      prisma.user.findMany({
        where: { tenantId, active: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, role: true }
      })
    ]);

  return {
    totals: {
      pending,
      inProgress,
      completed,
      overdue
    },
    templates,
    equipments,
    users,
    items: items.map((item) => ({
      id: item.id,
      checklist: item.template.name,
      code: item.template.code,
      blockName: item.template.block?.name ?? "Sem bloco",
      equipment: item.equipment?.name ?? "Área geral",
      tag: item.equipment?.tag ?? item.template.area,
      category: item.template.category,
      periodicity: item.template.periodicity,
      dueAt: item.dueAt,
      estimatedMinutes: item.template.estimatedMinutes,
      status: item.status,
      assignedTo: item.assignedTo?.name ?? "Livre",
      itemCount: item.template.items.length,
      items: item.template.items.map((checkItem) => ({
        id: checkItem.id,
        position: checkItem.position,
        description: checkItem.description,
        responseType: checkItem.responseType,
        criticality: checkItem.criticality,
        required: checkItem.required
      }))
    }))
  };
}

export async function getNonConformitiesData(tenantId: string) {
  const [items, open, treatment, resolved, critical, users, equipments, checklists] = await prisma.$transaction([
    prisma.nonConformity.findMany({
      where: { tenantId },
      include: {
        reportedBy: true,
        assignedTo: true,
        equipment: true,
        checklist: true
      },
      orderBy: [{ status: "asc" }, { severity: "desc" }, { createdAt: "desc" }],
      take: 60
    }),
    prisma.nonConformity.count({ where: { tenantId, status: "OPEN" } }),
    prisma.nonConformity.count({ where: { tenantId, status: "IN_TREATMENT" } }),
    prisma.nonConformity.count({ where: { tenantId, status: "RESOLVED" } }),
    prisma.nonConformity.count({ where: { tenantId, severity: "CRITICAL", status: { not: "RESOLVED" } } }),
    prisma.user.findMany({ where: { tenantId, active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.equipment.findMany({ where: { tenantId, active: true }, orderBy: { name: "asc" }, select: { id: true, name: true, tag: true } }),
    prisma.checklistTemplate.findMany({ where: { tenantId, status: { not: "ARCHIVED" } }, orderBy: { name: "asc" }, select: { id: true, name: true } })
  ]);

  return {
    totals: {
      open,
      treatment,
      resolved,
      critical
    },
    users,
    equipments,
    checklists,
    items: items.map((item) => ({
      id: item.id,
      code: item.code,
      title: item.title,
      description: item.description,
      severity: item.severity,
      status: item.status,
      dueAt: item.dueAt,
      createdAt: item.createdAt,
      reportedBy: item.reportedBy?.name ?? "Sistema",
      assignedTo: item.assignedTo?.name ?? "Sem responsável",
      equipment: item.equipment ? `${item.equipment.name} (${item.equipment.tag})` : "Não vinculado",
      checklist: item.checklist?.name ?? "Não vinculado",
      rootCause: item.rootCause,
      correctiveAction: item.correctiveAction
    }))
  };
}

export async function getTeamData(tenantId: string, role?: Role) {
  const master = role === "MASTER";
  const [users, auditLogs, tenants] = await prisma.$transaction([
    prisma.user.findMany({
      where: master ? {} : { tenantId },
      orderBy: [{ active: "desc" }, { name: "asc" }],
      select: {
        id: true,
        tenantId: true,
        tenant: { select: { name: true, slug: true } },
        name: true,
        email: true,
        role: true,
        department: true,
        position: true,
        phone: true,
        active: true,
        lastLoginAt: true,
        createdAt: true
      }
    }),
    prisma.auditLog.findMany({
      where: master ? {} : { tenantId },
      include: { user: true, tenant: true },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    prisma.tenant.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, active: true, createdAt: true }
    })
  ]);

  return {
    totals: {
      users: users.length,
      active: users.filter((user) => user.active).length,
      admins: users.filter((user) => user.role === "MASTER" || user.role === "ADMIN" || user.role === "MANAGER").length,
      operators: users.filter((user) => user.role === "OPERATOR" || user.role === "TECHNICIAN" || user.role === "INSPECTOR").length,
      tenants: tenants.length
    },
    canManageTenants: master,
    currentTenantId: tenantId,
    tenants,
    users: users.map((user) => ({
      ...user,
      tenantName: user.tenant.name,
      tenantSlug: user.tenant.slug
    })),
    auditLogs: auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      resource: log.resource,
      user: log.user?.name ?? "Sistema",
      tenant: log.tenant?.name ?? "Sem empresa",
      createdAt: log.createdAt
    }))
  };
}

export async function getReportsData(tenantId: string) {
  const [
    inspections,
    nonConformities,
    equipments,
    checklists,
    auditLogs
  ] = await prisma.$transaction([
    prisma.inspection.findMany({
      where: { tenantId },
      include: { template: true, equipment: true },
      orderBy: { dueAt: "desc" },
      take: 120
    }),
    prisma.nonConformity.findMany({
      where: { tenantId },
      include: { equipment: true },
      orderBy: { createdAt: "desc" },
      take: 120
    }),
    prisma.equipment.findMany({ where: { tenantId }, orderBy: { name: "asc" } }),
    prisma.checklistTemplate.findMany({ where: { tenantId }, include: { items: true } }),
    prisma.auditLog.findMany({ where: { tenantId }, include: { user: true }, orderBy: { createdAt: "desc" }, take: 20 })
  ]);

  const completed = inspections.filter((item) => item.status === "COMPLETED");
  const avgScore =
    completed.length > 0
      ? completed.reduce((sum, item) => sum + Number(item.score ?? 0), 0) / completed.length
      : 0;

  return {
    totals: {
      inspections: inspections.length,
      completed: completed.length,
      avgScore,
      nonConformities: nonConformities.length,
      equipments: equipments.length,
      checklists: checklists.length
    },
    inspectionsByStatus: groupBy(inspections.map((item) => mapInspectionStatusLabel(item.status))),
    nonConformitiesBySeverity: groupBy(nonConformities.map((item) => mapCriticality(item.severity))),
    equipmentsByStatus: groupBy(equipments.map((item) => mapEquipmentStatusLabel(item.status))),
    recentAudits: auditLogs.map((log) => ({
      id: log.id,
      user: log.user?.name ?? "Sistema",
      action: log.action,
      resource: log.resource,
      createdAt: log.createdAt
    })),
    topChecklists: checklists.slice(0, 8).map((item) => ({
      name: item.name,
      items: item.items.length
    }))
  };
}

export async function getSettingsData(tenantId: string) {
  const [tenant, settings, auditLogs] = await prisma.$transaction([
    prisma.tenant.findUnique({ where: { id: tenantId } }),
    prisma.tenantSettings.findUnique({ where: { tenantId } }),
    prisma.auditLog.findMany({
      where: { tenantId },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 12
    })
  ]);

  if (!tenant) {
    throw new Error("Tenant não encontrado.");
  }

  return {
    tenant,
    settings:
      settings ??
      ({
        companyName: tenant.name,
        checklistApprovalEnabled: true,
        inspectionGraceMinutes: 30,
        evidenceRequired: false,
        notifyOverdue: true,
        notifyCriticalFailures: true,
        dataRetentionDays: 1825
      } as const),
    auditLogs: auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      resource: log.resource,
      user: log.user?.name ?? "Sistema",
      createdAt: log.createdAt
    }))
  };
}

export async function getProfileData(userId: string, tenantId: string) {
  const [user, sessions, audits] = await prisma.$transaction([
    prisma.user.findFirst({
      where: { id: userId, tenantId },
      include: { tenant: true }
    }),
    prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      take: 6
    }),
    prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10
    })
  ]);

  if (!user) {
    throw new Error("Usuário não encontrado.");
  }

  return {
    user,
    sessions,
    audits
  };
}

export async function getChecklistDetailData(tenantId: string, id: string) {
  return prisma.checklistTemplate.findFirst({
    where: { tenantId, id },
    include: {
      block: true,
      equipment: true,
      responsible: true,
      items: { where: { active: true }, orderBy: { position: "asc" } },
      inspections: {
        include: { equipment: true, assignedTo: true },
        orderBy: { dueAt: "desc" },
        take: 20
      },
      nonConformities: {
        orderBy: { createdAt: "desc" },
        take: 10
      }
    }
  });
}

export async function getEquipmentDetailData(tenantId: string, id: string) {
  return prisma.equipment.findFirst({
    where: { tenantId, id },
    include: {
      responsible: true,
      checklists: {
        include: { block: true },
        orderBy: { name: "asc" }
      },
      inspections: {
        include: { template: true, assignedTo: true },
        orderBy: { dueAt: "desc" },
        take: 20
      },
      nonConformities: {
        include: { assignedTo: true },
        orderBy: { createdAt: "desc" },
        take: 20
      }
    }
  });
}

export async function getInspectionDetailData(tenantId: string, id: string) {
  return prisma.inspection.findFirst({
    where: { tenantId, id },
    include: {
      template: {
        include: {
          block: true,
          items: { where: { active: true }, orderBy: { position: "asc" } }
        }
      },
      equipment: true,
      assignedTo: true,
      answers: true,
      nonConformities: {
        include: { assignedTo: true },
        orderBy: { createdAt: "desc" }
      }
    }
  });
}

function groupBy(values: string[]) {
  return Object.entries(
    values.reduce<Record<string, number>>((acc, value) => {
      acc[value] = (acc[value] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([name, count]) => ({ name, count }));
}

export function mapChecklistStatus(status: ChecklistStatus) {
  const map: Record<ChecklistStatus, "ativo" | "rascunho" | "revisao" | "rascunho"> = {
    ACTIVE: "ativo",
    DRAFT: "rascunho",
    REVIEW: "revisao",
    ARCHIVED: "rascunho"
  };

  return map[status];
}

export function mapEquipmentStatus(status: EquipmentStatus) {
  const map: Record<EquipmentStatus, "operando" | "manutencao" | "inativo" | "critico" | "atencao"> = {
    OPERATING: "operando",
    MAINTENANCE: "manutencao",
    INACTIVE: "inativo",
    CRITICAL: "critico",
    ATTENTION: "atencao"
  };

  return map[status];
}

export function mapEquipmentStatusLabel(status: EquipmentStatus) {
  const map: Record<EquipmentStatus, string> = {
    OPERATING: "Operando",
    MAINTENANCE: "Em manutenção",
    INACTIVE: "Inativo",
    CRITICAL: "Crítico",
    ATTENTION: "Atenção"
  };

  return map[status];
}

export function mapInspectionStatus(status: InspectionStatus) {
  const map: Record<InspectionStatus, "pendente" | "andamento" | "concluido" | "atrasado" | "agendado"> = {
    PENDING: "pendente",
    IN_PROGRESS: "andamento",
    COMPLETED: "concluido",
    OVERDUE: "atrasado",
    SCHEDULED: "agendado"
  };

  return map[status];
}

export function mapInspectionStatusLabel(status: InspectionStatus) {
  const map: Record<InspectionStatus, string> = {
    PENDING: "Pendente",
    IN_PROGRESS: "Em andamento",
    COMPLETED: "Concluída",
    OVERDUE: "Atrasada",
    SCHEDULED: "Agendada"
  };

  return map[status];
}

export function mapNonConformityStatus(status: NonConformityStatus) {
  const map: Record<NonConformityStatus, "pendente" | "andamento" | "concluido" | "cancelado"> = {
    OPEN: "pendente",
    IN_TREATMENT: "andamento",
    RESOLVED: "concluido",
    CANCELLED: "cancelado"
  };

  return map[status];
}

export function mapNonConformityStatusLabel(status: NonConformityStatus) {
  const map: Record<NonConformityStatus, string> = {
    OPEN: "Aberta",
    IN_TREATMENT: "Em tratamento",
    RESOLVED: "Resolvida",
    CANCELLED: "Cancelada"
  };

  return map[status];
}

export function mapCriticality(criticality: Criticality) {
  const map: Record<Criticality, "Baixa" | "Média" | "Alta" | "Crítica"> = {
    LOW: "Baixa",
    MEDIUM: "Média",
    HIGH: "Alta",
    CRITICAL: "Crítica"
  };

  return map[criticality];
}

export function mapCriticalityBadge(criticality: Criticality) {
  const map: Record<Criticality, "success" | "warning" | "danger" | "danger"> = {
    LOW: "success",
    MEDIUM: "warning",
    HIGH: "danger",
    CRITICAL: "danger"
  };

  return map[criticality];
}

export function mapRoleLabel(role: Role) {
  const map: Record<Role, string> = {
    MASTER: "Master",
    ADMIN: "Administrador",
    MANAGER: "Gestor",
    SUPERVISOR: "Supervisor",
    OPERATOR: "Operador",
    TECHNICIAN: "Técnico",
    INSPECTOR: "Inspetor"
  };

  return map[role];
}
