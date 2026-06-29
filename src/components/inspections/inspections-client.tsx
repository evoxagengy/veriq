"use client";

import { useState } from "react";
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
import { mapInspectionStatus } from "@/lib/data/queries";
import { formatDateTime } from "@/lib/utils";

export function InspectionsClient({ data }: { data: InspectionsData }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-normal text-primary-dark">Inspeções</h1>
          <p className="mt-1 text-sm text-ink-muted">Execute checklists permitidos e acompanhe o andamento das inspeções.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input placeholder="Buscar inspeções..." icon={<Search className="h-4 w-4" />} className="h-12 w-72" />
          <Button variant="secondary">
            <Filter className="h-4 w-4" aria-hidden="true" />
            Filtros
          </Button>
          <Button variant="secondary">
            <CalendarRange className="h-4 w-4" aria-hidden="true" />
            Turno atual
          </Button>
          <Button onClick={() => setOpen(true)}>
            Agendar inspeção
          </Button>
        </div>
      </div>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={ClipboardCheck} label="Minhas pendentes" value={String(data.totals.pending)} change="9% vs ontem" tone="info" />
        <KpiCard icon={PlayCircle} label="Em andamento" value={String(data.totals.inProgress)} change="2 vs ontem" tone="warning" />
        <KpiCard icon={CheckCircle2} label="Concluídas hoje" value={String(data.totals.completed)} change="28% vs ontem" tone="success" />
        <KpiCard icon={Timer} label="Vencendo agora" value={String(data.totals.overdue)} change="Atenção necessária" trend="down" tone="danger" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader>
            <h2 className="font-display text-base font-bold text-primary-dark">Checklists disponíveis para execução</h2>
            <Button variant="secondary" size="sm">Ordenar por: Prazo</Button>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-3">
              {[
                ["Todos", data.items.length],
                ["Pendentes", data.totals.pending],
                ["Em andamento", data.totals.inProgress],
                ["Atrasados", data.totals.overdue],
                ["Favoritos", 4]
              ].map(([label, count], index) => (
                <button
                  key={label}
                  className={`veriq-focus inline-flex h-9 items-center gap-2 rounded-sm border px-4 text-sm font-semibold ${
                    index === 0 ? "border-blue-300 bg-blue-50 text-blue-700" : "border-border bg-white text-primary hover:bg-slate-50"
                  }`}
                >
                  {label === "Favoritos" ? <Star className="h-4 w-4 text-warning" aria-hidden="true" /> : null}
                  {label}
                  <span className="rounded-sm bg-slate-100 px-1.5 py-0.5 text-xs text-ink-muted">{count}</span>
                </button>
              ))}
            </div>

            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">Checklist</th>
                    <th className="px-4 py-3">Equipamento / Área</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Periodicidade</th>
                    <th className="px-4 py-3">Prazo</th>
                    <th className="px-4 py-3">Tempo estimado</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr key={item.id} className="border-t border-border">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 place-items-center rounded-md bg-cyan-50 text-accent-dark">
                            <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <span>
                            <span className="block font-bold text-primary-dark">{item.checklist}</span>
                            <span className="text-xs text-ink-muted">ID: {item.code}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="block font-semibold text-primary">{item.equipment}</span>
                        <span className="text-xs text-ink-muted">{item.tag}</span>
                      </td>
                      <td className="px-4 py-4 text-primary">{item.category}</td>
                      <td className="px-4 py-4 text-primary">{item.periodicity}</td>
                      <td className="px-4 py-4 text-primary">{formatDateTime(item.dueAt)}</td>
                      <td className="px-4 py-4 text-primary">{item.estimatedMinutes} min</td>
                      <td className="px-4 py-4"><StatusBadge status={mapInspectionStatus(item.status)} /></td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <form action={startInspectionAction}>
                            <input type="hidden" name="inspectionId" value={item.id} />
                            <Button size="sm" type="submit">Realizar checklist</Button>
                          </form>
                          <button className="veriq-focus grid h-9 w-9 place-items-center rounded-sm border border-border hover:bg-slate-50">
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button className="veriq-focus grid h-9 w-9 place-items-center rounded-sm border border-border hover:bg-slate-50">
                            <MoreVertical className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-ink-muted">Mostrando 1 a {data.items.length} checklists disponíveis</p>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <h2 className="font-display text-base font-bold text-primary-dark">Minhas próximas inspeções</h2>
              <Link className="text-xs font-bold text-blue-600" href="/inspecoes">Ver agenda</Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.items.slice(0, 4).map((item) => (
                <div key={item.id} className="flex gap-3">
                  <CalendarDays className="h-5 w-5 text-ink-muted" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold text-primary-dark">{item.equipment}</p>
                    <p className="text-xs text-ink-muted">Hoje, 10:00</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <h2 className="font-display text-base font-bold text-primary-dark">Atividades recentes</h2>
              <a className="text-xs font-bold text-blue-600" href="/relatorios">Ver todas</a>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ["Você iniciou a inspeção", "Empilhadeira Hyster H2.5"],
                ["Você concluiu a inspeção", "Extintores - Geral"],
                ["Você pausou a inspeção", "Compressor CP-03"],
                ["Não conformidade registrada", "Caldeira CB-101"]
              ].map(([title, text], index) => (
                <div key={title} className="flex gap-3">
                  {index === 3 ? (
                    <TriangleAlert className="h-5 w-5 text-danger" aria-hidden="true" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-accent-dark" aria-hidden="true" />
                  )}
                  <div>
                    <p className="text-sm font-bold text-primary-dark">{title}</p>
                    <p className="text-xs text-ink-muted">{text} • há {index + 1} h</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Agendar inspeção"
        description="Crie uma execução vinculada a um checklist e, opcionalmente, a um equipamento."
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
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
    </div>
  );
}
