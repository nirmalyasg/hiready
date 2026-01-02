import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  color?: 'primary' | 'secondary' | 'danger';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', color, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    
    const variants = {
      default: "bg-brand-dark text-white hover:bg-brand-dark/90 shadow-md hover:shadow-lg",
      destructive: "bg-brand-accent text-white hover:bg-brand-accent/90 shadow-md hover:shadow-lg",
      outline: "border-2 border-brand-dark/20 bg-white hover:bg-gray-50 text-brand-dark hover:border-brand-dark/40",
      secondary: "bg-brand-light/20 text-brand-dark hover:bg-brand-light/30",
      ghost: "hover:bg-gray-100 text-brand-dark",
      link: "text-brand-dark underline-offset-4 hover:underline",
    };

    const sizes = {
      default: "h-11 px-6 py-2.5",
      sm: "h-9 rounded-lg px-4 text-sm",
      lg: "h-12 rounded-xl px-8 text-base",
      icon: "h-10 w-10",
    };

    const colors = {
      primary: "bg-brand-dark text-white hover:bg-brand-dark/90 shadow-md hover:shadow-lg",
      secondary: "bg-brand-light text-white hover:bg-brand-muted shadow-md hover:shadow-lg",
      danger: "bg-brand-accent text-white hover:bg-brand-accent/90 shadow-md hover:shadow-lg",
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
