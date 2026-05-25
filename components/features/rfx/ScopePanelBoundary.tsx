"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

// Belt-and-suspenders around ScopePanel. The component itself already
// guards against malformed scope_json shape, but a React render error
// somewhere deeper (e.g. a bad child component, a string with weird
// unicode, an unexpected null in a sub-field we forgot to nullcheck)
// would otherwise propagate and blank the whole RFX detail page.
// This boundary contains the blast radius to just the panel.

interface ScopePanelBoundaryProps {
  children: ReactNode
}

interface ScopePanelBoundaryState {
  hasError: boolean
  message?: string
}

export class ScopePanelBoundary extends Component<
  ScopePanelBoundaryProps,
  ScopePanelBoundaryState
> {
  state: ScopePanelBoundaryState = { hasError: false }

  static getDerivedStateFromError(error: Error): ScopePanelBoundaryState {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error("[ScopePanel] Render error contained by boundary:", error, errorInfo)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Card className="border-red-200 bg-red-50/40">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div className="text-sm text-red-900">
              <p className="font-medium">Could not render the construction scope</p>
              <p className="mt-1 text-xs text-red-800">
                The rest of the proposal is unaffected. Try refreshing the page; if it
                keeps failing, contact engineering with the rfx_id and this message:{" "}
                <span className="font-mono">{this.state.message || "unknown"}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}
