"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface PricingTabProps {
  config: any
  onConfigChange: (config: any) => void
  onSave?: () => Promise<boolean> | void
  isDisabled: boolean
  isLoading?: boolean
  onAutoSave?: (partialConfig: any) => Promise<void>
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error'
}

export function PricingTab({ config, onConfigChange, onSave, isDisabled, isLoading = false, onAutoSave, saveStatus = 'idle' }: PricingTabProps) {
  const handleSave = async () => {
    if (onSave) {
      await onSave()
    }
  }

  // Auto-save handler for individual changes
  const handleAutoSave = async (partialConfig: any) => {
    if (onAutoSave) {
      await onAutoSave(partialConfig)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Indicador de guardado automático */}
      {saveStatus !== 'idle' && (
        <div className="flex items-center justify-end gap-2 text-sm">
          {saveStatus === 'saving' && (
            <>
              <div className="h-2 w-2 rounded-full bg-primary-light animate-pulse" />
              <span className="text-muted-foreground">Saving...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-green-600">Saved</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-destructive">Error saving</span>
            </>
          )}
        </div>
      )}
      
      {/* Coordinación */}
      <Card className={config.coordination_enabled ? "border-l-4 border-l-green-500" : "border-l-4 border-l-gray-300"}>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1 flex-1">
              <CardTitle className="flex items-center gap-3">
                Coordination and Logistics
                <Badge 
                  variant="secondary"
                  className={config.coordination_enabled 
                    ? "bg-green-500 hover:bg-green-600 text-background border-green-500" 
                    : "bg-muted text-muted-foreground border-input"
                  }
                >
                  {config.coordination_enabled ? "Active" : "Inactive"}
                </Badge>
              </CardTitle>
              <CardDescription>
                Add coordination costs to budget
              </CardDescription>
            </div>
            <Switch
              checked={config.coordination_enabled}
              onCheckedChange={async (checked) => {
                const newConfig = { ...config, coordination_enabled: checked }
                onConfigChange(newConfig)
                await handleAutoSave({ coordination_enabled: checked })
              }}
              disabled={isDisabled}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coord-type">Coordination Type</Label>
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
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coord-rate">Percentage (%)</Label>
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
            <Label htmlFor="coord-desc">Description</Label>
            <Input
              id="coord-desc"
              type="text"
              value={config.coordination_description}
              onChange={(e) => onConfigChange({ 
                ...config, 
                coordination_description: e.target.value 
              })}
              disabled={isDisabled || !config.coordination_enabled}
              placeholder="e.g., Coordination and logistics"
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
              Apply to product subtotal
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Costo por persona */}
      <Card className={config.cost_per_person_enabled ? "border-l-4 border-l-green-500" : "border-l-4 border-l-gray-300"}>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1 flex-1">
              <CardTitle className="flex items-center gap-3">
                Cost Per Person
                <Badge 
                  variant="secondary"
                  className={config.cost_per_person_enabled 
                    ? "bg-green-500 hover:bg-green-600 text-background border-green-500" 
                    : "bg-muted text-muted-foreground border-input"
                  }
                >
                  {config.cost_per_person_enabled ? "Active" : "Inactive"}
                </Badge>
              </CardTitle>
              <CardDescription>
                Calculate and display individual cost
              </CardDescription>
            </div>
            <Switch
              checked={config.cost_per_person_enabled}
              onCheckedChange={async (checked) => {
                const newConfig = { ...config, cost_per_person_enabled: checked }
                onConfigChange(newConfig)
                await handleAutoSave({ cost_per_person_enabled: checked })
              }}
              disabled={isDisabled}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="headcount">Number of People</Label>
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
              <Label htmlFor="headcount-source">Data Source</Label>
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
                <option value="extracted">Extracted from RFX</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Impuestos */}
      <Card className={config.taxes_enabled ? "border-l-4 border-l-green-500" : "border-l-4 border-l-gray-300"}>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1 flex-1">
              <CardTitle className="flex items-center gap-3">
                Taxes
                <Badge 
                  variant="secondary"
                  className={config.taxes_enabled 
                    ? "bg-green-500 hover:bg-green-600 text-background border-green-500" 
                    : "bg-muted text-muted-foreground border-input"
                  }
                >
                  {config.taxes_enabled ? "Active" : "Inactive"}
                </Badge>
              </CardTitle>
              <CardDescription>
                Configure applicable taxes
              </CardDescription>
            </div>
            <Switch
              checked={config.taxes_enabled}
              onCheckedChange={async (checked) => {
                const newConfig = { ...config, taxes_enabled: checked }
                onConfigChange(newConfig)
                await handleAutoSave({ taxes_enabled: checked })
              }}
              disabled={isDisabled}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tax-name">Tax Name</Label>
              <Input
                id="tax-name"
                type="text"
                value={config.tax_name}
                onChange={(e) => onConfigChange({ 
                  ...config, 
                  tax_name: e.target.value 
                })}
                disabled={isDisabled || !config.taxes_enabled}
                placeholder="e.g., VAT"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax-rate">Rate (%)</Label>
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

    </div>
  )
}
