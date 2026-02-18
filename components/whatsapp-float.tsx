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
      className="fixed bottom-20 right-4 z-40 inline-flex h-16 w-16 items-center justify-center rounded-full bg-transparent transition-transform hover:scale-105 md:bottom-6 md:right-6"
    >
      <Image src="/whatsapp.png" alt="WhatsApp" width={46} height={46} className="h-11 w-11 object-contain drop-shadow-[0_10px_16px_rgba(0,0,0,0.28)]" />
    </Link>
  );
};
