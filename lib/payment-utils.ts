import type { OrderPaymentMethod, PaymentMethod } from "@/lib/types";

export const manualTransferLabel = "M-Pesa / Bank Transfer";

export const getPaymentMethodLabel = (method: PaymentMethod | OrderPaymentMethod) => {
  if (method === "bank-deposit") return manualTransferLabel;
  if (method === "pesapal") return "Pesapal";
  if (method === "manual") return "Manual";
  return "Cash on Delivery";
};
