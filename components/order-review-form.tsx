"use client";

import { useState } from "react";
import { LoaderCircle, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type OrderReviewFormProps = {
  orderId?: string;
};

export const OrderReviewForm = ({ orderId }: OrderReviewFormProps) => {
  const [customerName, setCustomerName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!orderId) {
      toast.error("Order ID haijapatikana.");
      return;
    }
    if (!comment.trim()) {
      toast.error("Andika maoni yako kwanza.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          orderId,
          rating,
          comment,
          customerName
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Imeshindikana kutuma review.");
      }

      setSubmitted(true);
      toast.success("Asante, review yako imepokelewa.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Imeshindikana kutuma review.");
    } finally {
      setLoading(false);
    }
  };

  if (!orderId) {
    return (
      <p className="text-xs text-[var(--muted)]">
        Hakuna Order ID. Fungua ukurasa huu kupitia link ya baada ya checkout ili uweze kutoa review.
      </p>
    );
  }

  if (submitted) {
    return <p className="text-sm font-semibold text-green-700">Review yako imetumwa. Asante kwa kuamini Faith Online Shop.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-2">
        <label htmlFor="review-name" className="text-sm font-semibold">
          Jina (hiari)
        </label>
        <Input
          id="review-name"
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          placeholder="Mfano: Amina"
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">Rating</p>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${
                value <= rating ? "border-[var(--secondary)] bg-[var(--secondary)]/30" : "border-[var(--border)] bg-white"
              }`}
              aria-label={`Rate ${value}`}
            >
              <Star className={`h-4 w-4 ${value <= rating ? "fill-[var(--secondary)] text-[var(--secondary)]" : "text-[var(--muted)]"}`} />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="review-comment" className="text-sm font-semibold">
          Maoni
        </label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={4}
          placeholder="Toa maoni yako kuhusu bidhaa na huduma..."
          required
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
        Tuma Review
      </Button>
      <p className="text-xs text-[var(--muted)]">Review itakubaliwa baada ya admin kuweka oda yako kuwa delivered.</p>
    </form>
  );
};
