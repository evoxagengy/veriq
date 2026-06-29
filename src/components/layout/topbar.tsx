"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Command,
  LogOut,
  Search,
  Settings,
  UserRound
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ShellNotificationsData } from "@/lib/data/queries";
import { cn } from "@/lib/utils";

type TopbarUser = {
  name: string;
  role: string;
  tenantName: string;
};

const roleLabel: Record<string, string> = {
  MASTER: "Master",
  ADMIN: "Administrador",
  MANAGER: "Gestor",
  SUPERVISOR: "Supervisor",
  OPERATOR: "Operador",
  TECHNICIAN: "Técnico",
  INSPECTOR: "Inspetor"
};

const periods = ["Hoje", "Últimos 7 dias", "Últimos 30 dias", "Este mês"];

export function Topbar({
  user,
  notifications
}: {
  user: TopbarUser;
  notifications: ShellNotificationsData;
}) {
  const [userOpen, setUserOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [period, setPeriod] = useState("Últimos 7 dias");

  const initials = useMemo(
    () =>
      user.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase(),
    [user.name]
  );

  const notificationCount = notifications.reduce((sum, item) => sum + item.count, 0);

  return (
    <header className="sticky top-0 z-20 flex min-h-20 items-center justify-end gap-3 border-b border-transparent bg-canvas/92 px-5 backdrop-blur md:px-8">
      <div className="relative hidden w-full max-w-sm md:block">
        <Input
          aria-label="Buscar"
          placeholder="Buscar..."
          icon={<Search className="h-4 w-4" />}
          className="h-11 pr-12"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-sm border border-border bg-slate-50 px-1.5 py-0.5 text-xs font-semibold text-ink-muted md:flex">
          <Command className="h-3 w-3" aria-hidden="true" /> K
        </span>
      </div>

      <div className="relative hidden xl:block">
        <button
          type="button"
          className="veriq-focus flex h-11 items-center gap-3 rounded-md border border-border-strong bg-white px-4 text-sm font-semibold text-primary shadow-soft hover:bg-slate-50"
          onClick={() => setPeriodOpen((value) => !value)}
        >
          <CalendarDays className="h-5 w-5 text-ink-muted" aria-hidden="true" />
          {period}
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </button>
        {periodOpen ? (
          <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-white p-2 shadow-card">
            {periods.map((item) => (
              <button
                key={item}
                type="button"
                className={cn(
                  "veriq-focus flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-semibold hover:bg-slate-50",
                  item === period ? "text-accent-dark" : "text-primary"
                )}
                onClick={() => {
                  setPeriod(item);
                  setPeriodOpen(false);
                }}
              >
                {item}
                {item === period ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="hidden h-9 w-px bg-border-strong md:block" />

      <div className="relative">
        <button
          type="button"
          className="veriq-focus relative grid h-11 w-11 place-items-center rounded-md text-primary hover:bg-white"
          onClick={() => setNotificationsOpen((value) => !value)}
          aria-label="Abrir notificações"
        >
          <Bell className="h-6 w-6" aria-hidden="true" />
          {notificationCount > 0 ? (
            <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-primary-dark">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          ) : null}
        </button>
        {notificationsOpen ? (
          <div className="absolute right-0 mt-2 w-80 rounded-lg border border-border bg-white p-3 shadow-card">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-display text-sm font-bold text-primary-dark">Notificações</p>
              <span className="rounded-sm bg-cyan-50 px-2 py-1 text-xs font-bold text-accent-dark">
                {notificationCount}
              </span>
            </div>
            {notifications.length === 0 ? (
              <div className="rounded-md border border-border bg-slate-50 p-4 text-sm text-ink-muted">
                Nenhuma notificação crítica no momento.
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="flex gap-3 rounded-md border border-border p-3 hover:bg-slate-50"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    <AlertTriangle
                      className={cn(
                        "mt-0.5 h-5 w-5 shrink-0",
                        item.tone === "danger" ? "text-danger" : item.tone === "warning" ? "text-warning" : "text-info"
                      )}
                      aria-hidden="true"
                    />
                    <span>
                      <span className="block text-sm font-bold text-primary-dark">{item.title}</span>
                      <span className="mt-0.5 block text-xs text-ink-muted">{item.description}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="relative">
        <button
          type="button"
          className="veriq-focus flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-white"
          onClick={() => setUserOpen((value) => !value)}
          aria-label="Abrir menu da conta"
        >
          <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-amber-200 to-orange-500 text-sm font-bold text-primary-dark">
            {initials}
          </span>
          <span className="hidden text-left xl:block">
            <span className="block text-sm font-bold text-primary-dark">{user.name}</span>
            <span className="block text-xs text-ink-muted">{roleLabel[user.role] ?? user.role}</span>
          </span>
          <ChevronDown className="hidden h-4 w-4 text-ink-muted xl:block" aria-hidden="true" />
        </button>

        {userOpen ? (
          <div className="absolute right-0 mt-2 w-72 rounded-lg border border-border bg-white p-2 shadow-card">
            <div className="border-b border-border px-3 py-3">
              <p className="font-display text-sm font-bold text-primary-dark">{user.name}</p>
              <p className="mt-1 flex items-center gap-2 text-xs text-ink-muted">
                <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                {user.tenantName}
              </p>
            </div>
            <Link
              href="/perfil"
              className="mt-2 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-primary hover:bg-slate-50"
              onClick={() => setUserOpen(false)}
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
              Minha conta
            </Link>
            <Link
              href="/configuracoes"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-primary hover:bg-slate-50"
              onClick={() => setUserOpen(false)}
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              Configurações
            </Link>
            <form action={logoutAction} className="mt-2 border-t border-border pt-2">
              <Button type="submit" variant="ghost" className="w-full justify-start text-danger hover:bg-red-50 hover:text-danger">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sair da conta
              </Button>
            </form>
          </div>
        ) : null}
      </div>
    </header>
  );
}
