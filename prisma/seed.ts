import argon2 from "argon2";
import { PrismaClient, type ChecklistStatus, type Criticality, type EquipmentStatus, type InspectionStatus, type Role } from "@prisma/client";

const prisma = new PrismaClient();

const PEPPER =
  process.env.SECURITY_PEPPER ??
  "dev-only-security_pepper-replace-before-production-32-characters";
const SEED_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "Veriq@2026";

async function hashPassword(password: string) {
  return argon2.hash(`${password}:${PEPPER}`, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1
  });
}

const users = [
  { name: "Rafael Souza", email: "admin@veriq.local", role: "MASTER" as Role },
  { name: "Ana Paula", email: "ana@veriq.local", role: "SUPERVISOR" as Role },
  { name: "João Silva", email: "joao@veriq.local", role: "OPERATOR" as Role },
  { name: "Carlos Lima", email: "carlos@veriq.local", role: "TECHNICIAN" as Role },
  { name: "Mariana Costa", email: "mariana@veriq.local", role: "INSPECTOR" as Role },
  { name: "Fernanda Silva", email: "fernanda@veriq.local", role: "MANAGER" as Role }
];

const blockSeed = [
  ["tratamento-caldo", "Tratamento de caldo", "Rotinas de equipamentos e pontos críticos do tratamento."],
  ["utilidades", "Utilidades", "Caldeiras, bombas, compressores e infraestrutura operacional."],
  ["movimentacao", "Movimentação interna", "Empilhadeiras, ponte rolante e movimentação de carga."],
  ["seguranca-operacional", "Segurança operacional", "EPI, extintores e rotinas de segurança."]
] satisfies Array<[string, string, string]>;

const equipmentSeed = [
  ["EMP-02", "Empilhadeira Hyster H2.5", "Empilhadeiras", "Logística", "H2.5FT", "CRITICAL", "CRITICAL"],
  ["CB-101", "Caldeira CB-101", "Caldeiras", "Utilidades", "CB-101", "ATTENTION", "HIGH"],
  ["CP-03", "Compressor CP-03", "Compressores", "Manutenção", "CP-300", "OPERATING", "MEDIUM"],
  ["PR-05", "Ponte Rolante PR-05", "Pontes Rolantes", "Produção", "PR-10T", "OPERATING", "HIGH"],
  ["PE-12", "Painel Elétrico PE-12", "Painéis Elétricos", "Elétrica", "PE-400A", "OPERATING", "HIGH"],
  ["BC-07", "Bomba Centrífuga BC-07", "Bombas", "Utilidades", "KSB 40-200", "MAINTENANCE", "MEDIUM"],
  ["TR-01", "Torre de Resfriamento TR-01", "Torres de Resfriamento", "Utilidades", "TR-150", "ATTENTION", "MEDIUM"],
  ["SA-02", "Secador de Ar SA-02", "Secadores", "Manutenção", "SA-200", "MAINTENANCE", "LOW"],
  ["GE-01", "Gerador de Energia GE-01", "Geradores", "Utilidades", "GE-250", "INACTIVE", "HIGH"],
  ["TRF-03", "Transformador TRF-03", "Transformadores", "Elétrica", "500 KVA", "OPERATING", "CRITICAL"]
] satisfies Array<[string, string, string, string, string, EquipmentStatus, Criticality]>;

const checklistSeed = [
  ["CHK-001", "Inspeção diária de empilhadeira", "Empilhadeiras", "EMP-02", "Diária", "ACTIVE", "Movimentação interna"],
  ["CHK-002", "Checklist de caldeira", "Caldeiras", "CB-101", "Diária", "ACTIVE", "Utilidades"],
  ["CHK-003", "Inspeção de compressor", "Compressores", "CP-03", "Diária", "ACTIVE", "Utilidades"],
  ["CHK-004", "Segurança operacional", "Segurança", "", "Semanal", "ACTIVE", "Segurança operacional"],
  ["CHK-005", "Ponte rolante", "Pontes Rolantes", "PR-05", "Semanal", "ACTIVE", "Movimentação interna"],
  ["CHK-006", "Checklist elétrica NR-10", "Elétrica", "PE-12", "Quinzenal", "ACTIVE", "Segurança operacional"],
  ["CHK-007", "Inspeção de extintores", "Segurança", "", "Mensal", "REVIEW", "Segurança operacional"],
  ["CHK-008", "Controle de EPI", "Segurança", "", "Mensal", "ACTIVE", "Segurança operacional"],
  ["CHK-009", "Lubrificação de máquinas", "Manutenção", "BC-07", "Mensal", "ACTIVE", "Tratamento de caldo"],
  ["CHK-010", "Limpeza industrial", "Limpeza", "", "Diária", "DRAFT", "Tratamento de caldo"]
] satisfies Array<[string, string, string, string, string, ChecklistStatus, string]>;

const defaultItems = [
  {
    position: 1,
    description: "Verificar condição geral do equipamento",
    responseType: "Sim/Não",
    criticality: "MEDIUM" as Criticality,
    required: true,
    nonConformityAction: "OPEN_OCCURRENCE"
  },
  {
    position: 2,
    description: "Registrar evidência fotográfica quando aplicável",
    responseType: "Foto",
    criticality: "LOW" as Criticality,
    required: false,
    nonConformityAction: "REQUIRE_PHOTO"
  },
  {
    position: 3,
    description: "Informar observações relevantes da execução",
    responseType: "Texto",
    criticality: "LOW" as Criticality,
    required: false,
    nonConformityAction: "REQUEST_APPROVAL"
  }
];

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "engenix" },
    update: { name: "Engenix Operações", active: true },
    create: { name: "Engenix Operações", slug: "engenix", active: true }
  });

  await prisma.tenantSettings.upsert({
    where: { tenantId: tenant.id },
    update: {
      companyName: "Engenix Operações",
      checklistApprovalEnabled: true,
      inspectionGraceMinutes: 30,
      evidenceRequired: false,
      notifyOverdue: true,
      notifyCriticalFailures: true,
      dataRetentionDays: 1825
    },
    create: {
      tenantId: tenant.id,
      companyName: "Engenix Operações",
      checklistApprovalEnabled: true,
      inspectionGraceMinutes: 30,
      evidenceRequired: false,
      notifyOverdue: true,
      notifyCriticalFailures: true,
      dataRetentionDays: 1825
    }
  });

  const passwordHash = await hashPassword(SEED_PASSWORD);
  const savedUsers = await Promise.all(
    users.map((user) =>
      prisma.user.upsert({
        where: { email: user.email },
        update: {
          tenantId: tenant.id,
          name: user.name,
          role: user.role,
          active: true,
          department: user.role === "MASTER" ? "Gestão" : "Operação",
          position: user.role === "MASTER" ? "Administrador master" : "Equipe operacional"
        },
        create: {
          tenantId: tenant.id,
          name: user.name,
          email: user.email,
          role: user.role,
          passwordHash,
          department: user.role === "MASTER" ? "Gestão" : "Operação",
          position: user.role === "MASTER" ? "Administrador master" : "Equipe operacional"
        }
      })
    )
  );

  const admin = savedUsers[0];
  const operator = savedUsers.find((user) => user.role === "OPERATOR") ?? admin;

  const blocks = await Promise.all(
    blockSeed.map(([slug, name, description]) =>
      prisma.checklistBlock.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name } },
        update: { description, active: true },
        create: { tenantId: tenant.id, name, description }
      }).then((block) => [slug, block] as const)
    )
  );
  const blockByName = new Map(blocks.map(([, block]) => [block.name, block]));

  const equipments = await Promise.all(
    equipmentSeed.map(([tag, name, category, area, model, status, criticality], index) =>
      prisma.equipment.upsert({
        where: { tenantId_tag: { tenantId: tenant.id, tag } },
        update: {
          name,
          category,
          area,
          model,
          status,
          criticality,
          active: true,
          allowChecklists: true,
          monitorOnDashboard: true,
          responsibleId: savedUsers[index % savedUsers.length]?.id ?? admin.id,
          lastChecklistAt: new Date("2025-05-16T08:00:00-03:00"),
          nextInspectionAt: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000)
        },
        create: {
          tenantId: tenant.id,
          tag,
          name,
          category,
          area,
          model,
          manufacturer: "Engenix",
          status,
          criticality,
          responsibleId: savedUsers[index % savedUsers.length]?.id ?? admin.id,
          lastChecklistAt: new Date("2025-05-16T08:00:00-03:00"),
          nextInspectionAt: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000)
        }
      })
    )
  );
  const equipmentByTag = new Map(equipments.map((equipment) => [equipment.tag, equipment]));

  const checklists = await Promise.all(
    checklistSeed.map(async ([code, name, category, equipmentTag, periodicity, status, blockName], index) => {
      const equipment = equipmentTag ? equipmentByTag.get(equipmentTag) : null;
      const block = blockByName.get(blockName);
      const checklist = await prisma.checklistTemplate.upsert({
        where: { tenantId_code: { tenantId: tenant.id, code } },
        update: {
          name,
          category,
          area: equipment ? `${equipment.tag} / ${equipment.area}` : blockName,
          periodicity,
          status,
          blockId: block?.id,
          equipmentId: equipment?.id,
          responsibleId: savedUsers[index % savedUsers.length]?.id ?? admin.id,
          estimatedMinutes: 15 + (index % 5) * 5,
          mobileEnabled: true,
          allowsPhotos: true
        },
        create: {
          tenantId: tenant.id,
          code,
          name,
          category,
          area: equipment ? `${equipment.tag} / ${equipment.area}` : blockName,
          periodicity,
          status,
          blockId: block?.id,
          equipmentId: equipment?.id,
          responsibleId: savedUsers[index % savedUsers.length]?.id ?? admin.id,
          estimatedMinutes: 15 + (index % 5) * 5,
          mobileEnabled: true,
          allowsPhotos: true
        }
      });

      await Promise.all(
        defaultItems.map((item) =>
          prisma.checklistItem.upsert({
            where: { templateId_position: { templateId: checklist.id, position: item.position } },
            update: { ...item, active: true },
            create: { ...item, active: true, templateId: checklist.id }
          })
        )
      );

      return checklist;
    })
  );

  const existingInspections = await prisma.inspection.count({
    where: { tenantId: tenant.id }
  });

  if (existingInspections < 12) {
    for (const [index, checklist] of checklists.slice(0, 8).entries()) {
      const status = (["OVERDUE", "PENDING", "PENDING", "IN_PROGRESS", "SCHEDULED", "COMPLETED"] as InspectionStatus[])[index % 6];
      const inspection = await prisma.inspection.create({
        data: {
          tenantId: tenant.id,
          templateId: checklist.id,
          equipmentId: equipments[index % equipments.length]?.id,
          assignedToId: operator.id,
          status,
          dueAt: new Date(Date.now() + (index - 2) * 60 * 60 * 1000),
          startedAt: index % 3 === 0 ? new Date(Date.now() - 60 * 60 * 1000) : null,
          completedAt: status === "COMPLETED" ? new Date(Date.now() - 30 * 60 * 1000) : null,
          score: status === "COMPLETED" ? 98.6 : null,
          notes: status === "COMPLETED" ? "Execução concluída sem bloqueios operacionais." : null
        },
        include: { template: { include: { items: { where: { active: true } } } } }
      });

      if (status === "COMPLETED") {
        await prisma.inspectionAnswer.createMany({
          data: inspection.template.items.map((item) => ({
            inspectionId: inspection.id,
            itemId: item.id,
            value: "Conforme",
            compliant: true,
            note: "Verificado em campo."
          })),
          skipDuplicates: true
        });
      }
    }
  }

  const existingNonConformities = await prisma.nonConformity.count({
    where: { tenantId: tenant.id }
  });

  if (existingNonConformities < 4) {
    await prisma.nonConformity.createMany({
      data: [
        {
          tenantId: tenant.id,
          code: "NC-0001",
          title: "Vazamento identificado na caldeira",
          description: "Pequeno vazamento observado durante inspeção de rotina.",
          severity: "HIGH",
          status: "OPEN",
          dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          reportedById: operator.id,
          assignedToId: savedUsers[3]?.id ?? admin.id,
          equipmentId: equipments[1]?.id,
          checklistId: checklists[1]?.id
        },
        {
          tenantId: tenant.id,
          code: "NC-0002",
          title: "Proteção danificada em ponte rolante",
          description: "Proteção lateral requer substituição antes da próxima operação crítica.",
          severity: "CRITICAL",
          status: "IN_TREATMENT",
          dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          reportedById: savedUsers[4]?.id ?? operator.id,
          assignedToId: savedUsers[5]?.id ?? admin.id,
          equipmentId: equipments[3]?.id,
          checklistId: checklists[4]?.id,
          rootCause: "Desgaste mecânico",
          correctiveAction: "Substituir proteção e validar fixação"
        },
        {
          tenantId: tenant.id,
          code: "NC-0003",
          title: "Etiqueta de identificação ilegível",
          description: "TAG do equipamento parcialmente ilegível.",
          severity: "LOW",
          status: "RESOLVED",
          dueAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          resolvedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
          reportedById: operator.id,
          assignedToId: operator.id,
          equipmentId: equipments[2]?.id,
          checklistId: checklists[2]?.id,
          correctiveAction: "Etiqueta substituída"
        }
      ],
      skipDuplicates: true
    });
  }

  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: admin.id,
      action: "DEMO_SEED",
      resource: "System",
      metadata: {
        safe: true
      }
    }
  });

  console.log("Seed concluído.");
  console.log("Login demo: admin@veriq.local");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
