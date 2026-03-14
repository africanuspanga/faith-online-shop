import { bankDetails, mpesaDetails } from "@/lib/constants";

interface ManualPaymentDetailsProps {
  title?: string;
  className?: string;
  note?: string;
}

export const ManualPaymentDetails = ({
  title = "Manual Payment Details",
  className = "",
  note = "Ukishalipa, tuma uthibitisho wa malipo ili order iwekwe pending verification haraka."
}: ManualPaymentDetailsProps) => {
  return (
    <div className={`rounded-lg border border-[var(--border)] bg-white p-3 text-xs text-[var(--foreground)] ${className}`.trim()}>
      <p className="font-black text-[var(--primary)]">{title}</p>
      <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-950">
        <p className="font-bold uppercase tracking-wide">{mpesaDetails.provider}</p>
        <p className="mt-1"><span className="font-semibold">Number:</span> {mpesaDetails.phone}</p>
        <p><span className="font-semibold">Name:</span> {mpesaDetails.accountName}</p>
      </div>
      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-950">
        <p className="font-bold uppercase tracking-wide">Bank Deposit</p>
        <p className="mt-1"><span className="font-semibold">Bank:</span> {bankDetails.bankName}</p>
        <p><span className="font-semibold">Account Name:</span> {bankDetails.accountName}</p>
        <p><span className="font-semibold">A/C Number:</span> {bankDetails.accountNumber}</p>
      </div>
      <p className="mt-2 text-[var(--muted)]">{note}</p>
    </div>
  );
};
