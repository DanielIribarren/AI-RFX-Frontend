import { BarChart3, FileText, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"

export function Header() {
  return (
    <header className="flex items-center justify-between py-4">
      <div className="flex items-center gap-2">
        <FileText className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold">RFx Analyzer</h1>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <BarChart3 className="h-5 w-5" />
          <span className="sr-only">Estadísticas</span>
        </Button>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Configuración</span>
        </Button>
        <ModeToggle />
      </div>
    </header>
  )
}
