import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "@/app/globals.css";
import { AnnouncementBar } from "@/components/announcement-bar";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { ScrollBehaviors } from "@/components/scroll-behaviors";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.faithshop.co.tz"),
  title: {
    default: "Faith Online Shop | COD, Pesapal & Bank Deposit",
    template: "%s | Faith Online Shop"
  },
  description:
    "Nunua electronics, fashion, beauty, home goods na accessories kwa usafiri wa uhakika Tanzania nzima. Chagua COD, Pesapal, au Bank Deposit.",
  openGraph: {
    title: "Faith Online Shop",
    description: "Stock ipo tayari. Usafiri Tanzania nzima. COD • Pesapal • Bank Deposit.",
    type: "website",
    url: "https://www.faithshop.co.tz"
  },
  icons: {
    icon: "/favicon-faith-logo.png",
    shortcut: "/favicon-faith-logo.png",
    apple: "/favicon-faith-logo.png"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sw">
      <body className={inter.className}>
        <Providers>
          <AnnouncementBar />
          <Suspense fallback={null}>
            <SiteHeader />
          </Suspense>
          <main className="mx-auto w-full max-w-7xl px-4 py-5">{children}</main>
          <SiteFooter />
          <WhatsAppFloat />
          <ScrollBehaviors />
          <MobileBottomNav />
        </Providers>
      </body>
    </html>
  );
}
