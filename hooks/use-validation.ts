"use client"

export interface ValidationRule {
  type: "email" | "date" | "number" | "text" | "custom"
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  customValidator?: (value: any) => string | null
  message?: string
}

export interface ValidationResult {
  isValid: boolean
  error: string | null
  warnings: string[]
}

export class ValidationError extends Error {
  constructor(public field: string, public validationMessage: string) {
    super(`Validation error in field ${field}: ${validationMessage}`)
    this.name = "ValidationError"
  }
}

export function useValidation() {
  
  // Validador de email
  const validateEmail = (email: string): ValidationResult => {
    if (!email) {
      return { isValid: false, error: "Email es requerido", warnings: [] }
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { isValid: false, error: "Formato de email inválido", warnings: [] }
    }
    
    // Advertencias para emails que pueden ser problemáticos
    const warnings: string[] = []
    if (email.includes("example.com") || email.includes("test.com")) {
      warnings.push("Este parece ser un email de prueba")
    }
    
    return { isValid: true, error: null, warnings }
  }

  // Validador de fechas
  const validateDate = (dateString: string): ValidationResult => {
    if (!dateString) {
      return { isValid: false, error: "Fecha es requerida", warnings: [] }
    }
    
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return { isValid: false, error: "Formato de fecha inválido", warnings: [] }
    }
    
    const now = new Date()
    const warnings: string[] = []
    
    // Advertencia si la fecha es en el pasado
    if (date < now) {
      warnings.push("La fecha está en el pasado")
    }
    
    // Advertencia si la fecha es muy lejana en el futuro
    const oneYearFromNow = new Date()
    oneYearFromNow.setFullYear(now.getFullYear() + 1)
    if (date > oneYearFromNow) {
      warnings.push("La fecha está muy lejos en el futuro")
    }
    
    return { isValid: true, error: null, warnings }
  }

  // Validador de números
  const validateNumber = (value: number, min?: number, max?: number, required = true): ValidationResult => {
    if (value === null || value === undefined || isNaN(value)) {
      if (required) {
        return { isValid: false, error: "Número es requerido", warnings: [] }
      }
      return { isValid: true, error: null, warnings: [] }
    }
    
    const warnings: string[] = []
    
    if (min !== undefined && value < min) {
      return { isValid: false, error: `El valor debe ser mayor o igual a ${min}`, warnings: [] }
    }
    
    if (max !== undefined && value > max) {
      return { isValid: false, error: `El valor debe ser menor o igual a ${max}`, warnings: [] }
    }
    
    // Advertencias para valores extremos
    if (min !== undefined && value === min) {
      warnings.push("Valor está en el límite mínimo")
    }
    
    if (max !== undefined && value === max) {
      warnings.push("Valor está en el límite máximo")
    }
    
    return { isValid: true, error: null, warnings }
  }

  // Validador de texto
  const validateText = (text: string, minLength?: number, maxLength?: number, required = true): ValidationResult => {
    if (!text || text.trim().length === 0) {
      if (required) {
        return { isValid: false, error: "Texto es requerido", warnings: [] }
      }
      return { isValid: true, error: null, warnings: [] }
    }
    
    const trimmedText = text.trim()
    const warnings: string[] = []
    
    if (minLength && trimmedText.length < minLength) {
      return { isValid: false, error: `El texto debe tener al menos ${minLength} caracteres`, warnings: [] }
    }
    
    if (maxLength && trimmedText.length > maxLength) {
      return { isValid: false, error: `El texto debe tener máximo ${maxLength} caracteres`, warnings: [] }
    }
    
    // Advertencias
    if (maxLength && trimmedText.length > maxLength * 0.9) {
      warnings.push("Cerca del límite máximo de caracteres")
    }
    
    return { isValid: true, error: null, warnings }
  }

  // Validador de cantidades con detección de cambios grandes
  const validateQuantityChange = (originalValue: number, newValue: number, threshold = 0.5): ValidationResult => {
    const result = validateNumber(newValue, 0)
    if (!result.isValid) return result
    
    if (originalValue > 0) {
      const changePercentage = Math.abs(newValue - originalValue) / originalValue
      
      if (changePercentage > threshold) {
        const percentageString = (changePercentage * 100).toFixed(0)
        result.warnings.push(`Cambio grande detectado: ${percentageString}% respecto al valor original`)
      }
    }
    
    return result
  }

  // Validador de precios
  const validatePrice = (price: number, currency: string = "EUR"): ValidationResult => {
    const result = validateNumber(price, 0, undefined, true)
    if (!result.isValid) return result
    
    // Límites específicos por moneda
    const currencyLimits = {
      EUR: { max: 10000, warningThreshold: 1000 },
      USD: { max: 12000, warningThreshold: 1200 },
      MXN: { max: 200000, warningThreshold: 20000 },
      VES: { max: 500000, warningThreshold: 50000 }
    }
    
    const limits = currencyLimits[currency as keyof typeof currencyLimits] || currencyLimits.EUR
    
    if (price > limits.max) {
      return { isValid: false, error: `Precio demasiado alto para ${currency}`, warnings: [] }
    }
    
    if (price > limits.warningThreshold) {
      result.warnings.push(`Precio alto para ${currency}`)
    }
    
    if (price === 0) {
      result.warnings.push("Precio es cero")
    }
    
    return result
  }

  // Función genérica de validación
  const validate = (value: any, rules: ValidationRule[]): ValidationResult => {
    let result: ValidationResult = { isValid: true, error: null, warnings: [] }
    
    for (const rule of rules) {
      let ruleResult: ValidationResult
      
      switch (rule.type) {
        case "email":
          ruleResult = validateEmail(value)
          break
        case "date":
          ruleResult = validateDate(value)
          break
        case "number":
          ruleResult = validateNumber(value, rule.min, rule.max, rule.required)
          break
        case "text":
          ruleResult = validateText(value, rule.minLength, rule.maxLength, rule.required)
          break
        case "custom":
          if (rule.customValidator) {
            const customError = rule.customValidator(value)
            ruleResult = {
              isValid: customError === null,
              error: customError,
              warnings: []
            }
          } else {
            ruleResult = { isValid: true, error: null, warnings: [] }
          }
          break
        default:
          ruleResult = { isValid: true, error: null, warnings: [] }
      }
      
      // Si alguna regla falla, el resultado final es inválido
      if (!ruleResult.isValid) {
        return {
          isValid: false,
          error: ruleResult.error || rule.message || "Validación fallida",
          warnings: [...result.warnings, ...ruleResult.warnings]
        }
      }
      
      // Acumular advertencias
      result.warnings = [...result.warnings, ...ruleResult.warnings]
    }
    
    return result
  }

  return {
    validate,
    validateEmail,
    validateDate,
    validateNumber,
    validateText,
    validateQuantityChange,
    validatePrice,
    ValidationError
  }
}
