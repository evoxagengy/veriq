import { Bell, CalendarDays, ChevronDown, Command, Search } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TopbarUser = {
  name: string;
  role: string;
};

const roleLabel: Record<string, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gestor",
  SUPERVISOR: "Supervisor",
  OPERATOR: "Operador",
  TECHNICIAN: "Técnico",
  INSPECTOR: "Inspetor"
};

export function Topbar({ user }: { user: TopbarUser }) {
  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex min-h-24 items-center justify-end gap-4 border-b border-transparent bg-canvas/92 px-5 backdrop-blur md:px-8">
      <div className="hidden w-full max-w-sm md:block">
        <Input
          aria-label="Buscar"
          placeholder="Buscar..."
          icon={<Search className="h-4 w-4" />}
          className="h-12 pr-12"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-sm border border-border bg-slate-50 px-1.5 py-0.5 text-xs font-semibold text-ink-muted md:flex">
          <Command className="h-3 w-3" aria-hidden="true" /> K
        </span>
      </div>
      <button className="veriq-focus hidden h-12 items-center gap-3 rounded-md border border-border-strong bg-white px-4 text-sm font-semibold text-primary shadow-soft hover:bg-slate-50 xl:flex">
        <CalendarDays className="h-5 w-5 text-ink-muted" aria-hidden="true" />
        12 a 18 de mai, 2025
        <ChevronDown className="h-4 w-4" aria-hidden="true" />
      </button>
      <div className="hidden h-9 w-px bg-border-strong md:block" />
      <button className="veriq-focus relative grid h-11 w-11 place-items-center rounded-md text-primary hover:bg-white">
        <Bell className="h-6 w-6" aria-hidden="true" />
        <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-primary-dark">
          3
        </span>
      </button>
      <form action={logoutAction} className="flex items-center gap-3">
        <button
          type="submit"
          className="veriq-focus flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-white"
          title="Sair com segurança"
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
        <Button type="submit" variant="secondary" size="sm" className="hidden 2xl:inline-flex">
          Sair
        </Button>
      </form>
    </header>
  );
}

