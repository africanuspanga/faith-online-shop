import { computeAmountPaidFromPayments, computeBalanceDue, derivePaymentStatus, roundMoney } from "@/lib/order-finance";
import { memoryOrderPayments, memoryOrders } from "@/lib/memory-store";
import { isMissingColumnError } from "@/lib/db-errors";
import { getSupabaseServerClient } from "@/lib/supabase";
import type { PaymentMethod, PaymentStatus } from "@/lib/types";

const isMissingRelationError = (message: string) =>
  /relation .* does not exist/i.test(message) || /could not find .* relation/i.test(message);

const toPaymentMethod = (value: unknown): PaymentMethod => {
  const normalized = String(value ?? "").trim();
  if (normalized === "pesapal" || normalized === "bank-deposit" || normalized === "cash-on-delivery") {
    return normalized;
  }
  return "cash-on-delivery";
};

const toPaymentStatus = (value: unknown): PaymentStatus | null => {
  const normalized = String(value ?? "").trim();
  if (
    normalized === "unpaid" ||
    normalized === "pending" ||
    normalized === "partial" ||
    normalized === "paid" ||
    normalized === "failed" ||
    normalized === "pending-verification"
  ) {
    return normalized;
  }
  return null;
};

export const refreshOrderPaymentSummary = async (orderId: string) => {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    const order = memoryOrders.find((item) => item.id === orderId);
    if (!order) return null;

    const payments = memoryOrderPayments.filter((payment) => payment.orderId === orderId);
    const amountPaid = computeAmountPaidFromPayments(payments);
    const paymentStatus = derivePaymentStatus({
      paymentMethod: order.paymentMethod,
      total: order.total,
      amountPaid,
      paymentStatuses: payments.map((payment) => payment.status)
    });

    order.amountPaid = amountPaid;
    order.paymentStatus = paymentStatus;
    order.balanceDue = computeBalanceDue(order.total, amountPaid);
    order.payments = payments;
    order.lastPaymentAt =
      payments
        .filter((payment) => payment.status === "paid")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
        ?.createdAt ?? "";

    return {
      orderId: order.id,
      amountPaid,
      total: order.total,
      balanceDue: order.balanceDue,
      paymentStatus
    };
  }

  const orderQuery = await supabase
    .from("orders")
    .select("id, payment_method, payment_status, total")
    .eq("id", orderId)
    .single();

  if (orderQuery.error || !orderQuery.data) {
    return null;
  }

  const paymentMethod = toPaymentMethod(orderQuery.data.payment_method);
  const total = roundMoney(Number(orderQuery.data.total ?? 0));

  const paymentsQuery = await supabase
    .from("order_payments")
    .select("amount, status, created_at")
    .eq("order_id", orderId);

  if (paymentsQuery.error) {
    if (!isMissingRelationError(paymentsQuery.error.message) && !isMissingColumnError(paymentsQuery.error.message)) {
      return null;
    }

    const fallbackStatus = toPaymentStatus(orderQuery.data.payment_status) ?? "unpaid";
    const amountPaid = fallbackStatus === "paid" ? total : 0;
    const balanceDue = computeBalanceDue(total, amountPaid);
    return {
      orderId,
      amountPaid,
      total,
      balanceDue,
      paymentStatus: fallbackStatus
    };
  }

  const paymentRows = (paymentsQuery.data ?? []) as Array<{ amount?: number; status?: string; created_at?: string }>;
  const amountPaid = computeAmountPaidFromPayments(
    paymentRows.map((payment) => ({
      amount: Number(payment.amount ?? 0),
      status: toPaymentStatus(payment.status) ?? "pending"
    }))
  );

  const paymentStatus = derivePaymentStatus({
    paymentMethod,
    total,
    amountPaid,
    paymentStatuses: paymentRows
      .map((payment) => toPaymentStatus(payment.status))
      .filter((status): status is PaymentStatus => Boolean(status))
  });

  const lastPaidAt =
    paymentRows
      .filter((payment) => toPaymentStatus(payment.status) === "paid")
      .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")))[0]
      ?.created_at ?? null;

  const updateResult = await supabase
    .from("orders")
    .update({
      amount_paid: amountPaid,
      payment_status: paymentStatus,
      last_payment_at: lastPaidAt
    })
    .eq("id", orderId);

  if (updateResult.error && !isMissingColumnError(updateResult.error.message)) {
    return null;
  }

  return {
    orderId,
    amountPaid,
    total,
    balanceDue: computeBalanceDue(total, amountPaid),
    paymentStatus
  };
};
