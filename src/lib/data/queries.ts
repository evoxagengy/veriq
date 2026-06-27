import type { ChecklistStatus, Criticality, EquipmentStatus, InspectionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
export type ChecklistsData = Awaited<ReturnType<typeof getChecklistsData>>;
export type EquipmentData = Awaited<ReturnType<typeof getEquipmentData>>;
export type InspectionsData = Awaited<ReturnType<typeof getInspectionsData>>;

export async function getDashboardData(tenantId: string) {
  const [checklistsCompleted, pendingToday, equipmentsMonitored, inspections, equipments] =
    await prisma.$transaction([
      prisma.inspection.count({ where: { tenantId, status: "COMPLETED" } }),
      prisma.inspection.count({ where: { tenantId, status: { in: ["PENDING", "OVERDUE"] } } }),
      prisma.equipment.count({ where: { tenantId, monitorOnDashboard: true } }),
      prisma.inspection.findMany({
        where: { tenantId },
        include: { template: true, equipment: true, assignedTo: true },
        orderBy: { dueAt: "asc" },
        take: 8
      }),
      prisma.equipment.findMany({
        where: { tenantId },
        include: { responsible: true },
        orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
        take: 6
      })
    ]);

  const nonConformities = inspections.filter((inspection) => inspection.status === "OVERDUE").length + 12;
  const conformityRate = 98.6;

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
  const [items, total, active, drafts, review] = await prisma.$transaction([
    prisma.checklistTemplate.findMany({
      where: { tenantId },
      include: {
        responsible: true,
        inspections: {
          orderBy: { dueAt: "desc" },
          take: 1
        }
      },
      orderBy: { name: "asc" },
      take: 10
    }),
    prisma.checklistTemplate.count({ where: { tenantId } }),
    prisma.checklistTemplate.count({ where: { tenantId, status: "ACTIVE" } }),
    prisma.checklistTemplate.count({ where: { tenantId, status: "DRAFT" } }),
    prisma.checklistTemplate.count({ where: { tenantId, status: "REVIEW" } })
  ]);

  return {
    totals: {
      total,
      active,
      drafts,
      review
    },
    items: items.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
      category: item.category,
      area: item.area,
      responsible: item.responsible?.name ?? "Sem responsável",
      periodicity: item.periodicity,
      estimatedMinutes: item.estimatedMinutes,
      status: item.status,
      lastExecution: item.inspections[0]?.completedAt ?? item.updatedAt,
      nextExecution: item.inspections[0]?.dueAt ?? item.updatedAt
    })),
    mostUsed: items.slice(0, 5).map((item, index) => ({
      name: item.name,
      executions: 128 - index * 14
    }))
  };
}

export async function getEquipmentData(tenantId: string) {
  const [items, total, operating, maintenance, critical] = await prisma.$transaction([
    prisma.equipment.findMany({
      where: { tenantId },
      include: { responsible: true },
      orderBy: [{ status: "asc" }, { name: "asc" }],
      take: 10
    }),
    prisma.equipment.count({ where: { tenantId } }),
    prisma.equipment.count({ where: { tenantId, status: "OPERATING" } }),
    prisma.equipment.count({ where: { tenantId, status: "MAINTENANCE" } }),
    prisma.equipment.count({ where: { tenantId, status: "CRITICAL" } })
  ]);

  return {
    totals: {
      total,
      operating,
      maintenance,
      critical
    },
    items: items.map((item) => ({
      id: item.id,
      tag: item.tag,
      name: item.name,
      model: item.model,
      category: item.category,
      area: item.area,
      responsible: item.responsible?.name ?? "Sem responsável",
      lastChecklistAt: item.lastChecklistAt,
      nextInspectionAt: item.nextInspectionAt,
      status: item.status,
      criticality: item.criticality
    })),
    categories: groupBy(items.map((item) => item.category)),
    criticalItems: items.filter((item) => item.status === "CRITICAL" || item.criticality === "CRITICAL").slice(0, 4)
  };
}

export async function getInspectionsData(tenantId: string, userId: string) {
  const [items, pending, inProgress, completed, overdue] = await prisma.$transaction([
    prisma.inspection.findMany({
      where: {
        tenantId,
        OR: [{ assignedToId: userId }, { assignedToId: null }]
      },
      include: {
        template: true,
        equipment: true,
        assignedTo: true
      },
      orderBy: { dueAt: "asc" },
      take: 10
    }),
    prisma.inspection.count({ where: { tenantId, status: "PENDING" } }),
    prisma.inspection.count({ where: { tenantId, status: "IN_PROGRESS" } }),
    prisma.inspection.count({ where: { tenantId, status: "COMPLETED" } }),
    prisma.inspection.count({ where: { tenantId, status: "OVERDUE" } })
  ]);

  return {
    totals: {
      pending,
      inProgress,
      completed,
      overdue
    },
    items: items.map((item) => ({
      id: item.id,
      checklist: item.template.name,
      code: item.template.code,
      equipment: item.equipment?.name ?? "Área geral",
      tag: item.equipment?.tag ?? item.template.area,
      category: item.template.category,
      periodicity: item.template.periodicity,
      dueAt: item.dueAt,
      estimatedMinutes: item.template.estimatedMinutes,
      status: item.status
    }))
  };
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

export function mapCriticality(criticality: Criticality) {
  const map: Record<Criticality, "Baixa" | "Média" | "Alta" | "Crítica"> = {
    LOW: "Baixa",
    MEDIUM: "Média",
    HIGH: "Alta",
    CRITICAL: "Crítica"
  };

  return map[criticality];
}

