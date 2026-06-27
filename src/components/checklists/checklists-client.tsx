"use client";

import { useState } from "react";
import {
  ClipboardCheck,
  Copy,
  Eye,
  FilePlus2,
  Filter,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2
} from "lucide-react";
import { createChecklistAction } from "@/app/actions/checklists";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/ui/kpi-card";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ChecklistsData } from "@/lib/data/queries";
import { mapChecklistStatus } from "@/lib/data/queries";

export function ChecklistsClient({ data }: { data: ChecklistsData }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-normal text-primary-dark">Checklists</h1>
          <p className="mt-1 text-sm text-ink-muted">Gerencie, organize e acompanhe todos os modelos de checklist</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input placeholder="Buscar checklists..." icon={<Search className="h-4 w-4" />} className="h-12 w-72" />
          <Button variant="secondary">
            <Filter className="h-4 w-4" aria-hidden="true" />
            Filtros
          </Button>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo checklist
          </Button>
        </div>
      </div>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={ClipboardCheck} label="Total de checklists" value={String(data.totals.total)} change="12% vs mês anterior" tone="accent" />
        <KpiCard icon={ClipboardCheck} label="Ativos" value={String(data.totals.active)} change="8% vs mês anterior" tone="success" />
        <KpiCard icon={FilePlus2} label="Rascunhos" value={String(data.totals.drafts)} change="5% vs mês anterior" trend="down" tone="warning" />
        <KpiCard icon={ClipboardCheck} label="Em revisão" value={String(data.totals.review)} change="40% vs ontem" tone="danger" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-base font-bold text-primary-dark">Todos os checklists</h2>
              <span className="rounded-sm bg-slate-100 px-2 py-1 text-xs font-bold text-ink-muted">{data.totals.total}</span>
            </div>
            <Button variant="secondary" size="sm">Ordenar por: Nome</Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">Nome do checklist</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Equipamento/Área</th>
                    <th className="px-4 py-3">Responsável</th>
                    <th className="px-4 py-3">Periodicidade</th>
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
                            <span className="block font-bold text-primary-dark">{item.name}</span>
                            <span className="text-xs text-ink-muted">ID: {item.code}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-medium text-primary">{item.category}</td>
                      <td className="px-4 py-4 text-primary">{item.area}</td>
                      <td className="px-4 py-4 text-primary">{item.responsible}</td>
                      <td className="px-4 py-4 text-primary">{item.periodicity}</td>
                      <td className="px-4 py-4"><StatusBadge status={mapChecklistStatus(item.status)} /></td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2 text-primary">
                          {[Eye, Pencil, Copy, MoreVertical].map((Icon, index) => (
                            <button key={index} className="veriq-focus grid h-9 w-9 place-items-center rounded-sm hover:bg-slate-100">
                              <Icon className="h-4 w-4" aria-hidden="true" />
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-ink-muted">Mostrando 1 a {data.items.length} de {data.totals.total} checklists</p>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <h2 className="font-display text-base font-bold text-primary-dark">Mais utilizados</h2>
              <a className="text-xs font-bold text-blue-600" href="/relatorios">Ver todos</a>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.mostUsed.map((item, index) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="w-4 text-sm font-bold text-primary">{index + 1}</span>
                  <span className="grid h-8 w-8 place-items-center rounded-sm bg-cyan-50 text-accent-dark">
                    <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-primary-dark">{item.name}</span>
                    <span className="text-xs text-ink-muted">Executado {item.executions} vezes</span>
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <h2 className="font-display text-base font-bold text-primary-dark">Modelos recentes</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex gap-3">
                  <FilePlus2 className="h-5 w-5 text-ink-muted" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold text-primary-dark">{item.name}</p>
                    <p className="text-xs text-ink-muted">Criado recentemente</p>
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
        title="Novo checklist"
        description="Cadastre um novo modelo de checklist operacional ou de equipamento."
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" form="create-checklist-form">Criar checklist</Button>
          </>
        }
      >
        <form id="create-checklist-form" action={createChecklistAction} className="space-y-5">
          <div className="rounded-lg border border-border p-5">
            <h3 className="font-display text-base font-bold text-primary-dark">1. Informações gerais</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Nome do checklist *" name="name" placeholder="Ex.: Checklist diário de empilhadeira" />
              <Field label="Categoria *" name="category" placeholder="Ex.: Empilhadeiras" />
              <Field label="Equipamento / Área *" name="area" placeholder="Ex.: EMP-02 / Logística" />
              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-primary">Periodicidade *</span>
                <select name="periodicity" className="veriq-focus h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-primary focus:border-accent focus:shadow-glow" defaultValue="Diária">
                  <option>Diária</option>
                  <option>Semanal</option>
                  <option>Quinzenal</option>
                  <option>Mensal</option>
                </select>
              </label>
              <Field label="Tempo estimado (min) *" name="estimatedMinutes" type="number" placeholder="30" defaultValue="30" />
              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs font-semibold text-primary">Descrição / Objetivo</span>
                <textarea name="description" className="veriq-focus min-h-24 w-full rounded-md border border-border-strong bg-white px-3 py-3 text-sm text-primary placeholder:text-ink-disabled focus:border-accent focus:shadow-glow" placeholder="Descreva o objetivo deste checklist..." />
              </label>
            </div>
          </div>
          <div className="rounded-lg border border-border p-5">
            <h3 className="font-display text-base font-bold text-primary-dark">2. Itens iniciais</h3>
            <div className="mt-4 grid gap-3">
              {["Verificar nível de óleo", "Inspecionar vazamentos", "Conferir proteções e guardas"].map((item, index) => (
                <div key={item} className="grid grid-cols-[48px_1fr_120px_80px] items-center gap-3 rounded-md border border-border bg-slate-50 px-3 py-2 text-sm">
                  <span className="grid h-8 w-8 place-items-center rounded-sm border border-border bg-white font-bold text-primary">{index + 1}</span>
                  <span className="font-medium text-primary">{item}</span>
                  <span className="text-ink-muted">Sim/Não</span>
                  <button type="button" className="grid h-8 w-8 place-items-center rounded-sm text-danger hover:bg-red-50">
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  defaultValue
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-primary">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="veriq-focus h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-primary placeholder:text-ink-disabled focus:border-accent focus:shadow-glow"
      />
    </label>
  );
}

