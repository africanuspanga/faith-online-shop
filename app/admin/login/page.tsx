import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata: Metadata = {
  title: "Admin Login | Faith Online Shop",
  description: "Secure admin login for Faith Online Shop dashboard.",
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminLoginPage() {
  return (
    <section className="mx-auto max-w-md py-8">
      <AdminLoginForm />
    </section>
  );
}
