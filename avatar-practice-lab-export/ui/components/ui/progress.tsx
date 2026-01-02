import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, color = 'primary', ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    
    const colors = {
      primary: 'bg-brand-dark',
      success: 'bg-green-500',
      warning: 'bg-amber-500',
      danger: 'bg-brand-accent',
    };

    return (
      <div
        ref={ref}
        className={cn("relative h-2.5 w-full overflow-hidden rounded-full bg-gray-100", className)}
        {...props}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-300 ease-out", colors[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };
