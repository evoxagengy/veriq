import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Factory,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { ConformityAreaChart, InspectionStatusDonut } from "@/components/charts/dashboard-charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getDashboardData, mapEquipmentStatus, mapInspectionStatus } from "@/lib/data/queries";
import { requireSession } from "@/lib/auth/session";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/utils";

export const metadata = {
  title: "Dashboard"
};

const kpiIcons = [CalendarCheck2, Clock3, AlertTriangle, ShieldCheck, Factory];

export default async function DashboardPage() {
  const session = await requireSession();
  const data = await getDashboardData(session.user.tenantId);
  const kpis = [
    {
      label: "Checklists concluídos",
      value: formatNumber(data.kpis.checklistsCompleted),
      change: "12,5% vs período anterior",
      tone: "bg-cyan-50 text-accent"
    },
    {
      label: "Pendentes hoje",
      value: formatNumber(data.kpis.pendingToday),
      change: "8,3% vs ontem",
      tone: "bg-sky-50 text-blue-600"
    },
    {
      label: "Não conformidades",
      value: formatNumber(data.kpis.nonConformities),
      change: "10,0% vs período anterior",
      tone: "bg-red-50 text-danger"
    },
    {
      label: "Taxa de conformidade",
      value: `${formatPercent(data.kpis.conformityRate)}%`,
      change: "2,1% vs período anterior",
      tone: "bg-emerald-50 text-success"
    },
    {
      label: "Equipamentos monitorados",
      value: formatNumber(data.kpis.equipmentsMonitored),
      change: "Ativos acompanhados",
      tone: "bg-violet-50 text-violet-600"
    }
  ];

  return (
    <div className="h-[calc(100vh-6.75rem)] overflow-hidden space-y-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-normal text-primary-dark">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-muted">Visão geral das operações e conformidade</p>
        </div>
      </div>

      <section className="grid gap-3 xl:grid-cols-5">
        {kpis.map((kpi, index) => {
          const Icon = kpiIcons[index];
          return (
            <Card key={kpi.label} className="flex min-h-24 items-center gap-4 p-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${kpi.tone}`}>
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-primary">{kpi.label}</p>
                <p className="mt-1 font-display text-2xl font-bold tracking-normal text-primary-dark">{kpi.value}</p>
                <p className="mt-1 truncate text-[11px] font-medium text-accent-dark">{kpi.change}</p>
              </div>
            </Card>
          );
        })}
      </section>

      <section className="grid min-h-0 gap-3 xl:grid-cols-[1.35fr_.85fr_.72fr]">
        <Card className="min-h-0">
          <CardHeader className="py-4">
            <div>
              <h2 className="font-display text-base font-bold text-primary-dark">Conformidade por período</h2>
              <p className="mt-1 text-xs text-ink-muted">Últimos 7 dias</p>
            </div>
            <Button variant="secondary" size="sm">Últimos 7 dias</Button>
          </CardHeader>
          <CardContent className="[&>div]:h-44">
            <ConformityAreaChart />
          </CardContent>
        </Card>

        <Card className="min-h-0">
          <CardHeader className="py-4">
            <h2 className="font-display text-base font-bold text-primary-dark">Status das inspeções</h2>
          </CardHeader>
          <CardContent className="[&>div]:gap-2 [&>div]:md:grid-cols-1 [&_div.relative]:h-40">
            <InspectionStatusDonut />
          </CardContent>
        </Card>

        <div className="grid gap-3">
          <Card>
            <CardHeader className="py-4">
              <h2 className="font-display text-base font-bold text-primary-dark">Atividades recentes</h2>
              <Link className="text-xs font-bold text-blue-600" href="/inspecoes">Ver todas</Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.inspections.slice(0, 3).map((inspection) => (
                <div key={inspection.id} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent-dark" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-primary-dark">{inspection.checklist}</p>
                    <p className="text-xs text-ink-muted">{inspection.area} • {formatDateTime(inspection.dueAt)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-4">
              <h2 className="font-display text-base font-bold text-primary-dark">Alertas</h2>
              <Link className="text-xs font-bold text-blue-600" href="/inspecoes">Ver todos</Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                [`${data.kpis.pendingToday} checklists pendentes`, "Requerem atenção operacional", "danger"],
                [`${data.kpis.nonConformities} ocorrências abertas`, "Acompanhe no fluxo de execução", "warning"]
              ].map(([title, text, variant]) => (
                <div key={title} className="flex gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold text-primary-dark">{title}</p>
                    <p className="text-xs text-ink-muted">{text}</p>
                  </div>
                  <Badge variant={variant as "danger" | "warning"} className="ml-auto h-fit">
                    novo
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid min-h-0 gap-3 xl:grid-cols-[1.5fr_.75fr]">
        <Card className="min-h-0">
          <CardHeader className="py-4">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-base font-bold text-primary-dark">Checklists pendentes</h2>
              <Badge variant="danger">{data.inspections.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-md border border-border">
              <div className="grid grid-cols-[1.15fr_.95fr_.9fr_.8fr_.65fr_.55fr] bg-slate-50 px-4 py-2 text-xs font-bold text-ink-muted">
                <span>Checklist</span>
                <span>Equipamento / Setor</span>
                <span>Responsável</span>
                <span>Prazo</span>
                <span>Status</span>
                <span>Ação</span>
              </div>
              {data.inspections.slice(0, 4).map((inspection) => (
                <div key={inspection.id} className="grid grid-cols-[1.15fr_.95fr_.9fr_.8fr_.65fr_.55fr] items-center border-t border-border px-4 py-3 text-sm">
                  <span className="truncate font-semibold text-primary-dark">{inspection.checklist}</span>
                  <span className="truncate text-primary">{inspection.equipment} / {inspection.area}</span>
                  <span className="truncate text-primary">{inspection.responsible}</span>
                  <span className="text-primary">{formatDateTime(inspection.dueAt)}</span>
                  <StatusBadge status={mapInspectionStatus(inspection.status)} />
                  <Link href="/inspecoes" className="text-sm font-bold text-blue-600">Abrir</Link>
                </div>
              ))}
            </div>
            <Link href="/inspecoes" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-blue-600">
              Ver todos os checklists
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-4">
            <h2 className="font-display text-base font-bold text-primary-dark">Equipamentos críticos</h2>
            <Link className="text-xs font-bold text-blue-600" href="/equipamentos">Ver todos</Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-md border border-border">
              {data.criticalEquipments.slice(0, 5).map((equipment) => (
                <div key={equipment.id} className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-primary-dark">{equipment.name}</p>
                    <p className="text-xs text-ink-muted">{equipment.area}</p>
                  </div>
                  <StatusBadge status={mapEquipmentStatus(equipment.status)} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
