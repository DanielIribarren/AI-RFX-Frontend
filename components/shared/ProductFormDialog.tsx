"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { CatalogProduct } from "@/lib/api-catalog"

interface ProductFormData {
  product_name: string
  product_code: string
  unit_cost: string
  unit_price: string
  unit: string
}

const EMPTY_FORM: ProductFormData = {
  product_name: "",
  product_code: "",
  unit_cost: "",
  unit_price: "",
  unit: "unidad",
}

interface ProductFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    product_name: string
    product_code?: string
    unit_cost?: number
    unit_price?: number
    unit?: string
  }) => Promise<void>
  product?: CatalogProduct | null
  isSaving?: boolean
}

export function ProductFormDialog({
  isOpen,
  onClose,
  onSubmit,
  product,
  isSaving = false,
}: ProductFormDialogProps) {
  const isEditing = !!product
  const [form, setForm] = useState<ProductFormData>(EMPTY_FORM)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen) {
      setError("")
      if (product) {
        setForm({
          product_name: product.product_name || "",
          product_code: product.product_code || "",
          unit_cost: product.unit_cost ? String(product.unit_cost) : "",
          unit_price: product.unit_price ? String(product.unit_price) : "",
          unit: product.unit || "unidad",
        })
      } else {
        setForm(EMPTY_FORM)
      }
    }
  }, [isOpen, product])

  const handleChange = (field: keyof ProductFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (error) setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const name = form.product_name.trim()
    if (!name) {
      setError("Product name is required")
      return
    }

    const payload: {
      product_name: string
      product_code?: string
      unit_cost?: number
      unit_price?: number
      unit?: string
    } = { product_name: name }

    if (form.product_code.trim()) {
      payload.product_code = form.product_code.trim()
    }
    if (form.unit_cost !== "") {
      const cost = parseFloat(form.unit_cost)
      if (isNaN(cost) || cost < 0) {
        setError("Unit cost must be a valid positive number")
        return
      }
      payload.unit_cost = cost
    }
    if (form.unit_price !== "") {
      const price = parseFloat(form.unit_price)
      if (isNaN(price) || price < 0) {
        setError("Unit price must be a valid positive number")
        return
      }
      payload.unit_price = price
    }
    if (form.unit.trim()) {
      payload.unit = form.unit.trim()
    }

    await onSubmit(payload)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Product" : "Add Product"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the product information below."
                : "Fill in the product details to add it to your catalog."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="product_name">
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="product_name"
                placeholder="e.g. Tequeños de Queso"
                value={form.product_name}
                onChange={(e) => handleChange("product_name", e.target.value)}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="product_code">Product Code</Label>
                <Input
                  id="product_code"
                  placeholder="e.g. TEQ-001"
                  value={form.product_code}
                  onChange={(e) => handleChange("product_code", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  placeholder="e.g. bandeja"
                  value={form.unit}
                  onChange={(e) => handleChange("unit", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="unit_cost">Unit Cost ($)</Label>
                <Input
                  id="unit_cost"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.unit_cost}
                  onChange={(e) => handleChange("unit_cost", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit_price">Unit Price ($)</Label>
                <Input
                  id="unit_price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.unit_price}
                  onChange={(e) => handleChange("unit_price", e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="bg-brand-gradient text-white">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? "Saving..." : "Adding..."}
                </>
              ) : (
                isEditing ? "Save Changes" : "Add Product"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
