import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image src="/brand/veriq-mark.svg" alt="Veriq" width={42} height={42} priority />
      {!compact ? (
        <span className="font-display text-3xl font-bold tracking-normal text-white">Veriq</span>
      ) : null}
    </div>
  );
}

