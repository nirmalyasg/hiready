import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: "bg-brand-dark text-white",
    secondary: "bg-gray-100 text-brand-dark",
    destructive: "bg-brand-accent text-white",
    outline: "border border-gray-200 text-brand-dark bg-white",
    success: "bg-green-50 text-green-700 border border-green-200",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
