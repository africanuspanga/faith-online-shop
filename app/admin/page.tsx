import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard | Faith Online Shop",
  description: "Manage products, orders, approvals, and updates for Faith Online Shop.",
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminPage() {
  return (
    <section className="space-y-3">
      <h1 className="text-3xl font-black sm:text-4xl">Admin Dashboard</h1>
      <p className="text-sm text-[var(--muted)]">
        Manage orders, print invoices, track visitor analytics, and upload/add products with SKU, brand, category, size, and color.
      </p>
      <AdminDashboard />
    </section>
  );
}
