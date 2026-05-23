import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "touch-target flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-lg outline-none transition-colors focus-visible:border-teal-600 focus-visible:ring-2 focus-visible:ring-teal-600/20",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
