import { BarChart3, ClipboardCheck, Factory, ShieldAlert, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge } from "@/components/ui/badge";
import { requireSession } from "@/lib/auth/session";
import { getReportsData } from "@/lib/data/queries";
import { formatDateTime, formatPercent } from "@/lib/utils";

export const metadata = {
  title: "Relatórios"
};

export default async function ReportsPage() {
  const session = await requireSession();
  const data = await getReportsData(session.user.tenantId);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-normal text-primary-dark">Relatórios</h1>
        <p className="mt-1 text-sm text-ink-muted">Analise conformidade, desempenho operacional, históricos e tendências.</p>
      </div>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={ClipboardCheck} label="Inspeções" value={String(data.totals.inspections)} change={`${data.totals.completed} concluídas`} tone="accent" />
        <KpiCard icon={TrendingUp} label="Conformidade média" value={`${formatPercent(data.totals.avgScore)}%`} change="Score médio" tone="success" />
        <KpiCard icon={ShieldAlert} label="Não conformidades" value={String(data.totals.nonConformities)} change="Histórico do tenant" tone="danger" trend="down" />
        <KpiCard icon={Factory} label="Equipamentos" value={String(data.totals.equipments)} change={`${data.totals.checklists} modelos`} tone="info" />
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <ReportCard title="Inspeções por status" items={data.inspectionsByStatus} />
        <ReportCard title="Não conformidades por criticidade" items={data.nonConformitiesBySeverity} />
        <ReportCard title="Equipamentos por status" items={data.equipmentsByStatus} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <h2 className="font-display text-base font-bold text-primary-dark">Modelos de checklist</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.topChecklists.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-md border border-border p-4">
                <div>
                  <p className="font-bold text-primary-dark">{item.name}</p>
                  <p className="mt-1 text-xs text-ink-muted">{item.items} itens cadastrados</p>
                </div>
                <Badge variant="accent">Modelo</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-display text-base font-bold text-primary-dark">Auditoria recente</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentAudits.map((audit) => (
              <div key={audit.id} className="rounded-md border border-border p-3">
                <p className="text-sm font-bold text-primary-dark">{audit.action}</p>
                <p className="mt-1 text-xs text-ink-muted">{audit.user} • {audit.resource} • {formatDateTime(audit.createdAt)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function ReportCard({ title, items }: { title: string; items: Array<{ name: string; count: number }> }) {
  const total = Math.max(items.reduce((sum, item) => sum + item.count, 0), 1);

  return (
    <Card>
      <CardHeader>
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-primary-dark">
          <BarChart3 className="h-5 w-5 text-accent-dark" aria-hidden="true" />
          {title}
        </h2>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-ink-muted">Sem dados suficientes.</p>
        ) : (
          items.map((item) => (
            <div key={item.name}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-primary">{item.name}</span>
                <span className="text-ink-muted">{item.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max((item.count / total) * 100, 4)}%` }} />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

