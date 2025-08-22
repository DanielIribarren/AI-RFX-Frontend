"use client"

import { Button } from "@/components/ui/button"
import { FileText, Home, History, ArrowLeft } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"

interface NavigationHeaderProps {
  currentPage: "main" | "results" | "history"
  onNavigateToMain: () => void
  onNavigateToHistory: () => void
  onNavigateBack?: () => void
  title?: string
  subtitle?: string
}

export function NavigationHeader({
  currentPage,
  onNavigateToMain,
  onNavigateToHistory,
  onNavigateBack,
  title,
  subtitle,
}: NavigationHeaderProps) {
  return (
    <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold">RFx Analyzer</h1>
            </div>

            {/* Navigation Buttons */}
            <nav className="hidden md:flex items-center gap-2">
              <Button
                variant={currentPage === "main" ? "default" : "ghost"}
                size="sm"
                onClick={onNavigateToMain}
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Principal
              </Button>
              <Button
                variant={currentPage === "history" ? "default" : "ghost"}
                size="sm"
                onClick={onNavigateToHistory}
                className="gap-2"
              >
                <History className="h-4 w-4" />
                Historial
              </Button>
            </nav>

            {/* Back Button for mobile or specific contexts */}
            {onNavigateBack && (
              <Button variant="ghost" size="sm" onClick={onNavigateBack} className="md:hidden gap-2">
                <ArrowLeft className="h-4 w-4" />
                Atrás
              </Button>
            )}
          </div>

          {/* Center - Page Title (for results page) */}
          {title && (
            <div className="hidden lg:block text-center">
              <h2 className="text-lg font-semibold">{title}</h2>
              {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
            </div>
          )}

          {/* Right side - Actions and Theme Toggle */}
          <div className="flex items-center gap-2">
            {/* Mobile Navigation Menu */}
            <div className="md:hidden">
              <Button variant={currentPage === "main" ? "default" : "ghost"} size="sm" onClick={onNavigateToMain}>
                <Home className="h-4 w-4" />
              </Button>
              <Button variant={currentPage === "history" ? "default" : "ghost"} size="sm" onClick={onNavigateToHistory}>
                <History className="h-4 w-4" />
              </Button>
            </div>

            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
