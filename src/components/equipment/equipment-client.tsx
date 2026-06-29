"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Copy,
  Eye,
  Filter,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Wrench
} from "lucide-react";
import { createEquipmentAction } from "@/app/actions/equipment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/ui/kpi-card";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import type { EquipmentData } from "@/lib/data/queries";
import { mapCriticality, mapEquipmentStatus } from "@/lib/data/queries";

export function EquipmentClient({ data }: { data: EquipmentData }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-normal text-primary-dark">Equipamentos</h1>
          <p className="mt-1 text-sm text-ink-muted">Gerencie seus ativos e acompanhe o monitoramento operacional.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input placeholder="Buscar equipamentos..." icon={<Search className="h-4 w-4" />} className="h-12 w-72" />
          <Button variant="secondary">
            <Filter className="h-4 w-4" aria-hidden="true" />
            Filtros
          </Button>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo equipamento
          </Button>
        </div>
      </div>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Wrench} label="Total de equipamentos" value={String(data.totals.total)} change="8% vs mês anterior" tone="accent" />
        <KpiCard icon={ShieldCheck} label="Operando" value={String(data.totals.operating)} change="7% vs mês anterior" tone="success" />
        <KpiCard icon={Wrench} label="Em manutenção" value={String(data.totals.maintenance)} change="5% vs mês anterior" trend="down" tone="warning" />
        <KpiCard icon={AlertTriangle} label="Críticos" value={String(data.totals.critical)} change="2% vs mês anterior" trend="down" tone="danger" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-base font-bold text-primary-dark">Todos os equipamentos</h2>
              <span className="rounded-sm bg-slate-100 px-2 py-1 text-xs font-bold text-ink-muted">{data.totals.total}</span>
            </div>
            <Button variant="secondary" size="sm">Ordenar por: Criticidade</Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">Equipamento</th>
                    <th className="px-4 py-3">Tag / Código</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Área / Setor</th>
                    <th className="px-4 py-3">Responsável</th>
                    <th className="px-4 py-3">Criticidade</th>
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
                            <Wrench className="h-5 w-5" aria-hidden="true" />
                          </span>
                          <span>
                            <span className="block font-bold text-primary-dark">{item.name}</span>
                            <span className="text-xs text-ink-muted">Modelo: {item.model ?? "Não informado"}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-medium text-primary">{item.tag}</td>
                      <td className="px-4 py-4 text-primary">{item.category}</td>
                      <td className="px-4 py-4 text-primary">{item.area}</td>
                      <td className="px-4 py-4 text-primary">{item.responsible}</td>
                      <td className="px-4 py-4 text-primary">{mapCriticality(item.criticality)}</td>
                      <td className="px-4 py-4"><StatusBadge status={mapEquipmentStatus(item.status)} /></td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2 text-primary">
                          <Link href={`/equipamentos/${item.id}`} className="veriq-focus grid h-9 w-9 place-items-center rounded-sm hover:bg-slate-100" aria-label="Visualizar equipamento">
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          {[Pencil, Copy, MoreVertical].map((Icon, index) => (
                            <button key={index} className="veriq-focus grid h-9 w-9 place-items-center rounded-sm hover:bg-slate-100" type="button">
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
            <p className="mt-4 text-sm text-ink-muted">Mostrando 1 a {data.items.length} de {data.totals.total} equipamentos</p>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <h2 className="font-display text-base font-bold text-primary-dark">Equipamentos críticos</h2>
              <Link className="text-xs font-bold text-blue-600" href="/equipamentos">Ver todos</Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.criticalItems.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold text-primary-dark">{item.name}</p>
                    <p className="text-xs text-ink-muted">{item.tag} • {item.area}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <h2 className="font-display text-base font-bold text-primary-dark">Categorias</h2>
              <a className="text-xs font-bold text-blue-600" href="/relatorios">Ver todas</a>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.categories.map((category) => (
                <div key={category.name} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-primary">{category.name}</span>
                  <span className="text-ink-muted">{category.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Novo equipamento"
        description="Cadastre um novo ativo para monitoramento, inspeção e controle operacional."
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" form="create-equipment-form">Cadastrar equipamento</Button>
          </>
        }
      >
        <form id="create-equipment-form" action={createEquipmentAction} className="space-y-5">
          <div className="rounded-lg border border-border p-5">
            <h3 className="font-display text-base font-bold text-primary-dark">1. Informações gerais</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Nome do equipamento *" name="name" placeholder="Ex.: Empilhadeira Hyster H2.5" />
              <Field label="Tag / Código *" name="tag" placeholder="Ex.: EMP-02" />
              <Field label="Categoria *" name="category" placeholder="Ex.: Empilhadeiras" />
              <Field label="Modelo" name="model" placeholder="Ex.: H2.5FT" />
              <Field label="Fabricante" name="manufacturer" placeholder="Ex.: Hyster" />
              <Field label="Área / Setor *" name="area" placeholder="Ex.: Logística" />
              <Field label="Localização" name="location" placeholder="Ex.: Galpão 01 - Área A" />
              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-primary">Status operacional *</span>
                <select name="status" className="veriq-focus h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-primary focus:border-accent focus:shadow-glow" defaultValue="OPERATING">
                  <option value="OPERATING">Operando</option>
                  <option value="MAINTENANCE">Em manutenção</option>
                  <option value="ATTENTION">Atenção</option>
                  <option value="CRITICAL">Crítico</option>
                  <option value="INACTIVE">Inativo</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-primary">Criticidade *</span>
                <select name="criticality" className="veriq-focus h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-primary focus:border-accent focus:shadow-glow" defaultValue="MEDIUM">
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                  <option value="CRITICAL">Crítica</option>
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs font-semibold text-primary">Descrição / Observações</span>
                <textarea name="description" className="veriq-focus min-h-24 w-full rounded-md border border-border-strong bg-white px-3 py-3 text-sm text-primary placeholder:text-ink-disabled focus:border-accent focus:shadow-glow" placeholder="Descreva função, características e observações relevantes..." />
              </label>
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
  placeholder
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-primary">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        className="veriq-focus h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-primary placeholder:text-ink-disabled focus:border-accent focus:shadow-glow"
      />
    </label>
  );
}
