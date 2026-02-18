import type { Metadata } from "next";
import { AccountOrders } from "@/components/account-orders";

export const metadata: Metadata = {
  title: "Account & Order Tracking",
  description: "Angalia historia ya oda zako, status ya delivery, na malipo ya installment yaliyobaki.",
  robots: {
    index: false,
    follow: false
  }
};

export default function Page() {
  return <AccountOrders />;
}
