"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const ContactForm = () => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    message: ""
  });

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLoading(false);
    setForm({ name: "", phone: "", message: "" });
    toast.success("Your message has been sent. We will get back to you shortly.");
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-[var(--border)] bg-white p-5">
      <div>
        <h2 className="text-xl font-black">Send a Message</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Share your details and we will reply as quickly as we can.</p>
      </div>
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-semibold">
          Name
        </label>
        <Input
          id="name"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="phone" className="text-sm font-semibold">
          Phone
        </label>
        <Input
          id="phone"
          placeholder="+2557XXXXXXXX"
          value={form.phone}
          onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-semibold">
          Message
        </label>
        <Textarea
          id="message"
          rows={4}
          placeholder="Write your message here..."
          value={form.message}
          onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
        Send Message
      </Button>
    </form>
  );
};
