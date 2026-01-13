import { HTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"

interface BrandBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "indigo" | "success" | "warning" | "error" | "neutral"
}

export const BrandBadge = forwardRef<HTMLSpanElement, BrandBadgeProps>(
  ({ className, variant = "indigo", children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
    
    const variants = {
      indigo: "bg-indigo-600 text-white",
      success: "bg-brand-success/10 text-brand-success border border-brand-success/20",
      warning: "bg-brand-warning/10 text-brand-warning border border-brand-warning/20",
      error: "bg-brand-error/10 text-brand-error border border-brand-error/20",
      neutral: "bg-brand-slate/10 text-brand-slate border border-brand-border"
    }
    
    return (
      <span
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      >
        {children}
      </span>
    )
  }
)

BrandBadge.displayName = "BrandBadge"
