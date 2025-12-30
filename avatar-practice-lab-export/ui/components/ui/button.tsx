import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  color?: 'primary' | 'secondary' | 'danger';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', color, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    
    const variants = {
      default: "bg-brand-primary text-white hover:bg-brand-dark",
      destructive: "bg-brand-accent text-white hover:bg-red-700",
      outline: "border border-brand-light bg-white hover:bg-brand-light/10 text-brand-dark",
      secondary: "bg-brand-light/20 text-brand-dark hover:bg-brand-light/30",
      ghost: "hover:bg-brand-light/10 text-brand-dark",
      link: "text-brand-primary underline-offset-4 hover:underline",
    };

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    };

    const colors = {
      primary: "bg-brand-primary text-white hover:bg-brand-dark",
      secondary: "bg-brand-light text-white hover:bg-brand-primary",
      danger: "bg-brand-accent text-white hover:bg-red-700",
    };

    return (
      <button
        className={cn(
          baseStyles,
          color ? colors[color] : variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
