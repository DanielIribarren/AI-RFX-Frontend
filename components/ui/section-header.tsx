import * as React from "react"
import { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  title: string
  description?: string
  level?: 1 | 2 | 3
}

function SectionHeader({ 
  className, 
  icon: Icon, 
  title, 
  description, 
  level = 2,
  ...props 
}: SectionHeaderProps) {
  const HeaderTag = `h${level}` as keyof JSX.IntrinsicElements
  
  const headerClass = cn(
    "font-semibold text-gray-800 flex items-center gap-2",
    {
      "text-3xl": level === 1,
      "text-xl": level === 2,
      "text-lg": level === 3,
    }
  )

  return (
    <div className={cn("space-y-1", className)} {...props}>
      <HeaderTag className={headerClass}>
        {Icon && <Icon className="h-5 w-5" />}
        {title}
      </HeaderTag>
      {description && (
        <p className="text-sm text-gray-600">
          {description}
        </p>
      )}
    </div>
  )
}

export { SectionHeader }
