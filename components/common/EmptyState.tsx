import * as React from "react"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: {
    container: "py-8",
    icon: "h-8 w-8",
    title: "text-base",
    description: "text-xs",
  },
  md: {
    container: "py-12",
    icon: "h-12 w-12",
    title: "text-lg",
    description: "text-sm",
  },
  lg: {
    container: "py-16",
    icon: "h-16 w-16",
    title: "text-xl",
    description: "text-base",
  },
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = "md",
  className,
  ...props
}: EmptyStateProps) {
  const sizes = sizeClasses[size]

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        sizes.container,
        className
      )}
      {...props}
    >
      {Icon && (
        <Icon 
          className={cn(
            "text-muted-foreground mb-4",
            sizes.icon
          )} 
        />
      )}
      
      <h3 className={cn(
        "font-semibold text-foreground mb-2",
        sizes.title
      )}>
        {title}
      </h3>
      
      {description && (
        <p className={cn(
          "text-muted-foreground max-w-sm",
          sizes.description
        )}>
          {description}
        </p>
      )}
      
      {action && (
        <Button
          onClick={action.onClick}
          className="mt-6"
          variant="default"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
