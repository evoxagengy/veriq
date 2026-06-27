"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarCheck2,
  ClipboardCheck,
  FileText,
  PanelLeftClose,
  Settings,
  ShieldCheck,
  ShieldAlert,
  UsersRound,
  Wrench
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { SidebarScoreCard } from "@/components/layout/sidebar-score-card";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/checklists", label: "Checklists", icon: ClipboardCheck },
  { href: "/equipamentos", label: "Equipamentos", icon: Wrench },
  { href: "/inspecoes", label: "Inspeções", icon: CalendarCheck2 },
  { href: "/nao-conformidades", label: "Não conformidades", icon: ShieldAlert },
  { href: "/relatorios", label: "Relatórios", icon: FileText },
  { href: "/equipe", label: "Equipe", icon: UsersRound },
  { href: "/configuracoes", label: "Configurações", icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-veriq-dark px-2 py-7 text-white lg:flex">
      <div className="px-6">
        <Logo />
      </div>
      <nav className="mt-10 flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "veriq-focus relative flex h-12 items-center gap-3 rounded-md px-6 text-sm font-semibold transition",
                active ? "bg-accent/12 text-accent" : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.label}</span>
              {active ? <span className="absolute right-0 h-9 w-1 rounded-full bg-accent" /> : null}
            </Link>
          );
        })}
      </nav>
      <div className="px-3">
        <SidebarScoreCard />
        <button className="veriq-focus mt-6 flex h-11 w-full items-center justify-center gap-3 rounded-md text-sm font-medium text-slate-300 hover:bg-white/[0.06] hover:text-white">
          <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
          Recolher menu
        </button>
      </div>
      <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-full overflow-hidden opacity-30">
        <div className="login-mesh absolute inset-x-0 bottom-0 h-64" />
      </div>
      <ShieldCheck className="pointer-events-none absolute bottom-8 right-5 h-5 w-5 text-accent/40" />
    </aside>
  );
}

