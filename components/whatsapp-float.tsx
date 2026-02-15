import Link from "next/link";
import Image from "next/image";
import { whatsappLink } from "@/lib/constants";

export const WhatsAppFloat = () => {
  return (
    <Link
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-20 right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg ring-2 ring-white/70 transition hover:brightness-95 md:bottom-6 md:right-6"
    >
      <Image src="/whatsapp.png" alt="WhatsApp" width={34} height={34} className="h-8 w-8 object-contain" />
    </Link>
  );
};
