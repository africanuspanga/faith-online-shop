import { phoneNumber as defaultAdminPhone } from "@/lib/constants";
import { formatTZS } from "@/lib/format";
import type { OrderRecord } from "@/lib/types";

const defaultSmsBaseUrl = "https://messaging-service.co.tz";
const defaultSendPath = "/api/sms/v1/text/single";
const defaultTestSendPath = "/api/sms/v1/test/text/single";

const smsBaseUrl = (process.env.SMS_API_BASE_URL ?? defaultSmsBaseUrl).trim().replace(/\/+$/, "");
const smsSendPath = (process.env.SMS_API_SEND_PATH ?? defaultSendPath).trim();
const smsTestSendPath = (process.env.SMS_API_TEST_SEND_PATH ?? defaultTestSendPath).trim();
const smsUsername = (process.env.SMS_API_USERNAME ?? "").trim();
const smsPassword = (process.env.SMS_API_PASSWORD ?? "").trim();
const smsBasicAuthRaw = (process.env.SMS_API_BASIC_AUTH ?? "").trim();
const smsSenderId = (process.env.SMS_API_SENDER_ID ?? "").trim();
const smsAdminPhone = (process.env.ORDER_ALERT_SMS_TO ?? defaultAdminPhone).trim();
const smsTimeoutMs = Math.max(1000, Number(process.env.SMS_API_TIMEOUT_MS ?? 10000));
const smsTestMode = (process.env.SMS_API_TEST_MODE ?? "false").trim().toLowerCase() === "true";

const toAuthHeader = () => {
  if (smsBasicAuthRaw) {
    return smsBasicAuthRaw.startsWith("Basic ") ? smsBasicAuthRaw : `Basic ${smsBasicAuthRaw}`;
  }

  if (!smsUsername || !smsPassword) {
    return "";
  }

  const encoded = Buffer.from(`${smsUsername}:${smsPassword}`).toString("base64");
  return `Basic ${encoded}`;
};

const normalizePath = (value: string) => (value.startsWith("/") ? value : `/${value}`);

const paymentMethodLabel = (method: OrderRecord["paymentMethod"]) => {
  if (method === "bank-deposit") return "Bank Deposit";
  if (method === "pesapal") return "Pesapal";
  return "Cash on Delivery";
};

const buildOrderSmsMessage = (order: OrderRecord) => {
  const itemCount = order.orderItems.length;
  const itemLabel = itemCount === 1 ? "item" : "items";

  return [
    "New order placed",
    `ID: ${order.id}`,
    `Customer: ${order.fullName} (${order.phone})`,
    `Total: ${formatTZS(order.total)}`,
    `Payment: ${paymentMethodLabel(order.paymentMethod)} (${order.paymentStatus})`,
    `Location: ${order.regionCity}`,
    `Items: ${itemCount} ${itemLabel}`
  ].join("\n");
};

export const isSmsNotificationConfigured = () => Boolean(toAuthHeader() && smsAdminPhone);

export const getSmsNotificationMissingConfig = () => {
  const missing: string[] = [];

  if (!smsAdminPhone) {
    missing.push("ORDER_ALERT_SMS_TO");
  }

  if (!smsBasicAuthRaw && (!smsUsername || !smsPassword)) {
    missing.push("SMS_API_USERNAME/SMS_API_PASSWORD or SMS_API_BASIC_AUTH");
  }

  return missing;
};

export const sendOrderPlacedSmsNotification = async (order: OrderRecord) => {
  if (!isSmsNotificationConfigured()) {
    throw new Error(`SMS notification not configured. Missing: ${getSmsNotificationMissingConfig().join(", ")}`);
  }

  const endpointPath = smsTestMode ? smsTestSendPath : smsSendPath;
  const endpoint = `${smsBaseUrl}${normalizePath(endpointPath)}`;

  const payload: Record<string, unknown> = {
    to: smsAdminPhone,
    text: buildOrderSmsMessage(order)
  };

  if (smsSenderId) {
    payload.from = smsSenderId;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, smsTimeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: toAuthHeader(),
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal
    });

    const raw = await response.text();
    let parsed: Record<string, unknown> | null = null;
    if (raw) {
      try {
        parsed = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        parsed = null;
      }
    }

    if (!response.ok) {
      const errorMessage =
        (parsed && typeof parsed.message === "string" && parsed.message) ||
        (parsed && typeof parsed.error === "string" && parsed.error) ||
        raw ||
        "SMS notification request failed.";
      throw new Error(errorMessage);
    }

    return parsed ?? { raw };
  } finally {
    clearTimeout(timeout);
  }
};
