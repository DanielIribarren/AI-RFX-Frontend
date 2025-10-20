"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"

interface PricingTabProps {
  config: any
  onConfigChange: (config: any) => void
  onSave?: () => Promise<boolean> | void
  isDisabled: boolean
  isLoading?: boolean
}

export function PricingTab({ config, onConfigChange, onSave, isDisabled, isLoading = false }: PricingTabProps) {
  const handleSave = async () => {
    if (onSave) {
      await onSave()
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Coordinación */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                Coordinación y Logística
                {config.coordination_enabled && (
                  <Badge variant="secondary" className="ml-2">
                    Activo
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Agregar costos de coordinación al presupuesto
              </CardDescription>
            </div>
            <Switch
              checked={config.coordination_enabled}
              onCheckedChange={(checked) => 
                onConfigChange({ ...config, coordination_enabled: checked })
              }
              disabled={isDisabled}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coord-type">Tipo de Coordinación</Label>
              <select
                id="coord-type"
                value={config.coordination_type}
                onChange={(e) => onConfigChange({ 
                  ...config, 
                  coordination_type: e.target.value 
                })}
                disabled={isDisabled || !config.coordination_enabled}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="standard">Estándar</option>
                <option value="premium">Premium</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coord-rate">Porcentaje (%)</Label>
              <Input
                id="coord-rate"
                type="number"
                value={(config.coordination_rate * 100).toFixed(2)}
                onChange={(e) => onConfigChange({ 
                  ...config, 
                  coordination_rate: parseFloat(e.target.value) / 100 
                })}
                disabled={isDisabled || !config.coordination_enabled}
                min="0"
                max="100"
                step="0.5"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="coord-desc">Descripción</Label>
            <Input
              id="coord-desc"
              type="text"
              value={config.coordination_description}
              onChange={(e) => onConfigChange({ 
                ...config, 
                coordination_description: e.target.value 
              })}
              disabled={isDisabled || !config.coordination_enabled}
              placeholder="Ej: Coordinación y logística"
            />
          </div>

          <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
            <Switch
              id="apply-subtotal"
              checked={config.coordination_apply_to_subtotal}
              onCheckedChange={(checked) => 
                onConfigChange({ ...config, coordination_apply_to_subtotal: checked })
              }
              disabled={isDisabled || !config.coordination_enabled}
            />
            <Label htmlFor="apply-subtotal" className="text-sm cursor-pointer">
              Aplicar sobre el subtotal de productos
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Costo por persona */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                Costo por Persona
                {config.cost_per_person_enabled && (
                  <Badge variant="secondary" className="ml-2">
                    Activo
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Calcular y mostrar costo individual
              </CardDescription>
            </div>
            <Switch
              checked={config.cost_per_person_enabled}
              onCheckedChange={(checked) => 
                onConfigChange({ ...config, cost_per_person_enabled: checked })
              }
              disabled={isDisabled}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="headcount">Número de Personas</Label>
              <Input
                id="headcount"
                type="number"
                value={config.headcount}
                onChange={(e) => onConfigChange({ 
                  ...config, 
                  headcount: parseInt(e.target.value) || 0 
                })}
                disabled={isDisabled || !config.cost_per_person_enabled}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="headcount-source">Fuente del Dato</Label>
              <select
                id="headcount-source"
                value={config.headcount_source}
                onChange={(e) => onConfigChange({ 
                  ...config, 
                  headcount_source: e.target.value 
                })}
                disabled={isDisabled || !config.cost_per_person_enabled}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="manual">Manual</option>
                <option value="extracted">Extraído del RFX</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Impuestos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                Impuestos
                {config.taxes_enabled && (
                  <Badge variant="secondary" className="ml-2">
                    Activo
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Configurar impuestos aplicables
              </CardDescription>
            </div>
            <Switch
              checked={config.taxes_enabled}
              onCheckedChange={(checked) => 
                onConfigChange({ ...config, taxes_enabled: checked })
              }
              disabled={isDisabled}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tax-name">Nombre del Impuesto</Label>
              <Input
                id="tax-name"
                type="text"
                value={config.tax_name}
                onChange={(e) => onConfigChange({ 
                  ...config, 
                  tax_name: e.target.value 
                })}
                disabled={isDisabled || !config.taxes_enabled}
                placeholder="Ej: IVA"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax-rate">Tasa (%)</Label>
              <Input
                id="tax-rate"
                type="number"
                value={(config.tax_rate * 100).toFixed(2)}
                onChange={(e) => onConfigChange({ 
                  ...config, 
                  tax_rate: parseFloat(e.target.value) / 100 
                })}
                disabled={isDisabled || !config.taxes_enabled}
                min="0"
                max="100"
                step="0.5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón de guardar */}
      {onSave && (
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isDisabled || isLoading}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </div>
      )}

    </div>
  )
}
