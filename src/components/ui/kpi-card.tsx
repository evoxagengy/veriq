import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type KpiTone = "accent" | "info" | "success" | "warning" | "danger" | "neutral" | "violet";

const toneClasses: Record<KpiTone, string> = {
  accent: "bg-cyan-50 text-accent",
  info: "bg-sky-50 text-blue-600",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  danger: "bg-red-50 text-red-500",
  neutral: "bg-slate-100 text-slate-500",
  violet: "bg-violet-50 text-violet-600"
};

export function KpiCard({
  icon: Icon,
  label,
  value,
  change,
  trend = "up",
  tone = "accent"
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  change: string;
  trend?: "up" | "down";
  tone?: KpiTone;
}) {
  const TrendIcon = trend === "up" ? ArrowUp : ArrowDown;

  return (
    <Card className="flex min-h-32 items-center gap-5 p-5">
      <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-lg", toneClasses[tone])}>
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-primary">{label}</p>
        <p className="mt-2 font-display text-3xl font-bold tracking-normal text-primary-dark">{value}</p>
        <p
          className={cn(
            "mt-3 inline-flex items-center gap-1 text-xs font-medium",
            trend === "up" ? "text-accent-dark" : "text-danger"
          )}
        >
          <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {change}
        </p>
      </div>
    </Card>
  );
}

