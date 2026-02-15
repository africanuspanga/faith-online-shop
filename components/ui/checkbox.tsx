import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  id: string;
  className?: string;
}

export const Checkbox = ({ checked, onChange, label, id, className }: CheckboxProps) => {
  return (
    <label htmlFor={id} className={cn("inline-flex cursor-pointer items-center gap-3 text-sm", className)}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 rounded border-[var(--border)] accent-[var(--primary)]"
      />
      <span>{label}</span>
    </label>
  );
};
