import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image src={compact ? "/brand/logo.png" : "/brand/logo-text.png"} alt="Veriq" width={compact ? 42 : 148} height={42} priority />
      {!compact ? (
        <span className="sr-only">Veriq</span>
      ) : null}
    </div>
  );
}
