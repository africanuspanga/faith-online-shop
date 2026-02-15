import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  className?: string;
}

export const StarRating = ({ rating, className }: StarRatingProps) => {
  return (
    <div className={cn("flex items-center gap-1", className)} aria-label={`Rating ${rating.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((value) => {
        const filled = value <= Math.round(rating);
        return (
          <Star
            key={value}
            className={cn("h-4 w-4", filled ? "fill-[var(--secondary)] text-[var(--secondary)]" : "text-[var(--border)]")}
          />
        );
      })}
    </div>
  );
};
