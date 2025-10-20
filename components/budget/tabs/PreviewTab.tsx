"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatsCards } from "../shared/StatsCards"

interface ProductoIndividual {
  id: string
  nombre: string
  cantidad: number
  precio: number
}

interface PreviewTabProps {
  productos: ProductoIndividual[]
  config: any
  formatPrice: (amount: number) => string
  currencySymbol?: string
}

export function PreviewTab({ productos, config, formatPrice, currencySymbol = "€" }: PreviewTabProps) {
  const calculateSubtotal = () => {
    return productos.reduce((sum, p) => sum + (p.cantidad * p.precio), 0)
  }

  const calculateCoordination = () => {
    const subtotal = calculateSubtotal()
    return config.coordination_enabled ? subtotal * config.coordination_rate : 0
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateCoordination()
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <StatsCards
        subtotal={calculateSubtotal()}
        coordination={calculateCoordination()}
        total={calculateTotal()}
        currencySymbol={currencySymbol}
      />

      {/* Tabla de productos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Desglose de Productos</CardTitle>
              <CardDescription>
                {productos.length} productos configurados
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {productos.length} items
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold text-sm">#</th>
                  <th className="text-left p-3 font-semibold text-sm">Producto</th>
                  <th className="text-right p-3 font-semibold text-sm">Cantidad</th>
                  <th className="text-right p-3 font-semibold text-sm">Precio Unit.</th>
                  <th className="text-right p-3 font-semibold text-sm">Total</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((producto, index) => (
                  <tr key={producto.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-3 text-sm text-muted-foreground">{index + 1}</td>
                    <td className="p-3 text-sm font-medium">{producto.nombre}</td>
                    <td className="p-3 text-sm text-right">{producto.cantidad}</td>
                    <td className="p-3 text-sm text-right">{currencySymbol}{formatPrice(producto.precio)}</td>
                    <td className="p-3 text-sm text-right font-semibold">
                      {currencySymbol}{formatPrice(producto.cantidad * producto.precio)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-muted/50">
                  <td colSpan={4} className="p-3 text-sm font-semibold text-right">
                    Subtotal:
                  </td>
                  <td className="p-3 text-sm text-right font-bold">
                    {currencySymbol}{formatPrice(calculateSubtotal())}
                  </td>
                </tr>
                {config.coordination_enabled && (
                  <tr className="bg-purple-50">
                    <td colSpan={4} className="p-3 text-sm font-medium text-right text-purple-700">
                      {config.coordination_description} ({(config.coordination_rate * 100).toFixed(0)}%):
                    </td>
                    <td className="p-3 text-sm text-right font-semibold text-purple-900">
                      {currencySymbol}{formatPrice(calculateCoordination())}
                    </td>
                  </tr>
                )}
                <tr className="border-t-2 bg-green-50">
                  <td colSpan={4} className="p-3 text-base font-bold text-right text-green-900">
                    TOTAL:
                  </td>
                  <td className="p-3 text-base text-right font-bold text-green-900">
                    {currencySymbol}{formatPrice(calculateTotal())}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
