"use client"

import { Card, CardContent } from "@/components/ui/card"
import { DollarSign, Settings, CheckCircle } from "lucide-react"

interface StatsCardsProps {
  subtotal: number
  coordination: number
  total: number
  currencySymbol?: string
}

export function StatsCards({ subtotal, coordination, total, currencySymbol = "€" }: StatsCardsProps) {
  const formatPrice = (amount: number) => `${currencySymbol}${amount.toFixed(2)}`

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-primary/20 bg-gradient-to-br from-blue-50 to-blue-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">
                Subtotal Productos
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {formatPrice(subtotal)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">
                Coordinación
              </p>
              <p className="text-2xl font-bold text-purple-900">
                {formatPrice(coordination)}
              </p>
            </div>
            <Settings className="h-8 w-8 text-purple-400" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-green-600">
                Total Final
              </p>
              <p className="text-2xl font-bold text-green-900">
                {formatPrice(total)}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
