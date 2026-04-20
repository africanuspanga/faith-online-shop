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
      toast.error("Order ID was not found.");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please write your review first.");
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
        throw new Error(payload.error ?? "Unable to submit your review.");
      }

      setSubmitted(true);
      toast.success("Thank you. Your review has been received.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit your review.");
    } finally {
      setLoading(false);
    }
  };

  if (!orderId) {
    return (
      <p className="text-xs text-[var(--muted)]">
        No order ID was found. Open this page from the post-checkout link so you can leave a review.
      </p>
    );
  }

  if (submitted) {
    return <p className="text-sm font-semibold text-green-700">Your review has been sent. Thank you for choosing Faith Online Shop.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-2">
        <label htmlFor="review-name" className="text-sm font-semibold">
          Name (optional)
        </label>
        <Input
          id="review-name"
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          placeholder="Example: Amina"
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
          Review
        </label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={4}
          placeholder="Share your thoughts about the product and service..."
          required
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
        Submit Review
      </Button>
      <p className="text-xs text-[var(--muted)]">Your review is approved after the admin marks your order as delivered.</p>
    </form>
  );
};
