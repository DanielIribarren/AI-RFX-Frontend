import { HTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils"

interface BrandCardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
  glass?: boolean
}

export const BrandCard = forwardRef<HTMLDivElement, BrandCardProps>(
  ({ className, elevated = false, glass = true, children, ...props }, ref) => {
    const baseStyles = "rounded-2xl transition-all duration-200"
    
    const glassStyles = glass 
      ? "bg-white/70 backdrop-blur-md border border-brand-border" 
      : "bg-white border border-brand-border"
    
    const shadowStyles = elevated 
      ? "shadow-strong hover:-translate-y-0.5" 
      : "shadow-soft"
    
    return (
      <div
        ref={ref}
        className={cn(baseStyles, glassStyles, shadowStyles, className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

BrandCard.displayName = "BrandCard"
