"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  Filter,
  MoreVertical,
  PlayCircle,
  Search,
  Star,
  Timer,
  TriangleAlert
} from "lucide-react";
import { scheduleInspectionAction, startInspectionAction } from "@/app/actions/inspections";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/ui/kpi-card";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import type { InspectionsData } from "@/lib/data/queries";
import { mapCriticality, mapInspectionStatus } from "@/lib/data/queries";
import { formatDateTime } from "@/lib/utils";

type InspectionItem = InspectionsData["items"][number];
type Tab = "all" | "pending" | "in_progress" | "overdue" | "scheduled" | "completed";

const tabStatus: Record<Tab, string[]> = {
  all: [],
  pending: ["PENDING"],
  in_progress: ["IN_PROGRESS"],
  overdue: ["OVERDUE"],
  scheduled: ["SCHEDULED"],
  completed: ["COMPLETED"]
};

export function InspectionsClient({ data }: { data: InspectionsData }) {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [actionsOpen, setActionsOpen] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [sortBy, setSortBy] = useState("dueAt");

  const selectedView = data.items.find((item) => item.id === viewId);
  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const result = data.items.filter((item) => {
      const matchesText =
        !normalized ||
        [item.checklist, item.code, item.blockName, item.equipment, item.tag, item.category, item.assignedTo]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      const statuses = tabStatus[tab];
      const matchesTab = statuses.length === 0 || statuses.includes(item.status);
      return matchesText && matchesTab;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "checklist") {
        return a.checklist.localeCompare(b.checklist, "pt-BR");
      }
      if (sortBy === "equipment") {
        return a.equipment.localeCompare(b.equipment, "pt-BR");
      }
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    });
  }, [data.items, query, sortBy, tab]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-normal text-primary-dark">Checklists operador</h1>
          <p className="mt-1 text-sm text-ink-muted">Execute checklists liberados e acompanhe o andamento das rotinas.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar checklists..."
            icon={<Search className="h-4 w-4" />}
            className="h-12 w-72"
          />
          <Button variant="secondary">
            <Filter className="h-4 w-4" aria-hidden="true" />
            Filtros
          </Button>
          <Button variant="secondary">
            <CalendarRange className="h-4 w-4" aria-hidden="true" />
            Turno atual
          </Button>
          <Button onClick={() => setScheduleOpen(true)}>
            Agendar checklist
          </Button>
        </div>
      </div>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={ClipboardCheck} label="Minhas pendentes" value={String(data.totals.pending)} change="Aguardando execução" tone="info" />
        <KpiCard icon={PlayCircle} label="Em andamento" value={String(data.totals.inProgress)} change="Execuções abertas" tone="warning" />
        <KpiCard icon={CheckCircle2} label="Concluídas" value={String(data.totals.completed)} change="Histórico finalizado" tone="success" />
        <KpiCard icon={Timer} label="Vencendo agora" value={String(data.totals.overdue)} change="Atenção necessária" trend="down" tone="danger" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader>
            <h2 className="font-display text-base font-bold text-primary-dark">Checklists disponíveis para execução</h2>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="veriq-focus h-9 rounded-md border border-border-strong bg-white px-3 text-xs font-semibold text-primary"
            >
              <option value="dueAt">Ordenar por prazo</option>
              <option value="checklist">Ordenar por checklist</option>
              <option value="equipment">Ordenar por equipamento</option>
            </select>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-3">
              {[
                ["all", "Todos", data.items.length],
                ["pending", "Pendentes", data.totals.pending],
                ["in_progress", "Em andamento", data.totals.inProgress],
                ["overdue", "Atrasados", data.totals.overdue],
                ["scheduled", "Agendados", data.items.filter((item) => item.status === "SCHEDULED").length]
              ].map(([value, label, count]) => (
                <button
                  key={String(value)}
                  type="button"
                  onClick={() => setTab(value as Tab)}
                  className={`veriq-focus inline-flex h-9 items-center gap-2 rounded-sm border px-4 text-sm font-semibold ${
                    tab === value ? "border-blue-300 bg-blue-50 text-blue-700" : "border-border bg-white text-primary hover:bg-slate-50"
                  }`}
                >
                  {label === "Agendados" ? <Star className="h-4 w-4 text-warning" aria-hidden="true" /> : null}
                  {label}
                  <span className="rounded-sm bg-slate-100 px-1.5 py-0.5 text-xs text-ink-muted">{String(count)}</span>
                </button>
              ))}
            </div>

            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">Checklist</th>
                    <th className="px-4 py-3">Bloco</th>
                    <th className="px-4 py-3">Equipamento / Área</th>
                    <th className="px-4 py-3">Prazo</th>
                    <th className="px-4 py-3">Tempo</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 place-items-center rounded-md bg-cyan-50 text-accent-dark">
                            <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <span>
                            <span className="block font-bold text-primary-dark">{item.checklist}</span>
                            <span className="text-xs text-ink-muted">ID: {item.code} • {item.itemCount} itens</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-primary">{item.blockName}</td>
                      <td className="px-4 py-4">
                        <span className="block font-semibold text-primary">{item.equipment}</span>
                        <span className="text-xs text-ink-muted">{item.tag}</span>
                      </td>
                      <td className="px-4 py-4 text-primary">{formatDateTime(item.dueAt)}</td>
                      <td className="px-4 py-4 text-primary">{item.estimatedMinutes} min</td>
                      <td className="px-4 py-4"><StatusBadge status={mapInspectionStatus(item.status)} /></td>
                      <td className="px-4 py-4">
                        <div className="relative flex justify-end gap-2">
                          {item.status === "COMPLETED" ? (
                            <Link href={`/inspecoes/${item.id}`} className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-xs font-semibold text-white">
                              Ver execução
                            </Link>
                          ) : (
                            <form action={startInspectionAction}>
                              <input type="hidden" name="inspectionId" value={item.id} />
                              <Button size="sm" type="submit">Realizar checklist</Button>
                            </form>
                          )}
                          <button
                            type="button"
                            className="veriq-focus grid h-9 w-9 place-items-center rounded-sm border border-border hover:bg-slate-50"
                            onClick={() => setViewId(item.id)}
                            aria-label="Visualizar checklist"
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="veriq-focus grid h-9 w-9 place-items-center rounded-sm border border-border hover:bg-slate-50"
                            onClick={() => setActionsOpen(actionsOpen === item.id ? null : item.id)}
                            aria-label="Mais ações"
                          >
                            <MoreVertical className="h-4 w-4" aria-hidden="true" />
                          </button>
                          {actionsOpen === item.id ? (
                            <div className="absolute right-0 top-10 z-10 w-48 rounded-lg border border-border bg-white p-2 text-left shadow-card">
                              <Link href={`/inspecoes/${item.id}`} className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-slate-50">
                                Abrir execução
                              </Link>
                              <button type="button" className="w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-primary hover:bg-slate-50" onClick={() => setViewId(item.id)}>
                                Ver itens
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-ink-muted">Mostrando {filteredItems.length} checklists disponíveis</p>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <h2 className="font-display text-base font-bold text-primary-dark">Minhas próximas execuções</h2>
              <Link className="text-xs font-bold text-blue-600" href="/inspecoes">Ver agenda</Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.items.slice(0, 4).map((item) => (
                <button key={item.id} type="button" onClick={() => setViewId(item.id)} className="flex w-full gap-3 text-left">
                  <CalendarDays className="h-5 w-5 text-ink-muted" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold text-primary-dark">{item.equipment}</p>
                    <p className="text-xs text-ink-muted">{formatDateTime(item.dueAt)}</p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <h2 className="font-display text-base font-bold text-primary-dark">Atividades recentes</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.items.slice(0, 4).map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex gap-3">
                  {item.status === "OVERDUE" ? (
                    <TriangleAlert className="h-5 w-5 text-danger" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-accent-dark" aria-hidden="true" />
                  )}
                  <div>
                    <p className="text-sm font-bold text-primary-dark">{item.checklist}</p>
                    <p className="text-xs text-ink-muted">{item.equipment} • {formatDateTime(item.dueAt)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {selectedView ? <InspectionViewModal item={selectedView} open={Boolean(selectedView)} onClose={() => setViewId(null)} /> : null}
      <ScheduleModal data={data} open={scheduleOpen} onClose={() => setScheduleOpen(false)} />
    </div>
  );
}

function InspectionViewModal({ item, open, onClose }: { item: InspectionItem; open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={item.checklist} description={`${item.blockName} • ${item.equipment}`} size="lg">
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-3">
          {item.items.map((checkItem) => (
            <div key={checkItem.id} className="rounded-md border border-border p-4">
              <div className="flex gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-cyan-50 text-sm font-bold text-accent-dark">
                  {checkItem.position}
                </span>
                <div>
                  <p className="font-semibold text-primary-dark">{checkItem.description}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {checkItem.responseType} • {mapCriticality(checkItem.criticality)} • {checkItem.required ? "Obrigatório" : "Opcional"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-slate-50 p-4 text-sm">
          <Info label="Código" value={item.code} />
          <Info label="Prazo" value={formatDateTime(item.dueAt)} />
          <Info label="Responsável" value={item.assignedTo} />
          <Info label="Tempo estimado" value={`${item.estimatedMinutes} min`} />
          <Info label="Periodicidade" value={item.periodicity} />
        </div>
      </div>
    </Modal>
  );
}

function ScheduleModal({ data, open, onClose }: { data: InspectionsData; open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Agendar checklist"
      description="Crie uma execução vinculada a um checklist e, opcionalmente, a um equipamento."
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="schedule-inspection-form">Agendar</Button>
        </>
      }
      size="md"
    >
      <form id="schedule-inspection-form" action={scheduleInspectionAction} className="grid gap-4">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold text-primary">Checklist *</span>
          <select name="templateId" required className="veriq-focus h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-primary focus:border-accent focus:shadow-glow">
            {data.templates.map((template) => (
              <option key={template.id} value={template.id}>{template.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold text-primary">Equipamento</span>
          <select name="equipmentId" className="veriq-focus h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-primary focus:border-accent focus:shadow-glow">
            <option value="">Área geral</option>
            {data.equipments.map((equipment) => (
              <option key={equipment.id} value={equipment.id}>{equipment.name} ({equipment.tag})</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold text-primary">Responsável</span>
          <select name="assignedToId" className="veriq-focus h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-primary focus:border-accent focus:shadow-glow">
            <option value="">Livre para execução</option>
            {data.users.map((user) => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-semibold text-primary">Prazo *</span>
          <input
            name="dueAt"
            type="datetime-local"
            required
            className="veriq-focus h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-primary focus:border-accent focus:shadow-glow"
          />
        </label>
      </form>
    </Modal>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0">
      <span className="text-ink-muted">{label}</span>
      <span className="text-right font-semibold text-primary-dark">{value}</span>
    </div>
  );
}
