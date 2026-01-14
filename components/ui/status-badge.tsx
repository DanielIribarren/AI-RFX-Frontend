import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CheckCircle, XCircle, AlertTriangle, Info, RefreshCw } from "lucide-react"

import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        success:
          "border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
        error:
          "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
        warning:
          "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
        info:
          "border-primary/20 bg-primary/5 text-primary-dark hover:bg-primary/10",
        loading:
          "border-primary/20 bg-primary/5 text-primary-dark hover:bg-primary/10",
        neutral:
          "border bg-secondary text-gray-700 hover:bg-muted",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  showIcon?: boolean
}

function StatusBadge({ className, variant, showIcon = true, children, ...props }: StatusBadgeProps) {
  const getIcon = () => {
    if (!showIcon) return null
    
    switch (variant) {
      case "success":
        return <CheckCircle className="h-3 w-3" />
      case "error":
        return <XCircle className="h-3 w-3" />
      case "warning":
        return <AlertTriangle className="h-3 w-3" />
      case "info":
        return <Info className="h-3 w-3" />
      case "loading":
        return <RefreshCw className="h-3 w-3 animate-spin" />
      default:
        return null
    }
  }

  return (
    <div className={cn(statusBadgeVariants({ variant }), className)} {...props}>
      {getIcon()}
      {children}
    </div>
  )
}

export { StatusBadge, statusBadgeVariants }
