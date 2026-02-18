import type { OrderPaymentRecord, PaymentMethod, PaymentStatus } from "@/lib/types";

export const roundMoney = (value: number) => Number((Number.isFinite(value) ? value : 0).toFixed(2));

export const normalizePhone = (phone: string) => phone.replace(/[^\d]/g, "");

export const computeOrderTotal = (subtotal: number, shippingFee: number, shippingAdjustment = 0) =>
  roundMoney(Math.max(0, subtotal + shippingFee + shippingAdjustment));

export const computeBalanceDue = (total: number, amountPaid: number) => roundMoney(Math.max(0, total - amountPaid));

export const computeAmountPaidFromPayments = (payments: Pick<OrderPaymentRecord, "amount" | "status">[]) =>
  roundMoney(
    payments.reduce((sum, payment) => {
      if (payment.status !== "paid") return sum;
      return sum + Number(payment.amount || 0);
    }, 0)
  );

export const derivePaymentStatus = ({
  paymentMethod,
  total,
  amountPaid,
  paymentStatuses
}: {
  paymentMethod: PaymentMethod;
  total: number;
  amountPaid: number;
  paymentStatuses?: PaymentStatus[];
}): PaymentStatus => {
  if (computeBalanceDue(total, amountPaid) <= 0 && total > 0) {
    return "paid";
  }

  if (amountPaid > 0) {
    return "partial";
  }

  const statuses = paymentStatuses ?? [];
  if (statuses.includes("pending-verification")) return "pending-verification";
  if (statuses.includes("pending")) return "pending";
  if (statuses.length > 0 && statuses.every((status) => status === "failed")) return "failed";

  if (paymentMethod === "cash-on-delivery") return "unpaid";
  if (paymentMethod === "bank-deposit") return "pending-verification";
  return "pending";
};
