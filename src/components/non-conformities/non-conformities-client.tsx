"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Filter, Plus, Search, ShieldAlert, Timer } from "lucide-react";
import { createNonConformityAction, updateNonConformityAction } from "@/app/actions/non-conformities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/ui/kpi-card";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import type { NonConformitiesData } from "@/lib/data/queries";
import { mapCriticality, mapCriticalityBadge, mapNonConformityStatus, mapNonConformityStatusLabel } from "@/lib/data/queries";
import { formatDate, formatDateTime } from "@/lib/utils";

export function NonConformitiesClient({ data }: { data: NonConformitiesData }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = data.items.find((item) => item.id === selectedId);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-normal text-primary-dark">Não conformidades</h1>
          <p className="mt-1 text-sm text-ink-muted">Registre, trate e acompanhe desvios operacionais com rastreabilidade.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input placeholder="Buscar desvios..." icon={<Search className="h-4 w-4" />} className="h-12 w-72" />
          <Button variant="secondary">
            <Filter className="h-4 w-4" aria-hidden="true" />
            Filtros
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nova ocorrência
          </Button>
        </div>
      </div>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={ShieldAlert} label="Abertas" value={String(data.totals.open)} change="Tratamento pendente" tone="danger" trend="down" />
        <KpiCard icon={Timer} label="Em tratamento" value={String(data.totals.treatment)} change="Planos em execução" tone="warning" />
        <KpiCard icon={CheckCircle2} label="Resolvidas" value={String(data.totals.resolved)} change="Histórico controlado" tone="success" />
        <KpiCard icon={AlertTriangle} label="Críticas" value={String(data.totals.critical)} change="Prioridade máxima" tone="danger" trend="down" />
      </section>

      <Card>
        <CardHeader>
          <h2 className="font-display text-base font-bold text-primary-dark">Ocorrências</h2>
          <Button variant="secondary" size="sm">Ordenar por criticidade</Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold text-ink-muted">
                <tr>
                  <th className="px-4 py-3">Ocorrência</th>
                  <th className="px-4 py-3">Origem</th>
                  <th className="px-4 py-3">Responsável</th>
                  <th className="px-4 py-3">Criticidade</th>
                  <th className="px-4 py-3">Prazo</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="px-4 py-4">
                      <p className="font-bold text-primary-dark">{item.code} • {item.title}</p>
                      <p className="mt-1 line-clamp-1 text-xs text-ink-muted">{item.description}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-primary">{item.equipment}</p>
                      <p className="text-xs text-ink-muted">{item.checklist}</p>
                    </td>
                    <td className="px-4 py-4 text-primary">{item.assignedTo}</td>
                    <td className="px-4 py-4"><Badge variant={mapCriticalityBadge(item.severity)}>{mapCriticality(item.severity)}</Badge></td>
                    <td className="px-4 py-4 text-primary">{formatDate(item.dueAt)}</td>
                    <td className="px-4 py-4"><StatusBadge status={mapNonConformityStatus(item.status)} /></td>
                    <td className="px-4 py-4 text-right">
                      <Button variant="secondary" size="sm" onClick={() => setSelectedId(item.id)}>Tratar</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nova não conformidade"
        description="Registre uma ocorrência com responsável, prazo e vínculo operacional."
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button type="submit" form="create-nc-form">Registrar ocorrência</Button>
          </>
        }
      >
        <form id="create-nc-form" action={createNonConformityAction} className="grid gap-4 md:grid-cols-2">
          <Field label="Título *" name="title" className="md:col-span-2" />
          <label className="block md:col-span-2">
            <span className="mb-2 block text-xs font-semibold text-primary">Descrição *</span>
            <textarea name="description" required className="veriq-focus min-h-24 w-full rounded-md border border-border-strong bg-white px-3 py-3 text-sm text-primary focus:border-accent focus:shadow-glow" />
          </label>
          <Select label="Criticidade *" name="severity" options={[["LOW", "Baixa"], ["MEDIUM", "Média"], ["HIGH", "Alta"], ["CRITICAL", "Crítica"]]} />
          <Select label="Responsável" name="assignedToId" options={data.users.map((user) => [user.id, user.name])} includeEmpty />
          <Select label="Equipamento" name="equipmentId" options={data.equipments.map((equipment) => [equipment.id, `${equipment.name} (${equipment.tag})`])} includeEmpty />
          <Select label="Checklist" name="checklistId" options={data.checklists.map((checklist) => [checklist.id, checklist.name])} includeEmpty />
          <Field label="Prazo" name="dueAt" type="date" />
        </form>
      </Modal>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected ? `${selected.code} • ${selected.title}` : "Tratar ocorrência"}
        description={selected ? `Aberta em ${formatDateTime(selected.createdAt)} por ${selected.reportedBy}` : undefined}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setSelectedId(null)}>Cancelar</Button>
            <Button type="submit" form="update-nc-form">Salvar tratamento</Button>
          </>
        }
      >
        {selected ? (
          <form id="update-nc-form" action={updateNonConformityAction} className="grid gap-4">
            <input type="hidden" name="id" value={selected.id} />
            <div className="rounded-md border border-border bg-slate-50 p-4 text-sm text-primary">{selected.description}</div>
            <Select
              label="Status"
              name="status"
              defaultValue={selected.status}
              options={[
                ["OPEN", mapNonConformityStatusLabel("OPEN")],
                ["IN_TREATMENT", mapNonConformityStatusLabel("IN_TREATMENT")],
                ["RESOLVED", mapNonConformityStatusLabel("RESOLVED")],
                ["CANCELLED", mapNonConformityStatusLabel("CANCELLED")]
              ]}
            />
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-primary">Causa raiz</span>
              <textarea name="rootCause" defaultValue={selected.rootCause ?? ""} className="veriq-focus min-h-20 w-full rounded-md border border-border-strong bg-white px-3 py-3 text-sm text-primary focus:border-accent focus:shadow-glow" />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-primary">Ação corretiva</span>
              <textarea name="correctiveAction" defaultValue={selected.correctiveAction ?? ""} className="veriq-focus min-h-20 w-full rounded-md border border-border-strong bg-white px-3 py-3 text-sm text-primary focus:border-accent focus:shadow-glow" />
            </label>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}

function Field({ label, name, type = "text", className }: { label: string; name: string; type?: string; className?: string }) {
  return (
    <label className={className}>
      <span className="mb-2 block text-xs font-semibold text-primary">{label}</span>
      <input name={name} type={type} className="veriq-focus h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-primary focus:border-accent focus:shadow-glow" />
    </label>
  );
}

function Select({
  label,
  name,
  options,
  includeEmpty = false,
  defaultValue
}: {
  label: string;
  name: string;
  options: Array<[string, string]>;
  includeEmpty?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-primary">{label}</span>
      <select name={name} defaultValue={defaultValue} className="veriq-focus h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-primary focus:border-accent focus:shadow-glow">
        {includeEmpty ? <option value="">Não vincular</option> : null}
        {options.map(([value, labelText]) => (
          <option key={value} value={value}>{labelText}</option>
        ))}
      </select>
    </label>
  );
}

