"use client"

import { useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type Currency = {
  code: string
  name: string
  symbol: string
  flag: string
}

export const CURRENCIES: Currency[] = [
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "USD", name: "Dólar Estadounidense", symbol: "$", flag: "🇺🇸" },
  { code: "MXN", name: "Peso Mexicano", symbol: "$", flag: "🇲🇽" },
  { code: "VES", name: "Bolívar Venezolano", symbol: "Bs.", flag: "🇻🇪" },
]

interface CurrencySelectorProps {
  value: string
  onValueChange: (currency: string) => void
  className?: string
  disabled?: boolean
}

export function CurrencySelector({ 
  value, 
  onValueChange, 
  className,
  disabled = false 
}: CurrencySelectorProps) {
  const [open, setOpen] = useState(false)
  
  const selectedCurrency = CURRENCIES.find((currency) => currency.code === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[180px] justify-between", className)}
          disabled={disabled}
        >
          {selectedCurrency ? (
            <div className="flex items-center gap-2">
              <span>{selectedCurrency.flag}</span>
              <span>{selectedCurrency.symbol}</span>
              <span className="text-sm">{selectedCurrency.code}</span>
            </div>
          ) : (
            "Seleccionar moneda..."
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Buscar moneda..." />
          <CommandList>
            <CommandEmpty>No se encontró moneda.</CommandEmpty>
            <CommandGroup>
              {CURRENCIES.map((currency) => (
                <CommandItem
                  key={currency.code}
                  value={currency.code}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span>{currency.flag}</span>
                    <div className="flex flex-col">
                      <span className="font-medium">{currency.code}</span>
                      <span className="text-xs text-gray-500">{currency.name}</span>
                    </div>
                    <span className="ml-auto font-medium">{currency.symbol}</span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === currency.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
