import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-semibold", {
  variants: {
    variant: {
      success: "bg-emerald-50 text-emerald-700",
      info: "bg-sky-50 text-sky-700",
      warning: "bg-amber-50 text-amber-700",
      danger: "bg-red-50 text-red-700",
      neutral: "bg-slate-100 text-slate-600",
      accent: "bg-cyan-50 text-cyan-700"
    }
  },
  defaultVariants: {
    variant: "neutral"
  }
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

