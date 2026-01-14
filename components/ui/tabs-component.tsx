"use client"

import { useState, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface Tab {
  id: string
  label: string
  children: ReactNode
}

interface TabsComponentProps {
  children: ReactNode[]
  defaultTab: string
  className?: string
}

interface TabProps {
  id: string
  label: string
  children: ReactNode
}

export function Tab({ children }: TabProps) {
  return <>{children}</>
}

export function TabsComponent({ children, defaultTab, className }: TabsComponentProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  // Extract tab information from children
  const tabs: Tab[] = []
  
  // Process children to extract tab data
  const processChild = (child: any) => {
    if (child?.props?.id && child?.props?.label) {
      tabs.push({
        id: child.props.id,
        label: child.props.label,
        children: child.props.children
      })
    }
  }

  if (Array.isArray(children)) {
    children.forEach(processChild)
  } else {
    processChild(children)
  }

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.children

  return (
    <div className={cn("tabs-container", className)}>
      {/* Tabs Header */}
      <div className="tabs-header border-b border">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200",
                activeTab === tab.id
                  ? "border-primary-light text-primary"
                  : "border-transparent text-muted-foreground hover:text-gray-700 hover:border-input"
              )}
              aria-current={activeTab === tab.id ? "page" : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tabs Content */}
      <div className="tabs-content py-6">
        {activeTabContent}
      </div>
    </div>
  )
}
