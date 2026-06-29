"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Eye,
  Filter,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Wrench
} from "lucide-react";
import { createEquipmentAction, deactivateEquipmentAction, updateEquipmentAction } from "@/app/actions/equipment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/ui/kpi-card";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import type { EquipmentData } from "@/lib/data/queries";
import { mapCriticality, mapCriticalityBadge, mapEquipmentStatus } from "@/lib/data/queries";
import { formatDateTime } from "@/lib/utils";

type EquipmentItem = EquipmentData["items"][number];

export function EquipmentClient({ data }: { data: EquipmentData }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [actionsOpen, setActionsOpen] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("criticality");

  const selectedView = data.items.find((item) => item.id === viewId);
  const selectedEdit = data.items.find((item) => item.id === editId);

  const filteredItems = useMemo(() => {
    const severity = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    const statusSeverity = { CRITICAL: 5, ATTENTION: 4, MAINTENANCE: 3, OPERATING: 2, INACTIVE: 1 };
    const normalized = query.trim().toLowerCase();
    const result = data.items.filter((item) =>
      !normalized ||
      [item.name, item.tag, item.category, item.area, item.responsible, item.model ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );

    return [...result].sort((a, b) => {
      if (sortBy === "equipment") {
        return a.name.localeCompare(b.name, "pt-BR");
      }
      if (sortBy === "sector") {
        return a.area.localeCompare(b.area, "pt-BR") || a.name.localeCompare(b.name, "pt-BR");
      }
      if (sortBy === "status") {
        return statusSeverity[b.status] - statusSeverity[a.status];
      }
      return severity[b.criticality] - severity[a.criticality] || a.name.localeCompare(b.name, "pt-BR");
    });
  }, [data.items, query, sortBy]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-normal text-primary-dark">Equipamentos</h1>
          <p className="mt-1 text-sm text-ink-muted">Gerencie ativos, responsáveis e vínculo com checklists operacionais.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar equipamentos..."
            icon={<Search className="h-4 w-4" />}
            className="h-12 w-72"
          />
          <Button variant="secondary">
            <Filter className="h-4 w-4" aria-hidden="true" />
            Filtros
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo equipamento
          </Button>
        </div>
      </div>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Wrench} label="Total de equipamentos" value={String(data.totals.total)} change="Ativos cadastrados" tone="accent" />
        <KpiCard icon={ShieldCheck} label="Operando" value={String(data.totals.operating)} change="Com operação liberada" tone="success" />
        <KpiCard icon={Wrench} label="Em manutenção" value={String(data.totals.maintenance)} change="Acompanhamento ativo" trend="down" tone="warning" />
        <KpiCard icon={AlertTriangle} label="Críticos" value={String(data.totals.critical)} change="Exigem atenção" trend="down" tone="danger" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-base font-bold text-primary-dark">Todos os equipamentos</h2>
              <span className="rounded-sm bg-slate-100 px-2 py-1 text-xs font-bold text-ink-muted">{filteredItems.length}</span>
            </div>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="veriq-focus h-9 rounded-md border border-border-strong bg-white px-3 text-xs font-semibold text-primary"
            >
              <option value="criticality">Ordenar por criticidade</option>
              <option value="equipment">Ordenar por equipamento</option>
              <option value="sector">Ordenar por setor</option>
              <option value="status">Ordenar por status</option>
            </select>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
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
                  {filteredItems.map((item) => (
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
                      <td className="px-4 py-4"><Badge variant={mapCriticalityBadge(item.criticality)}>{mapCriticality(item.criticality)}</Badge></td>
                      <td className="px-4 py-4"><StatusBadge status={mapEquipmentStatus(item.status)} /></td>
                      <td className="px-4 py-4">
                        <div className="relative flex justify-end gap-2 text-primary">
                          <button
                            className="veriq-focus grid h-9 w-9 place-items-center rounded-sm hover:bg-slate-100"
                            type="button"
                            aria-label="Visualizar equipamento"
                            onClick={() => setViewId(item.id)}
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            className="veriq-focus grid h-9 w-9 place-items-center rounded-sm hover:bg-slate-100"
                            type="button"
                            aria-label="Editar equipamento"
                            onClick={() => setEditId(item.id)}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            className="veriq-focus grid h-9 w-9 place-items-center rounded-sm hover:bg-slate-100"
                            type="button"
                            aria-label="Mais ações"
                            onClick={() => setActionsOpen(actionsOpen === item.id ? null : item.id)}
                          >
                            <MoreVertical className="h-4 w-4" aria-hidden="true" />
                          </button>
                          {actionsOpen === item.id ? (
                            <div className="absolute right-0 top-10 z-10 w-48 rounded-lg border border-border bg-white p-2 text-left shadow-card">
                              <Link href={`/equipamentos/${item.id}`} className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-slate-50">
                                Abrir histórico
                              </Link>
                              <form action={deactivateEquipmentAction}>
                                <input type="hidden" name="id" value={item.id} />
                                <button type="submit" className="w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-danger hover:bg-red-50">
                                  Desativar ativo
                                </button>
                              </form>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-ink-muted">Mostrando {filteredItems.length} de {data.totals.total} equipamentos</p>
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
                <button key={item.id} type="button" onClick={() => setViewId(item.id)} className="flex w-full items-start gap-3 text-left">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold text-primary-dark">{item.name}</p>
                    <p className="text-xs text-ink-muted">{item.tag} • {item.area}</p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <h2 className="font-display text-base font-bold text-primary-dark">Categorias</h2>
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

      <EquipmentModal open={createOpen} onClose={() => setCreateOpen(false)} mode="create" data={data} />
      {selectedView ? <EquipmentViewModal item={selectedView} open={Boolean(selectedView)} onClose={() => setViewId(null)} /> : null}
      {selectedEdit ? (
        <EquipmentModal
          key={selectedEdit.id}
          open={Boolean(selectedEdit)}
          onClose={() => setEditId(null)}
          mode="edit"
          item={selectedEdit}
          data={data}
        />
      ) : null}
    </div>
  );
}

function EquipmentViewModal({ item, open, onClose }: { item: EquipmentItem; open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={item.name} description={`${item.tag} • ${item.area}`} size="lg">
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="rounded-lg border border-border p-5">
          <h3 className="font-display text-base font-bold text-primary-dark">Resumo operacional</h3>
          <p className="mt-3 text-sm leading-6 text-primary">{item.description ?? "Nenhuma observação cadastrada para este equipamento."}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Metric label="Checklists vinculados" value={String(item.checklistCount)} />
            <Metric label="Ocorrências abertas" value={String(item.openNonConformities)} />
            <Metric label="Próxima inspeção" value={formatDateTime(item.nextInspectionAt)} />
          </div>
        </div>
        <div className="rounded-lg border border-border bg-slate-50 p-4 text-sm">
          <Info label="Modelo" value={item.model ?? "Não informado"} />
          <Info label="Fabricante" value={item.manufacturer ?? "Não informado"} />
          <Info label="Localização" value={item.location ?? "Não informado"} />
          <Info label="Responsável" value={item.responsible} />
          <Info label="Último checklist" value={formatDateTime(item.lastChecklistAt)} />
          <Info label="Status" value={item.status} />
        </div>
      </div>
    </Modal>
  );
}

function EquipmentModal({
  open,
  onClose,
  mode,
  item,
  data
}: {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  item?: EquipmentItem;
  data: EquipmentData;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Novo equipamento" : "Editar equipamento"}
      description="Cadastre o ativo para monitoramento, inspeção e controle operacional."
      size="xl"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form={`${mode}-equipment-form`}>{mode === "create" ? "Cadastrar equipamento" : "Salvar alterações"}</Button>
        </>
      }
    >
      <form id={`${mode}-equipment-form`} action={mode === "create" ? createEquipmentAction : updateEquipmentAction} className="space-y-5">
        {item ? <input type="hidden" name="id" value={item.id} /> : null}
        <div className="rounded-lg border border-border p-5">
          <h3 className="font-display text-base font-bold text-primary-dark">1. Informações gerais</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Nome do equipamento *" name="name" placeholder="Ex.: Empilhadeira Hyster H2.5" defaultValue={item?.name} />
            <Field label="Tag / Código *" name="tag" placeholder="Ex.: EMP-02" defaultValue={item?.tag} />
            <Field label="Categoria *" name="category" placeholder="Ex.: Empilhadeiras" defaultValue={item?.category} />
            <Field label="Modelo" name="model" placeholder="Ex.: H2.5FT" defaultValue={item?.model ?? ""} />
            <Field label="Fabricante" name="manufacturer" placeholder="Ex.: Hyster" defaultValue={item?.manufacturer ?? ""} />
            <Field label="Nº de série" name="serialNumber" placeholder="Ex.: HYS25FT-2024-00125" defaultValue={item?.serialNumber ?? ""} />
            <Field label="Área / Setor *" name="area" placeholder="Ex.: Logística" defaultValue={item?.area} />
            <Field label="Localização" name="location" placeholder="Ex.: Galpão 01 - Área A" defaultValue={item?.location ?? ""} />
            <label className="block xl:col-span-4">
              <span className="mb-2 block text-xs font-semibold text-primary">Descrição / Observações</span>
              <textarea name="description" defaultValue={item?.description ?? ""} className="veriq-focus min-h-24 w-full rounded-md border border-border-strong bg-white px-3 py-3 text-sm text-primary placeholder:text-ink-disabled focus:border-accent focus:shadow-glow" placeholder="Descreva função, características e observações relevantes..." />
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-border p-5">
          <h3 className="font-display text-base font-bold text-primary-dark">2. Operação e responsáveis</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-primary">Responsável principal</span>
              <select name="responsibleId" defaultValue={item?.responsibleId ?? ""} className="veriq-focus h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-primary focus:border-accent focus:shadow-glow">
                <option value="">Usuário atual</option>
                {data.users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </label>
            <Select label="Status operacional *" name="status" defaultValue={item?.status ?? "OPERATING"} options={[["OPERATING", "Operando"], ["MAINTENANCE", "Em manutenção"], ["ATTENTION", "Atenção"], ["CRITICAL", "Crítico"], ["INACTIVE", "Inativo"]]} />
            <Select label="Criticidade *" name="criticality" defaultValue={item?.criticality ?? "MEDIUM"} options={[["LOW", "Baixa"], ["MEDIUM", "Média"], ["HIGH", "Alta"], ["CRITICAL", "Crítica"]]} />
            {mode === "edit" ? <Select label="Ativo?" name="active" defaultValue={item?.active ? "true" : "false"} options={[["true", "Sim"], ["false", "Não"]]} /> : null}
            <Select label="Monitorar no dashboard?" name="monitorOnDashboard" defaultValue={item?.monitorOnDashboard === false ? "false" : "true"} options={[["true", "Sim"], ["false", "Não"]]} />
            <Select label="Permitir checklists?" name="allowChecklists" defaultValue={item?.allowChecklists === false ? "false" : "true"} options={[["true", "Sim"], ["false", "Não"]]} />
            <Select label="Aprovar parada?" name="requiresStopApproval" defaultValue={item?.requiresStopApproval ? "true" : "false"} options={[["false", "Não"], ["true", "Sim"]]} />
          </div>
        </div>
      </form>
    </Modal>
  );
}

function Select({
  label,
  name,
  defaultValue,
  options
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: Array<[string, string]>;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-primary">{label}</span>
      <select name={name} defaultValue={defaultValue} className="veriq-focus h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-primary focus:border-accent focus:shadow-glow">
        {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
    </label>
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0">
      <span className="text-ink-muted">{label}</span>
      <span className="text-right font-semibold text-primary-dark">{value}</span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-slate-50 p-3">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-lg font-bold text-primary-dark">{value}</p>
    </div>
  );
}
