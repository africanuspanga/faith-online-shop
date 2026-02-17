import type { PaymentStatus } from "@/lib/types";

const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
const notificationId = process.env.PESAPAL_NOTIFICATION_ID;
const pesapalEnvironment = (process.env.PESAPAL_ENVIRONMENT ?? "live").toLowerCase();

const baseUrl =
  pesapalEnvironment === "sandbox"
    ? "https://cybqa.pesapal.com/pesapalv3"
    : "https://pay.pesapal.com/v3";

type PesapalTokenResponse = {
  token?: string;
  status?: string;
  error?: {
    code?: string;
    type?: string;
    message?: string;
  };
};

type PesapalSubmitResponse = {
  order_tracking_id?: string;
  merchant_reference?: string;
  redirect_url?: string;
  status?: string;
  error?: {
    type?: string;
    code?: string;
    message?: string;
  };
};

type PesapalStatusResponse = {
  status?: string;
  payment_status_description?: string;
  payment_method?: string;
  amount?: number;
  currency?: string;
  error?: {
    type?: string;
    code?: string;
    message?: string;
  };
};

export const isPesapalConfigured = Boolean(consumerKey && consumerSecret && notificationId);

export const getPesapalMissingConfig = () => {
  const missing: string[] = [];
  if (!consumerKey) missing.push("PESAPAL_CONSUMER_KEY");
  if (!consumerSecret) missing.push("PESAPAL_CONSUMER_SECRET");
  if (!notificationId) missing.push("PESAPAL_NOTIFICATION_ID");
  return missing;
};

const getPesapalToken = async () => {
  const response = await fetch(`${baseUrl}/api/Auth/RequestToken`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      consumer_key: consumerKey,
      consumer_secret: consumerSecret
    }),
    cache: "no-store"
  });

  const payload = (await response.json().catch(() => ({}))) as PesapalTokenResponse;
  if (!response.ok || !payload.token) {
    const errorMessage = payload.error?.message || payload.status || "Unable to authenticate with Pesapal";
    throw new Error(errorMessage);
  }

  return payload.token;
};

type CreatePesapalOrderInput = {
  orderId: string;
  amount: number;
  description: string;
  callbackUrl: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
};

type CreatePesapalOrderResult = {
  redirectUrl: string;
  trackingId: string;
  merchantReference: string;
  paymentStatus: PaymentStatus;
};

export const createPesapalOrder = async (input: CreatePesapalOrderInput): Promise<CreatePesapalOrderResult> => {
  if (!isPesapalConfigured) {
    throw new Error(`Pesapal is not configured. Missing: ${getPesapalMissingConfig().join(", ")}`);
  }

  const token = await getPesapalToken();

  const response = await fetch(`${baseUrl}/api/Transactions/SubmitOrderRequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      id: input.orderId,
      currency: "TZS",
      amount: Number(input.amount.toFixed(2)),
      description: input.description,
      callback_url: input.callbackUrl,
      notification_id: notificationId,
      billing_address: {
        phone_number: input.customerPhone,
        email_address: input.customerEmail || "customer@faithshop.co.tz",
        first_name: input.customerName
      }
    }),
    cache: "no-store"
  });

  const payload = (await response.json().catch(() => ({}))) as PesapalSubmitResponse;
  if (!response.ok || !payload.redirect_url || !payload.order_tracking_id) {
    const errorMessage = payload.error?.message || payload.status || "Unable to submit payment request to Pesapal";
    throw new Error(errorMessage);
  }

  return {
    redirectUrl: payload.redirect_url,
    trackingId: payload.order_tracking_id,
    merchantReference: payload.merchant_reference || input.orderId,
    paymentStatus: "pending"
  };
};

type PesapalTransactionStatus = {
  status: string;
  isPaid: boolean;
  paymentMethod: string;
};

export const getPesapalTransactionStatus = async (trackingId: string): Promise<PesapalTransactionStatus> => {
  if (!isPesapalConfigured) {
    throw new Error(`Pesapal is not configured. Missing: ${getPesapalMissingConfig().join(", ")}`);
  }

  const normalizedTracking = trackingId.trim();
  if (!normalizedTracking) {
    throw new Error("Missing Pesapal tracking id");
  }

  const token = await getPesapalToken();
  const endpoint = `${baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(normalizedTracking)}`;
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json"
    },
    cache: "no-store"
  });

  const payload = (await response.json().catch(() => ({}))) as PesapalStatusResponse;
  if (!response.ok) {
    const message = payload.error?.message || payload.status || "Unable to fetch transaction status";
    throw new Error(message);
  }

  const normalizedStatus = String(payload.payment_status_description ?? payload.status ?? "pending").toLowerCase();
  const paidStatuses = new Set(["completed", "paid", "success", "successful"]);

  return {
    status: normalizedStatus,
    isPaid: paidStatuses.has(normalizedStatus),
    paymentMethod: String(payload.payment_method ?? "pesapal")
  };
};
