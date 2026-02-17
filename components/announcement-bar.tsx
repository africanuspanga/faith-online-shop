import { phoneNumber } from "@/lib/constants";

export const AnnouncementBar = () => {
  return (
    <div className="sticky top-0 z-50 w-full border-b border-black/10 bg-[var(--secondary)] px-2 py-2 text-center text-[11px] font-semibold tracking-[0.01em] text-[var(--foreground)] sm:px-3 sm:text-[13px]">
      <p className="mx-auto max-w-7xl truncate whitespace-nowrap">
        Stock Ipo | Usafiri Tanzania Nzima | COD • Pesapal • Bank Deposit {phoneNumber}
      </p>
    </div>
  );
};
