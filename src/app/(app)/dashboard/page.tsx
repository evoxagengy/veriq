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
import { KpiCard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getDashboardData, mapEquipmentStatus, mapInspectionStatus } from "@/lib/data/queries";
import { requireSession } from "@/lib/auth/session";
import { formatNumber, formatPercent } from "@/lib/utils";

export const metadata = {
  title: "Dashboard"
};

export default async function DashboardPage() {
  const session = await requireSession();
  const data = await getDashboardData(session.user.tenantId);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-normal text-primary-dark">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-muted">Visão geral das operações e conformidade</p>
        </div>
      </div>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          icon={CalendarCheck2}
          label="Checklists concluídos"
          value={formatNumber(data.kpis.checklistsCompleted)}
          change="12,5% vs período anterior"
          tone="accent"
        />
        <KpiCard
          icon={Clock3}
          label="Pendentes hoje"
          value={formatNumber(data.kpis.pendingToday)}
          change="8,3% vs ontem"
          trend="down"
          tone="info"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Não conformidades"
          value={formatNumber(data.kpis.nonConformities)}
          change="10,0% vs período anterior"
          trend="down"
          tone="danger"
        />
        <KpiCard
          icon={ShieldCheck}
          label="Taxa de conformidade"
          value={`${formatPercent(data.kpis.conformityRate)}%`}
          change="2,1% vs período anterior"
          tone="success"
        />
        <KpiCard
          icon={Factory}
          label="Equipamentos monitorados"
          value={formatNumber(data.kpis.equipmentsMonitored)}
          change="4 novos este mês"
          tone="violet"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.6fr_.9fr_.8fr]">
        <Card className="xl:col-span-1">
          <CardHeader>
            <div>
              <h2 className="font-display text-base font-bold text-primary-dark">Conformidade por período</h2>
              <p className="mt-1 text-xs text-ink-muted">Últimos 7 dias</p>
            </div>
            <Button variant="secondary" size="sm">Últimos 7 dias</Button>
          </CardHeader>
          <CardContent>
            <ConformityAreaChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-display text-base font-bold text-primary-dark">Status das inspeções</h2>
          </CardHeader>
          <CardContent>
            <InspectionStatusDonut />
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <h2 className="font-display text-base font-bold text-primary-dark">Atividades recentes</h2>
              <Link className="text-xs font-bold text-blue-600" href="/inspecoes">Ver todas</Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.inspections.slice(0, 4).map((inspection) => (
                <div key={inspection.id} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent-dark" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold text-primary-dark">{inspection.checklist}</p>
                    <p className="text-xs text-ink-muted">{inspection.area} • hoje</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <h2 className="font-display text-base font-bold text-primary-dark">Alertas</h2>
              <a className="text-xs font-bold text-blue-600" href="/nao-conformidades">Ver todos</a>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ["3 checklists atrasados", "Requerem atenção imediata", "danger"],
                ["2 não conformidades críticas", "Aguardando tratamento", "warning"],
                ["5 manutenções próximas", "Nos próximos 7 dias", "info"]
              ].map(([title, text, variant]) => (
                <div key={title} className="flex gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold text-primary-dark">{title}</p>
                    <p className="text-xs text-ink-muted">{text}</p>
                  </div>
                  <Badge variant={variant as "danger" | "warning" | "info"} className="ml-auto h-fit">
                    novo
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.5fr_.75fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-base font-bold text-primary-dark">Checklists pendentes</h2>
              <Badge variant="danger">{data.inspections.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-md border border-border">
              <div className="grid grid-cols-[1.2fr_1fr_.9fr_.7fr_.7fr_.7fr] bg-slate-50 px-4 py-3 text-xs font-bold text-ink-muted">
                <span>Checklist</span>
                <span>Equipamento / Setor</span>
                <span>Responsável</span>
                <span>Prazo</span>
                <span>Status</span>
                <span>Ação</span>
              </div>
              {data.inspections.slice(0, 5).map((inspection) => (
                <div key={inspection.id} className="grid grid-cols-[1.2fr_1fr_.9fr_.7fr_.7fr_.7fr] items-center border-t border-border px-4 py-4 text-sm">
                  <span className="font-semibold text-primary-dark">{inspection.checklist}</span>
                  <span className="text-primary">{inspection.equipment} / {inspection.area}</span>
                  <span className="text-primary">{inspection.responsible}</span>
                  <span className="text-primary">Hoje, 08:00</span>
                  <StatusBadge status={mapInspectionStatus(inspection.status)} />
                  <Button variant="secondary" size="sm">Executar</Button>
                </div>
              ))}
            </div>
            <Link href="/inspecoes" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-600">
              Ver todos os checklists pendentes
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-display text-base font-bold text-primary-dark">Equipamentos críticos</h2>
            <Link className="text-xs font-bold text-blue-600" href="/equipamentos">Ver todos</Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-md border border-border">
              {data.criticalEquipments.map((equipment) => (
                <div key={equipment.id} className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0">
                  <div>
                    <p className="text-sm font-bold text-primary-dark">{equipment.name}</p>
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
