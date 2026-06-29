"use client";

import { useState } from "react";
import { Plus, Search, ShieldCheck, UserCheck, UserRound, UsersRound } from "lucide-react";
import { createUserAction, updateUserAction } from "@/app/actions/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/ui/kpi-card";
import { Modal } from "@/components/ui/modal";
import type { TeamData } from "@/lib/data/queries";
import { mapRoleLabel } from "@/lib/data/queries";
import { formatDateTime } from "@/lib/utils";

export function TeamClient({ data }: { data: TeamData }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = data.users.find((user) => user.id === selectedId);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-normal text-primary-dark">Equipe</h1>
          <p className="mt-1 text-sm text-ink-muted">Gerencie usuários, perfis de acesso, permissões e responsabilidades.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input placeholder="Buscar usuário..." icon={<Search className="h-4 w-4" />} className="h-12 w-72" />
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo usuário
          </Button>
        </div>
      </div>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={UsersRound} label="Usuários" value={String(data.totals.users)} change="Equipe cadastrada" tone="accent" />
        <KpiCard icon={UserCheck} label="Ativos" value={String(data.totals.active)} change="Com acesso liberado" tone="success" />
        <KpiCard icon={ShieldCheck} label="Administradores" value={String(data.totals.admins)} change="Perfis elevados" tone="info" />
        <KpiCard icon={UserRound} label="Operacionais" value={String(data.totals.operators)} change="Execução e inspeção" tone="warning" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <h2 className="font-display text-base font-bold text-primary-dark">Usuários</h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">Usuário</th>
                    <th className="px-4 py-3">Perfil</th>
                    <th className="px-4 py-3">Departamento</th>
                    <th className="px-4 py-3">Último login</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((user) => (
                    <tr key={user.id} className="border-t border-border">
                      <td className="px-4 py-4">
                        <p className="font-bold text-primary-dark">{user.name}</p>
                        <p className="text-xs text-ink-muted">{user.email}</p>
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

        <Card>
          <CardHeader>
            <h2 className="font-display text-base font-bold text-primary-dark">Auditoria recente</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.auditLogs.map((log) => (
              <div key={log.id} className="rounded-md border border-border p-3">
                <p className="text-sm font-bold text-primary-dark">{log.action}</p>
                <p className="mt-1 text-xs text-ink-muted">{log.user} • {log.resource} • {formatDateTime(log.createdAt)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <UserModal open={createOpen} onClose={() => setCreateOpen(false)} mode="create" />
      {selected ? (
        <UserModal open={Boolean(selected)} onClose={() => setSelectedId(null)} mode="edit" user={selected} />
      ) : null}
    </div>
  );
}

function UserModal({
  open,
  onClose,
  mode,
  user
}: {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  user?: TeamData["users"][number];
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Novo usuário" : "Editar usuário"}
      description="Defina dados básicos, área e perfil de acesso."
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form={`${mode}-user-form`}>{mode === "create" ? "Criar usuário" : "Salvar alterações"}</Button>
        </>
      }
    >
      <form id={`${mode}-user-form`} action={mode === "create" ? createUserAction : updateUserAction} className="grid gap-4 md:grid-cols-2">
        {user ? <input type="hidden" name="id" value={user.id} /> : null}
        <Field label="Nome *" name="name" defaultValue={user?.name} />
        <Field label="E-mail *" name="email" type="email" defaultValue={user?.email} />
        <label className="block">
          <span className="mb-2 block text-xs font-semibold text-primary">Perfil *</span>
          <select name="role" defaultValue={user?.role ?? "OPERATOR"} className="veriq-focus h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-primary focus:border-accent focus:shadow-glow">
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

function Field({
  label,
  name,
  type = "text",
  defaultValue
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-primary">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="veriq-focus h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-primary focus:border-accent focus:shadow-glow"
      />
    </label>
  );
}

