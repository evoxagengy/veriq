"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  size = "lg"
}: {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  size?: "md" | "lg" | "xl";
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/62 p-4 backdrop-blur-sm">
      <div
        className={cn(
          "max-h-[92vh] w-full overflow-hidden rounded-lg border border-border bg-white shadow-2xl",
          size === "md" && "max-w-2xl",
          size === "lg" && "max-w-5xl",
          size === "xl" && "max-w-6xl"
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 className="font-display text-2xl font-bold text-primary-dark">{title}</h2>
            {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Fechar modal">
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
        <div className="max-h-[calc(92vh-152px)] overflow-auto px-6 py-5">{children}</div>
        {footer ? <div className="flex justify-end gap-3 border-t border-border px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

