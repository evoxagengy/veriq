"use client";

import { useMemo, useState } from "react";
import { Building2, Plus, Search, ShieldCheck, UserCheck, UsersRound } from "lucide-react";
import { createTenantAction, createUserAction, updateUserAction } from "@/app/actions/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/ui/kpi-card";
import { Modal } from "@/components/ui/modal";
import type { TeamData } from "@/lib/data/queries";
import { mapRoleLabel } from "@/lib/data/queries";
import { formatDateTime } from "@/lib/utils";

type UserItem = TeamData["users"][number];

export function TeamClient({ data }: { data: TeamData }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const selected = data.users.find((user) => user.id === selectedId);

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return data.users.filter((user) =>
      !normalized ||
      [user.name, user.email, user.tenantName, user.department ?? "", user.position ?? "", mapRoleLabel(user.role)]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [data.users, query]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-normal text-primary-dark">Usuários</h1>
          <p className="mt-1 text-sm text-ink-muted">Gerencie pessoas, empresas, perfis de acesso e responsabilidades.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar usuário..."
            icon={<Search className="h-4 w-4" />}
            className="h-12 w-72"
          />
          {data.canManageTenants ? (
            <Button variant="secondary" onClick={() => setCompanyOpen(true)}>
              <Building2 className="h-4 w-4" aria-hidden="true" />
              Nova empresa
            </Button>
          ) : null}
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo usuário
          </Button>
        </div>
      </div>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={UsersRound} label="Usuários" value={String(data.totals.users)} change="Contas cadastradas" tone="accent" />
        <KpiCard icon={UserCheck} label="Ativos" value={String(data.totals.active)} change="Com acesso liberado" tone="success" />
        <KpiCard icon={ShieldCheck} label="Administradores" value={String(data.totals.admins)} change="Perfis elevados" tone="info" />
        <KpiCard icon={Building2} label="Empresas" value={String(data.totals.tenants)} change="Tenants isolados" tone="warning" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-base font-bold text-primary-dark">Usuários</h2>
              <span className="rounded-sm bg-slate-100 px-2 py-1 text-xs font-bold text-ink-muted">{filteredUsers.length}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">Usuário</th>
                    <th className="px-4 py-3">Empresa</th>
                    <th className="px-4 py-3">Perfil</th>
                    <th className="px-4 py-3">Departamento</th>
                    <th className="px-4 py-3">Último login</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-t border-border">
                      <td className="px-4 py-4">
                        <p className="font-bold text-primary-dark">{user.name}</p>
                        <p className="text-xs text-ink-muted">{user.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-primary">{user.tenantName}</p>
                        <p className="text-xs text-ink-muted">{user.tenantSlug}</p>
                      </td>
                      <td className="px-4 py-4 text-primary">{mapRoleLabel(user.role)}</td>
                      <td className="px-4 py-4 text-primary">{user.department ?? "Não informado"}</td>
                      <td className="px-4 py-4 text-primary">{formatDateTime(user.lastLoginAt)}</td>
                      <td className="px-4 py-4">
                        <Badge variant={user.active ? "success" : "neutral"}>{user.active ? "Ativo" : "Inativo"}</Badge>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button variant="secondary" size="sm" onClick={() => setSelectedId(user.id)}>Editar</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          {data.canManageTenants ? (
            <Card>
              <CardHeader>
                <h2 className="font-display text-base font-bold text-primary-dark">Empresas</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.tenants.map((tenant) => (
                  <div key={tenant.id} className="rounded-md border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-primary-dark">{tenant.name}</p>
                        <p className="text-xs text-ink-muted">{tenant.slug}</p>
                      </div>
                      <Badge variant={tenant.active ? "success" : "neutral"}>{tenant.active ? "Ativa" : "Inativa"}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <h2 className="font-display text-base font-bold text-primary-dark">Auditoria recente</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.auditLogs.map((log) => (
                <div key={log.id} className="rounded-md border border-border p-3">
                  <p className="text-sm font-bold text-primary-dark">{log.action}</p>
                  <p className="mt-1 text-xs text-ink-muted">{log.user} • {log.tenant} • {log.resource} • {formatDateTime(log.createdAt)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <UserModal open={createOpen} onClose={() => setCreateOpen(false)} mode="create" data={data} />
      <CompanyModal open={companyOpen} onClose={() => setCompanyOpen(false)} />
      {selected ? (
        <UserModal key={selected.id} open={Boolean(selected)} onClose={() => setSelectedId(null)} mode="edit" user={selected} data={data} />
      ) : null}
    </div>
  );
}

function UserModal({
  open,
  onClose,
  mode,
  user,
  data
}: {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  user?: UserItem;
  data: TeamData;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Novo usuário" : "Editar usuário"}
      description="Defina empresa, dados básicos e perfil de acesso."
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form={`${mode}-user-form`}>{mode === "create" ? "Criar usuário" : "Salvar alterações"}</Button>
        </>
      }
    >
      <form id={`${mode}-user-form`} action={mode === "create" ? createUserAction : updateUserAction} className="grid gap-4 md:grid-cols-2">
        {user ? <input type="hidden" name="id" value={user.id} /> : null}
        {data.canManageTenants ? (
          <label className="block md:col-span-2">
            <span className="mb-2 block text-xs font-semibold text-primary">Empresa *</span>
            <select name="tenantId" defaultValue={user?.tenantId ?? data.currentTenantId} className="veriq-focus h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-primary focus:border-accent focus:shadow-glow">
              {data.tenants.filter((tenant) => tenant.active).map((tenant) => (
                <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
              ))}
            </select>
          </label>
        ) : null}
        <Field label="Nome *" name="name" defaultValue={user?.name} />
        <Field label="E-mail *" name="email" type="email" defaultValue={user?.email} />
        <label className="block">
          <span className="mb-2 block text-xs font-semibold text-primary">Perfil *</span>
          <select name="role" defaultValue={user?.role ?? "OPERATOR"} className="veriq-focus h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-primary focus:border-accent focus:shadow-glow">
            {data.canManageTenants ? <option value="MASTER">Master</option> : null}
            <option value="ADMIN">Administrador</option>
            <option value="MANAGER">Gestor</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="OPERATOR">Operador</option>
            <option value="TECHNICIAN">Técnico</option>
            <option value="INSPECTOR">Inspetor</option>
          </select>
        </label>
        <Field label="Departamento" name="department" defaultValue={user?.department ?? ""} />
        <Field label="Cargo" name="position" defaultValue={user?.position ?? ""} />
        <Field label="Telefone" name="phone" defaultValue={user?.phone ?? ""} />
        {mode === "create" ? <Field label="Senha inicial" name="password" type="password" defaultValue="Veriq@2026" /> : null}
        {mode === "edit" ? (
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-primary">Status</span>
            <select name="active" defaultValue={user?.active ? "true" : "false"} className="veriq-focus h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-primary focus:border-accent focus:shadow-glow">
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </label>
        ) : null}
      </form>
    </Modal>
  );
}

function CompanyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nova empresa"
      description="Crie um tenant isolado para usuários, equipamentos e checklists."
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="create-company-form">Criar empresa</Button>
        </>
      }
    >
      <form id="create-company-form" action={createTenantAction} className="grid gap-4">
        <Field label="Nome da empresa *" name="name" placeholder="Ex.: Engenix Operações" />
        <Field label="Slug *" name="slug" placeholder="ex.: engenix-operacoes" />
      </form>
    </Modal>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-primary">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="veriq-focus h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-primary placeholder:text-ink-disabled focus:border-accent focus:shadow-glow"
      />
    </label>
  );
}
