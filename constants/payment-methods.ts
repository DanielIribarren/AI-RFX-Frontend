export const PAYMENT_METHOD_TYPES = ["cash", "pago_movil", "bank_transfer", "zelle"] as const;

export type PaymentMethodType = (typeof PAYMENT_METHOD_TYPES)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  cash: "Efectivo",
  pago_movil: "Pago Móvil",
  bank_transfer: "Transferencia",
  zelle: "Zelle",
};

export type PaymentMethodFieldKey =
  | "account_holder"
  | "bank_name"
  | "phone"
  | "national_id"
  | "email"
  | "account_number"
  | "instructions";

export const PAYMENT_METHOD_FIELD_LABELS: Record<PaymentMethodFieldKey, string> = {
  account_holder: "Titular de la cuenta",
  bank_name: "Banco o plataforma",
  phone: "Teléfono",
  national_id: "Cédula o RIF",
  email: "Correo electrónico",
  account_number: "Número de cuenta",
  instructions: "Instrucciones para el cliente",
};

export const PAYMENT_METHOD_FIELDS: Record<PaymentMethodType, PaymentMethodFieldKey[]> = {
  cash: ["instructions"],
  pago_movil: ["account_holder", "bank_name", "phone", "national_id", "instructions"],
  bank_transfer: ["account_holder", "bank_name", "national_id", "account_number", "instructions"],
  zelle: ["account_holder", "email", "instructions"],
};

export function getPaymentMethodLabel(type: string | null | undefined): string {
  if (!type) return "—";
  return PAYMENT_METHOD_LABELS[type as PaymentMethodType] ?? type;
}
