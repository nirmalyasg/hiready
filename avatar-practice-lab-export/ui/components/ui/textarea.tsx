import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[100px] w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-brand-dark placeholder:text-brand-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-dark/20 focus:border-brand-dark transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 resize-none",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
