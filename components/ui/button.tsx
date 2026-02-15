import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-h-11",
  {
    variants: {
      variant: {
        default: "bg-[var(--primary)] text-white hover:bg-[#d95102]",
        outline:
          "border border-[var(--primary)] text-[var(--primary)] bg-white hover:bg-[var(--primary)] hover:text-white",
        ghost: "text-[var(--foreground)] hover:bg-gray-100",
        secondary: "bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[#d8a500]"
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-10 rounded-lg px-3",
        lg: "h-12 rounded-xl px-6 text-base",
        icon: "h-11 w-11"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
