"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { api } from '@/lib/api'
import { useCurrency } from '@/hooks/use-currency'

interface RFXCurrencyContextType {
  // Current RFX being viewed
  currentRfxId: string | null
  
  // Currency state
  selectedCurrency: string
  getCurrencyInfo: () => any
  formatPrice: (amount: number, currency?: string) => string
  formatPriceWithSymbol: (amount: number, currency?: string) => string
  convertPrice: (price: number, fromCurrency?: string, toCurrency?: string) => number
  
  // Actions
  setRfxContext: (rfxId: string, initialCurrency?: string) => void
  updateCurrency: (newCurrency: string) => Promise<void>
  clearRfxContext: () => void
  
  // Price review tracking (optional UI enhancement)
  markProductPriceAsReviewed: (productId: string) => void
  isProductPriceUnreviewed: (productId: string) => boolean
  lastCurrencyChangeTimestamp: number | null
  
  // Loading state
  isUpdatingCurrency: boolean
}

const RFXCurrencyContext = createContext<RFXCurrencyContextType | undefined>(undefined)

interface RFXCurrencyProviderProps {
  children: React.ReactNode
}

export function RFXCurrencyProvider({ children }: RFXCurrencyProviderProps) {
  const [currentRfxId, setCurrentRfxId] = useState<string | null>(null)
  const [isUpdatingCurrency, setIsUpdatingCurrency] = useState(false)
  
  // Price review tracking state
  const [lastCurrencyChangeTimestamp, setLastCurrencyChangeTimestamp] = useState<number | null>(null)
  const [reviewedProductIds, setReviewedProductIds] = useState<Set<string>>(new Set())
  
  // Use the existing useCurrency hook as the foundation
  const {
    selectedCurrency,
    setCurrency,
    getCurrencyInfo,
    formatPrice,
    formatPriceWithSymbol,
    convertPrice
  } = useCurrency("EUR") // Default fallback
  
  // Set RFX context and initialize currency from backend
  const setRfxContext = useCallback(async (rfxId: string, initialCurrency?: string) => {
    console.log(`🏦 Setting RFX context: ${rfxId}`, { initialCurrency })
    
    setCurrentRfxId(rfxId)
    
    // Reset price review tracking for new RFX
    setLastCurrencyChangeTimestamp(null)
    setReviewedProductIds(new Set())
    
    if (initialCurrency) {
      // Use provided initial currency immediately
      setCurrency(initialCurrency)
    } else {
      // Fetch current currency from backend
      try {
        const response = await api.getRFXById(rfxId)
        if (response.status === "success" && response.data) {
          const backendCurrency = (response.data as any)?.currency
          if (backendCurrency && typeof backendCurrency === 'string') {
            console.log(`💱 Loading currency from backend: ${backendCurrency}`)
            setCurrency(backendCurrency)
          }
        }
      } catch (error) {
        console.error("❌ Error loading RFX currency:", error)
        // Continue with default currency
      }
    }
  }, [setCurrency])
  
  // Update currency and persist to backend (visual change only, no price conversion)
  const updateCurrency = useCallback(async (newCurrency: string) => {
    if (!currentRfxId) {
      console.warn("⚠️ No RFX context set for currency update")
      return
    }
    
    if (newCurrency === selectedCurrency) {
      console.log("ℹ️ Currency unchanged, skipping update")
      return
    }
    
    console.log(`💱 Updating RFX ${currentRfxId} currency: ${selectedCurrency} → ${newCurrency} (visual only)`)
    
    setIsUpdatingCurrency(true)
    
    try {
      // Update local state immediately for better UX
      setCurrency(newCurrency)
      
      // Persist to backend (allows change even with priced products)
      const response = await api.updateRFXCurrency(currentRfxId, newCurrency)
      
      console.log(`✅ Currency updated successfully: ${newCurrency}`)
      
      // Update timestamp for price review tracking
      setLastCurrencyChangeTimestamp(Date.now())
      // Clear reviewed products list since currency changed
      setReviewedProductIds(new Set())
      
      // Check for warnings about priced products
      if (response?.data?.warnings?.includes('prices_not_converted')) {
        const pricedProductsCount = response.data.priced_products_count || 0
        
        if (pricedProductsCount > 0) {
          // Show manual adjustment warning
          const message = `✅ Moneda cambiada de ${response.data.old_currency || selectedCurrency} a ${newCurrency}.\n\n⚠️ IMPORTANTE: ${pricedProductsCount} producto(s) mantienen sus precios originales y requieren ajuste manual para reflejar la nueva moneda.`
          
          alert(message)
          console.log(`⚠️ ${pricedProductsCount} products need manual price adjustment`)
        }
      }
      
    } catch (error) {
      console.error(`❌ Error updating currency:`, error)
      
      // Revert local state on error
      setCurrency(selectedCurrency)
      
      // Show user-friendly error
      throw new Error('No se pudo actualizar la moneda. Por favor, intente nuevamente.')
    } finally {
      setIsUpdatingCurrency(false)
    }
  }, [currentRfxId, selectedCurrency, setCurrency])
  
  // Clear RFX context (when navigating away from RFX pages)
  const clearRfxContext = useCallback(() => {
    console.log("🧹 Clearing RFX currency context")
    setCurrentRfxId(null)
    // Clear price review tracking
    setLastCurrencyChangeTimestamp(null)
    setReviewedProductIds(new Set())
    // Keep currency for next RFX, don't reset to avoid jarring UX
  }, [])
  
  // Mark a product price as reviewed after currency change
  const markProductPriceAsReviewed = useCallback((productId: string) => {
    setReviewedProductIds(prev => {
      const newSet = new Set(prev)
      newSet.add(productId)
      console.log(`✅ Product ${productId} marked as price-reviewed`)
      return newSet
    })
  }, [])
  
  // Check if a product price is unreviewed since last currency change
  const isProductPriceUnreviewed = useCallback((productId: string) => {
    // If no currency change has happened, all products are considered reviewed
    if (!lastCurrencyChangeTimestamp) return false
    
    // Product is unreviewed if it's not in the reviewed set
    return !reviewedProductIds.has(productId)
  }, [lastCurrencyChangeTimestamp, reviewedProductIds])
  
  const contextValue: RFXCurrencyContextType = {
    currentRfxId,
    selectedCurrency,
    getCurrencyInfo,
    formatPrice,
    formatPriceWithSymbol,
    convertPrice,
    setRfxContext,
    updateCurrency,
    clearRfxContext,
    markProductPriceAsReviewed,
    isProductPriceUnreviewed,
    lastCurrencyChangeTimestamp,
    isUpdatingCurrency
  }
  
  return (
    <RFXCurrencyContext.Provider value={contextValue}>
      {children}
    </RFXCurrencyContext.Provider>
  )
}

// Custom hook to use the RFX currency context
export function useRFXCurrency() {
  const context = useContext(RFXCurrencyContext)
  
  if (context === undefined) {
    throw new Error('useRFXCurrency must be used within a RFXCurrencyProvider')
  }
  
  return context
}

// Helper hook for backward compatibility with existing useCurrency() calls
export function useRFXCurrencyCompatible(defaultCurrency?: string) {
  const context = useContext(RFXCurrencyContext)
  
  if (context) {
    // Use context if available (within RFX pages)
    return {
      selectedCurrency: context.selectedCurrency,
      setCurrency: (currency: string) => context.updateCurrency(currency).catch(console.error),
      getCurrencyInfo: context.getCurrencyInfo,
      formatPrice: context.formatPrice,
      formatPriceWithSymbol: context.formatPriceWithSymbol,
      convertPrice: context.convertPrice,
      supportedCurrencies: context.getCurrencyInfo()?.code ? [context.getCurrencyInfo()] : [],
      // Additional RFX-specific features
      markProductPriceAsReviewed: context.markProductPriceAsReviewed,
      isProductPriceUnreviewed: context.isProductPriceUnreviewed,
      lastCurrencyChangeTimestamp: context.lastCurrencyChangeTimestamp
    }
  } else {
    // Fallback to local useCurrency for non-RFX pages
    const baseCurrency = useCurrency(defaultCurrency || "EUR")
    return {
      ...baseCurrency,
      // Provide stub functions for RFX-specific features
      markProductPriceAsReviewed: () => {},
      isProductPriceUnreviewed: () => false,
      lastCurrencyChangeTimestamp: null
    }
  }
}
