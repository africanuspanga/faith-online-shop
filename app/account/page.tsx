import type { Metadata } from "next";
import { AccountOrders } from "@/components/account-orders";

export const metadata: Metadata = {
  title: "Account & Order Tracking",
  description: "Check your order history, delivery status, and any remaining installment balance.",
  robots: {
    index: false,
    follow: false
  }
};

export default function Page() {
  return <AccountOrders />;
}
