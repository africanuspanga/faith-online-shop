"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ADMIN_STORAGE_KEY, DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from "@/lib/admin-auth";

const expectedEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
const expectedPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

export const AdminLoginForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState(expectedEmail);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const current = window.localStorage.getItem(ADMIN_STORAGE_KEY);
    if (current === expectedPassword) {
      router.replace("/admin");
    }
  }, [router]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 250));

    if (email.trim().toLowerCase() !== expectedEmail.toLowerCase() || password !== expectedPassword) {
      toast.error("Incorrect admin credentials");
      setLoading(false);
      return;
    }

    window.localStorage.setItem(ADMIN_STORAGE_KEY, password);
    toast.success("Login successful");
    router.push("/admin");
    router.refresh();
    setLoading(false);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-5">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--foreground)]">
        <Lock className="h-5 w-5" />
      </div>
      <div>
        <h1 className="text-3xl font-black">Admin Login</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Enter admin credentials to manage orders and products.</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="admin-email" className="text-sm font-semibold">
          Email
        </label>
        <Input
          id="admin-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="admin-password" className="text-sm font-semibold">
          Password
        </label>
        <Input
          id="admin-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
        Login
      </Button>
    </form>
  );
};
