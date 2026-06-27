import { ArrowUp, ChevronRight } from "lucide-react";

export function SidebarScoreCard({
  label = "Eficiência operacional",
  value = 92,
  change = "8%"
}: {
  label?: string;
  value?: number;
  change?: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5 shadow-soft">
      <p className="text-sm font-semibold text-white">{label}</p>
      <div className="mt-5 flex justify-center">
        <div
          className="grid h-32 w-32 place-items-center rounded-full"
          style={{
            background: `conic-gradient(#00D6C9 ${value * 3.6}deg, rgba(255,255,255,0.12) 0deg)`
          }}
        >
          <div className="grid h-24 w-24 place-items-center rounded-full bg-primary-dark">
            <span className="font-display text-3xl font-bold text-white">{value}%</span>
          </div>
        </div>
      </div>
      <p className="mt-4 flex items-center justify-center gap-1 text-sm font-medium text-accent">
        <ArrowUp className="h-4 w-4" aria-hidden="true" />
        {change} vs último período
      </p>
      <button className="veriq-focus mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-md border border-white/12 bg-white/[0.04] text-sm font-semibold text-slate-200 hover:bg-white/[0.08]">
        Ver relatório completo
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

