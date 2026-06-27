import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, ...props }, ref) => {
    return (
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 text-ink-disabled">
            {icon}
          </span>
        ) : null}
        <input
          ref={ref}
          className={cn(
            "veriq-focus h-11 w-full rounded-md border border-border-strong bg-white px-3 text-sm text-ink placeholder:text-ink-disabled focus:border-accent focus:shadow-glow",
            icon ? "pl-10" : "",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";

