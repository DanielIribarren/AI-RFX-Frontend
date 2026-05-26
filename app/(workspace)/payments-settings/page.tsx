"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { HandCoins, Pencil, Plus, Trash2 } from "lucide-react";
import { LoadingSpinner, PageHeader } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { budyApi, type PaymentMethod } from "@/lib/api-budy";
import {
  PAYMENT_METHOD_FIELDS,
  PAYMENT_METHOD_FIELD_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_TYPES,
  type PaymentMethodFieldKey,
  type PaymentMethodType,
} from "@/constants/payment-methods";

type FormState = {
  method_type: PaymentMethodType;
  account_holder: string;
  bank_name: string;
  phone: string;
  national_id: string;
  email: string;
  account_number: string;
  instructions: string;
  is_active: boolean;
};

const EMPTY_FORM: FormState = {
  method_type: "pago_movil",
  account_holder: "",
  bank_name: "",
  phone: "",
  national_id: "",
  email: "",
  account_number: "",
  instructions: "",
  is_active: true,
};

function methodToForm(method: PaymentMethod): FormState {
  return {
    method_type: method.method_type as PaymentMethodType,
    account_holder: method.account_holder ?? "",
    bank_name: method.bank_name ?? "",
    phone: method.phone ?? "",
    national_id: method.national_id ?? "",
    email: method.email ?? "",
    account_number: method.account_number ?? "",
    instructions: method.instructions ?? "",
    is_active: method.is_active,
  };
}

function summarizeMethod(method: PaymentMethod): string {
  return (
    method.email ||
    method.phone ||
    method.account_number ||
    method.account_holder ||
    "Sin datos"
  );
}

export default function PaymentSettingsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingType, setDeletingType] = useState<string | null>(null);

  const configuredTypes = useMemo(() => new Set(methods.map((m) => m.method_type)), [methods]);

  const availableTypes = useMemo<PaymentMethodType[]>(() => {
    if (editing) {
      return [editing.method_type as PaymentMethodType];
    }
    return PAYMENT_METHOD_TYPES.filter((type) => !configuredTypes.has(type));
  }, [configuredTypes, editing]);

  const visibleFields: PaymentMethodFieldKey[] = useMemo(() => {
    return PAYMENT_METHOD_FIELDS[form.method_type] ?? [];
  }, [form.method_type]);

  const loadMethods = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await budyApi.getPaymentMethods();
      setMethods(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los métodos de pago");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMethods();
  }, []);

  const openCreate = () => {
    const firstAvailable = PAYMENT_METHOD_TYPES.find((type) => !configuredTypes.has(type));
    if (!firstAvailable) {
      setError("Ya configuraste los cuatro métodos disponibles.");
      return;
    }
    setEditing(null);
    setForm({ ...EMPTY_FORM, method_type: firstAvailable });
    setIsFormOpen(true);
    setError(null);
  };

  const openEdit = (method: PaymentMethod) => {
    setEditing(method);
    setForm(methodToForm(method));
    setIsFormOpen(true);
    setError(null);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError(null);
      const payload: Partial<PaymentMethod> = {
        is_active: form.is_active,
      };
      for (const field of visibleFields) {
        payload[field] = form[field];
      }
      await budyApi.upsertPaymentMethod(form.method_type, payload);
      await loadMethods();
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el método de pago");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (methodType: string) => {
    if (!window.confirm(`¿Eliminar el método "${PAYMENT_METHOD_LABELS[methodType as PaymentMethodType] ?? methodType}"?`)) {
      return;
    }
    try {
      setDeletingType(methodType);
      setError(null);
      await budyApi.deletePaymentMethod(methodType);
      await loadMethods();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el método de pago");
    } finally {
      setDeletingType(null);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Cargando configuración de pagos..." fullScreen />;
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Métodos de pago"
        description="Configura los datos de cobro que verá el cliente en la propuesta pública."
        icon={HandCoins}
      />

      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {methods.length === 0
            ? "Aún no tienes métodos de pago configurados."
            : `${methods.length} de ${PAYMENT_METHOD_TYPES.length} métodos configurados.`}
        </p>
        <Button onClick={openCreate} disabled={methods.length >= PAYMENT_METHOD_TYPES.length}>
          <Plus className="mr-2 h-4 w-4" />
          Agregar método de pago
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {methods.map((method) => (
          <Card key={method.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-base">
                  {PAYMENT_METHOD_LABELS[method.method_type as PaymentMethodType] ?? method.method_type}
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">{summarizeMethod(method)}</p>
              </div>
              <Badge variant={method.is_active ? "default" : "secondary"}>
                {method.is_active ? "Activo" : "Inactivo"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2 pt-2 text-sm">
              {PAYMENT_METHOD_FIELDS[method.method_type as PaymentMethodType]?.map((field) => {
                const value = method[field];
                if (!value) return null;
                return (
                  <div key={field}>
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {PAYMENT_METHOD_FIELD_LABELS[field]}
                    </div>
                    <div className="text-sm text-foreground">{value}</div>
                  </div>
                );
              })}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(method)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(method.method_type)}
                  disabled={deletingType === method.method_type}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  {deletingType === method.method_type ? "Eliminando..." : "Eliminar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Editar método de pago" : "Nuevo método de pago"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label>Tipo de pago</Label>
                <Select
                  value={form.method_type}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, method_type: value as PaymentMethodType }))
                  }
                  disabled={Boolean(editing)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {PAYMENT_METHOD_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {visibleFields.map((field) =>
                field === "instructions" ? (
                  <div key={field} className="space-y-2">
                    <Label>{PAYMENT_METHOD_FIELD_LABELS[field]}</Label>
                    <Textarea
                      value={form[field]}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, [field]: event.target.value }))
                      }
                    />
                  </div>
                ) : (
                  <div key={field} className="space-y-2">
                    <Label>{PAYMENT_METHOD_FIELD_LABELS[field]}</Label>
                    <Input
                      type={field === "email" ? "email" : "text"}
                      value={form[field]}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, [field]: event.target.value }))
                      }
                    />
                  </div>
                )
              )}

              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label className="text-sm font-medium">Activo</Label>
                  <p className="text-xs text-muted-foreground">
                    Si lo desactivas, el cliente no verá este método en la propuesta.
                  </p>
                </div>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm((current) => ({ ...current, is_active: checked }))}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeForm}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
