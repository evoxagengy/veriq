"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  Eye,
  FilePlus2,
  Filter,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2
} from "lucide-react";
import { archiveChecklistAction, createChecklistAction, updateChecklistAction } from "@/app/actions/checklists";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/ui/kpi-card";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ChecklistsData } from "@/lib/data/queries";
import { mapChecklistStatus, mapCriticality } from "@/lib/data/queries";
import { formatDateTime } from "@/lib/utils";

type ChecklistItem = ChecklistsData["items"][number];
type FormItem = {
  description: string;
  responseType: string;
  criticality: string;
  required: boolean;
  action: string;
};

const responseTypes = ["Sim/Não", "Texto", "Número", "Foto", "Assinatura"];
const actions = [
  { value: "OPEN_OCCURRENCE", label: "Abrir ocorrência" },
  { value: "REQUIRE_PHOTO", label: "Exigir foto" },
  { value: "REQUEST_APPROVAL", label: "Solicitar aprovação" },
  { value: "BLOCK_EQUIPMENT", label: "Bloquear equipamento" }
];

export function ChecklistsClient({ data }: { data: ChecklistsData }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [actionsOpen, setActionsOpen] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [blockFilter, setBlockFilter] = useState("all");

  const selectedView = data.items.find((item) => item.id === viewId);
  const selectedEdit = data.items.find((item) => item.id === editId);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const result = data.items.filter((item) => {
      const matchesText =
        !normalized ||
        [item.name, item.code, item.category, item.blockName, item.equipmentName, item.responsible]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      const matchesBlock = blockFilter === "all" || item.blockName === blockFilter;
      return matchesText && matchesBlock;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "category") {
        return a.category.localeCompare(b.category, "pt-BR");
      }
      if (sortBy === "block") {
        return a.blockName.localeCompare(b.blockName, "pt-BR") || a.name.localeCompare(b.name, "pt-BR");
      }
      if (sortBy === "date") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return a.name.localeCompare(b.name, "pt-BR");
    });
  }, [blockFilter, data.items, query, sortBy]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-normal text-primary-dark">Checklists</h1>
          <p className="mt-1 text-sm text-ink-muted">Cadastre modelos por blocos operacionais, equipamentos e itens executáveis.</p>
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
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo checklist
          </Button>
        </div>
      </div>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={ClipboardCheck} label="Total de checklists" value={String(data.totals.total)} change="Modelos cadastrados" tone="accent" />
        <KpiCard icon={ClipboardCheck} label="Ativos" value={String(data.totals.active)} change="Prontos para execução" tone="success" />
        <KpiCard icon={FilePlus2} label="Rascunhos" value={String(data.totals.drafts)} change="Em preparação" trend="down" tone="warning" />
        <KpiCard icon={ClipboardCheck} label="Em revisão" value={String(data.totals.review)} change="Aguardando validação" tone="danger" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-base font-bold text-primary-dark">Todos os checklists</h2>
              <span className="rounded-sm bg-slate-100 px-2 py-1 text-xs font-bold text-ink-muted">{filteredItems.length}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={blockFilter}
                onChange={(event) => setBlockFilter(event.target.value)}
                className="veriq-focus h-9 rounded-md border border-border-strong bg-white px-3 text-xs font-semibold text-primary"
              >
                <option value="all">Todos os blocos</option>
                {data.blockSummary.map((block) => (
                  <option key={block.id} value={block.name}>{block.name}</option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="veriq-focus h-9 rounded-md border border-border-strong bg-white px-3 text-xs font-semibold text-primary"
              >
                <option value="name">Ordenar por nome</option>
                <option value="category">Ordenar por categoria</option>
                <option value="block">Ordenar por bloco</option>
                <option value="date">Ordenar por atualização</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[1140px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">Nome do checklist</th>
                    <th className="px-4 py-3">Bloco</th>
                    <th className="px-4 py-3">Equipamento</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Responsável</th>
                    <th className="px-4 py-3">Itens</th>
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
                            <span className="block font-bold text-primary-dark">{item.name}</span>
                            <span className="text-xs text-ink-muted">ID: {item.code} • {item.periodicity}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-medium text-primary">{item.blockName}</td>
                      <td className="px-4 py-4 text-primary">{item.equipmentName}</td>
                      <td className="px-4 py-4 text-primary">{item.category}</td>
                      <td className="px-4 py-4 text-primary">{item.responsible}</td>
                      <td className="px-4 py-4 text-primary">{item.itemCount}</td>
                      <td className="px-4 py-4"><StatusBadge status={mapChecklistStatus(item.status)} /></td>
                      <td className="px-4 py-4">
                        <div className="relative flex justify-end gap-2 text-primary">
                          <button
                            className="veriq-focus grid h-9 w-9 place-items-center rounded-sm hover:bg-slate-100"
                            type="button"
                            aria-label="Visualizar checklist"
                            onClick={() => setViewId(item.id)}
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            className="veriq-focus grid h-9 w-9 place-items-center rounded-sm hover:bg-slate-100"
                            type="button"
                            aria-label="Editar checklist"
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
                              <Link href={`/checklists/${item.id}`} className="block rounded-md px-3 py-2 text-sm font-semibold hover:bg-slate-50">
                                Abrir detalhe
                              </Link>
                              <form action={archiveChecklistAction}>
                                <input type="hidden" name="id" value={item.id} />
                                <button type="submit" className="w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-danger hover:bg-red-50">
                                  Arquivar checklist
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
            <p className="mt-4 text-sm text-ink-muted">Mostrando {filteredItems.length} de {data.totals.total} checklists</p>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <h2 className="font-display text-base font-bold text-primary-dark">Blocos operacionais</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.blockSummary.length === 0 ? (
                <p className="text-sm text-ink-muted">Nenhum bloco cadastrado.</p>
              ) : (
                data.blockSummary.map((block) => (
                  <button
                    key={block.id}
                    type="button"
                    onClick={() => setBlockFilter(block.name)}
                    className="flex w-full items-center justify-between rounded-md border border-border p-3 text-left hover:bg-slate-50"
                  >
                    <span>
                      <span className="block text-sm font-bold text-primary-dark">{block.name}</span>
                      <span className="text-xs text-ink-muted">{block.description ?? "Bloco operacional"}</span>
                    </span>
                    <Badge variant="accent">{block.total}</Badge>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <h2 className="font-display text-base font-bold text-primary-dark">Mais utilizados</h2>
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
        </div>
      </section>

      <ChecklistModal open={createOpen} onClose={() => setCreateOpen(false)} mode="create" data={data} />
      {selectedView ? <ChecklistViewModal item={selectedView} open={Boolean(selectedView)} onClose={() => setViewId(null)} /> : null}
      {selectedEdit ? (
        <ChecklistModal
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

function ChecklistViewModal({ item, open, onClose }: { item: ChecklistItem; open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={item.name} description={`${item.blockName} • ${item.equipmentName}`} size="lg">
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {item.items.map((checkItem) => (
            <div key={checkItem.id} className="rounded-md border border-border p-4">
              <div className="flex items-start gap-3">
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
          <Info label="Categoria" value={item.category} />
          <Info label="Periodicidade" value={item.periodicity} />
          <Info label="Tempo" value={`${item.estimatedMinutes} min`} />
          <Info label="Responsável" value={item.responsible} />
          <Info label="Última atualização" value={formatDateTime(item.updatedAt)} />
        </div>
      </div>
    </Modal>
  );
}

function ChecklistModal({
  open,
  onClose,
  mode,
  item,
  data
}: {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  item?: ChecklistItem;
  data: ChecklistsData;
}) {
  const [items, setItems] = useState<FormItem[]>(
    item?.items.map((checkItem) => ({
      description: checkItem.description,
      responseType: checkItem.responseType,
      criticality: checkItem.criticality,
      required: checkItem.required,
      action: checkItem.actionOnFailure
    })) ?? [
      { description: "Verificar condição geral do equipamento", responseType: "Sim/Não", criticality: "MEDIUM", required: true, action: "OPEN_OCCURRENCE" },
      { description: "Inspecionar vazamentos, ruídos ou anomalias", responseType: "Sim/Não", criticality: "HIGH", required: true, action: "OPEN_OCCURRENCE" },
      { description: "Registrar observações relevantes", responseType: "Texto", criticality: "LOW", required: false, action: "REQUEST_APPROVAL" }
    ]
  );

  function updateItem(index: number, field: keyof FormItem, value: string | boolean) {
    setItems((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Novo checklist" : "Editar checklist"}
      description="Organize o modelo por bloco operacional, equipamento e itens executáveis."
      size="xl"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form={`${mode}-checklist-form`}>{mode === "create" ? "Criar checklist" : "Salvar alterações"}</Button>
        </>
      }
    >
      <form id={`${mode}-checklist-form`} action={mode === "create" ? createChecklistAction : updateChecklistAction} className="space-y-5">
        {item ? <input type="hidden" name="id" value={item.id} /> : null}
        <div className="rounded-lg border border-border p-5">
          <h3 className="font-display text-base font-bold text-primary-dark">1. Bloco, equipamento e dados gerais</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Nome do checklist *" name="name" placeholder="Ex.: Checklist da caldeira" defaultValue={item?.name} />
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-primary">Bloco operacional *</span>
              <input
                name="blockName"
                list="checklist-blocks"
                required
                defaultValue={item?.blockName ?? data.blocks[0]?.name ?? "Tratamento de caldo"}
                className="veriq-focus h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-primary focus:border-accent focus:shadow-glow"
              />
              <datalist id="checklist-blocks">
                {data.blocks.map((block) => (
                  <option key={block.id} value={block.name} />
                ))}
              </datalist>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-primary">Equipamento vinculado</span>
              <select name="equipmentId" defaultValue={item?.equipmentId ?? ""} className="veriq-focus h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-primary focus:border-accent focus:shadow-glow">
                <option value="">Área geral / sem equipamento</option>
                {data.equipments.map((equipment) => (
                  <option key={equipment.id} value={equipment.id}>{equipment.name} ({equipment.tag})</option>
                ))}
              </select>
            </label>
            <Field label="Categoria *" name="category" placeholder="Ex.: Caldeiras" defaultValue={item?.category} />
            <Field label="Área / Setor" name="area" placeholder="Ex.: Utilidades" defaultValue={item?.area} />
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-primary">Responsável</span>
              <select name="responsibleId" defaultValue={item?.responsibleId ?? ""} className="veriq-focus h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-primary focus:border-accent focus:shadow-glow">
                <option value="">Usuário atual</option>
                {data.users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-primary">Periodicidade *</span>
              <select name="periodicity" className="veriq-focus h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-primary focus:border-accent focus:shadow-glow" defaultValue={item?.periodicity ?? "Diária"}>
                <option>Diária</option>
                <option>Semanal</option>
                <option>Quinzenal</option>
                <option>Mensal</option>
              </select>
            </label>
            <Field label="Tempo estimado (min) *" name="estimatedMinutes" type="number" defaultValue={String(item?.estimatedMinutes ?? 30)} />
            <label className="block xl:col-span-4">
              <span className="mb-2 block text-xs font-semibold text-primary">Descrição / Objetivo</span>
              <textarea name="description" defaultValue={item?.description ?? ""} className="veriq-focus min-h-20 w-full rounded-md border border-border-strong bg-white px-3 py-3 text-sm text-primary placeholder:text-ink-disabled focus:border-accent focus:shadow-glow" placeholder="Descreva o objetivo deste checklist..." />
            </label>
          </div>
        </div>

        <div className="rounded-lg border border-border p-5">
          <h3 className="font-display text-base font-bold text-primary-dark">2. Permissões e execução</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3 xl:grid-cols-5">
            <Select label="Status" name="status" defaultValue={item?.status ?? "ACTIVE"} options={[["ACTIVE", "Ativo"], ["DRAFT", "Rascunho"], ["REVIEW", "Em revisão"], ["ARCHIVED", "Arquivado"]]} />
            <Select label="Requer aprovação?" name="requiresApproval" defaultValue={item?.requiresApproval ? "on" : "off"} options={[["off", "Não"], ["on", "Sim"]]} />
            <Select label="Permite fotos?" name="allowsPhotos" defaultValue={item?.allowsPhotos === false ? "false" : "true"} options={[["true", "Sim"], ["false", "Não"]]} />
            <Select label="Assinatura obrigatória?" name="requiresSignature" defaultValue={item?.requiresSignature ? "on" : "off"} options={[["off", "Não"], ["on", "Sim"]]} />
            <Select label="Disponível no mobile?" name="mobileEnabled" defaultValue={item?.mobileEnabled === false ? "false" : "true"} options={[["true", "Sim"], ["false", "Não"]]} />
          </div>
        </div>

        <div className="rounded-lg border border-border p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-base font-bold text-primary-dark">3. Itens do checklist</h3>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setItems((current) => [...current, { description: "", responseType: "Sim/Não", criticality: "MEDIUM", required: true, action: "OPEN_OCCURRENCE" }])}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Adicionar item
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {items.map((row, index) => (
              <div key={index} className="grid gap-3 rounded-md border border-border bg-slate-50 p-3 md:grid-cols-[44px_1fr_140px_130px_120px_44px]">
                <span className="grid h-10 w-10 place-items-center rounded-sm border border-border bg-white text-sm font-bold text-primary">{index + 1}</span>
                <input
                  name="itemDescription"
                  value={row.description}
                  onChange={(event) => updateItem(index, "description", event.target.value)}
                  placeholder="Descrição do item"
                  className="veriq-focus h-10 rounded-md border border-border-strong bg-white px-3 text-sm text-primary"
                  required
                />
                <select name="itemResponseType" value={row.responseType} onChange={(event) => updateItem(index, "responseType", event.target.value)} className="veriq-focus h-10 rounded-md border border-border-strong bg-white px-3 text-sm text-primary">
                  {responseTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
                <select name="itemCriticality" value={row.criticality} onChange={(event) => updateItem(index, "criticality", event.target.value)} className="veriq-focus h-10 rounded-md border border-border-strong bg-white px-3 text-sm text-primary">
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                  <option value="CRITICAL">Crítica</option>
                </select>
                <select name={`itemRequired_${index}`} value={row.required ? "true" : "false"} onChange={(event) => updateItem(index, "required", event.target.value === "true")} className="veriq-focus h-10 rounded-md border border-border-strong bg-white px-3 text-sm text-primary">
                  <option value="true">Obrigatório</option>
                  <option value="false">Opcional</option>
                </select>
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-sm text-danger hover:bg-red-50"
                  onClick={() => setItems((current) => current.length === 1 ? current : current.filter((_, rowIndex) => rowIndex !== index))}
                  aria-label="Remover item"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
                <select name="itemAction" value={row.action} onChange={(event) => updateItem(index, "action", event.target.value)} className="veriq-focus h-10 rounded-md border border-border-strong bg-white px-3 text-sm text-primary md:col-start-2 md:col-end-7">
                  {actions.map((action) => <option key={action.value} value={action.value}>{action.label}</option>)}
                </select>
              </div>
            ))}
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
