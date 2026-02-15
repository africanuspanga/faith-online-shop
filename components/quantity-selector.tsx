"use client";

import { Minus, Plus } from "lucide-react";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
}

export const QuantitySelector = ({ value, onChange }: QuantitySelectorProps) => {
  return (
    <div className="inline-flex items-center rounded-xl border border-[var(--border)] bg-white">
      <button
        type="button"
        className="inline-flex h-11 w-11 items-center justify-center"
        aria-label="Punguza idadi"
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-10 text-center text-sm font-semibold">{value}</span>
      <button
        type="button"
        className="inline-flex h-11 w-11 items-center justify-center"
        aria-label="Ongeza idadi"
        onClick={() => onChange(value + 1)}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
};
