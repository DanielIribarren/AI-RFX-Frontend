"use client"

import { useState, useCallback, useMemo } from "react"
import { CURRENCIES, Currency } from "@/components/ui/currency-selector"

// Tasas de cambio simuladas (en una app real, estas vendrían de una API)
const EXCHANGE_RATES: Record<string, Record<string, number>> = {
  EUR: {
    EUR: 1,
    USD: 1.08,
    MXN: 18.50,
    VES: 38.75
  },
  USD: {
    EUR: 0.93,
    USD: 1,
    MXN: 17.10,
    VES: 36.00
  },
  MXN: {
    EUR: 0.054,
    USD: 0.058,
    MXN: 1,
    VES: 2.10
  },
  VES: {
    EUR: 0.026,
    USD: 0.028,
    MXN: 0.48,
    VES: 1
  }
}

export interface UseCurrencyReturn {
  selectedCurrency: string
  setCurrency: (currency: string) => void
  getCurrencyInfo: () => Currency | undefined
  convertPrice: (price: number, fromCurrency?: string, toCurrency?: string) => number
  formatPrice: (price: number, currency?: string) => string
  formatPriceWithSymbol: (price: number, currency?: string) => string
  supportedCurrencies: Currency[]
}

export function useCurrency(defaultCurrency: string = "EUR"): UseCurrencyReturn {
  const [selectedCurrency, setSelectedCurrency] = useState<string>(defaultCurrency)

  const setCurrency = useCallback((currency: string) => {
    if (CURRENCIES.find(c => c.code === currency)) {
      setSelectedCurrency(currency)
    }
  }, [])

  const getCurrencyInfo = useCallback((): Currency | undefined => {
    return CURRENCIES.find(c => c.code === selectedCurrency)
  }, [selectedCurrency])

  const convertPrice = useCallback((
    price: number, 
    fromCurrency: string = "EUR", 
    toCurrency?: string
  ): number => {
    const targetCurrency = toCurrency || selectedCurrency
    
    if (fromCurrency === targetCurrency) {
      return price
    }

    const rate = EXCHANGE_RATES[fromCurrency]?.[targetCurrency]
    if (!rate) {
      console.warn(`No exchange rate found for ${fromCurrency} to ${targetCurrency}`)
      return price
    }

    return price * rate
  }, [selectedCurrency])

  const formatPrice = useCallback((price: number, currency?: string): string => {
    const targetCurrency = currency || selectedCurrency
    const currencyInfo = CURRENCIES.find(c => c.code === targetCurrency)
    
    if (!currencyInfo) {
      return price.toFixed(2)
    }

    // Formatear según la moneda
    const locale = {
      EUR: "es-ES",
      USD: "en-US", 
      MXN: "es-MX",
      VES: "es-VE"
    }[targetCurrency] || "es-ES"

    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: targetCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(price)
    } catch (error) {
      // Fallback si hay problema con la localización
      return `${currencyInfo.symbol}${price.toFixed(2)}`
    }
  }, [selectedCurrency])

  const formatPriceWithSymbol = useCallback((price: number, currency?: string): string => {
    const targetCurrency = currency || selectedCurrency
    const currencyInfo = CURRENCIES.find(c => c.code === targetCurrency)
    
    if (!currencyInfo) {
      return price.toFixed(2)
    }

    return `${currencyInfo.symbol}${price.toFixed(2)}`
  }, [selectedCurrency])

  const supportedCurrencies = useMemo(() => CURRENCIES, [])

  return {
    selectedCurrency,
    setCurrency,
    getCurrencyInfo,
    convertPrice,
    formatPrice,
    formatPriceWithSymbol,
    supportedCurrencies
  }
}
