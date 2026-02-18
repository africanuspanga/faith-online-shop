import type { Metadata } from "next";
import { Suspense } from "react";
import "@/app/globals.css";
import { AnnouncementBar } from "@/components/announcement-bar";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { ScrollBehaviors } from "@/components/scroll-behaviors";
import { Providers } from "@/components/providers";
import { phoneNumber, shopLocation, whatsappLink } from "@/lib/constants";

const siteUrl = "https://www.faithshop.co.tz";
const siteName = "Faith Online Shop";
const defaultTitle = "Faith Online Shop | COD, Pesapal & Bank Deposit";
const defaultDescription =
  "Nunua electronics, fashion, beauty, home goods na accessories kwa usafiri wa uhakika Tanzania nzima. Chagua COD, Pesapal, au Bank Deposit.";
const defaultOgImage = `${siteUrl}/logo-main.png`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  referrer: "origin-when-cross-origin",
  creator: siteName,
  publisher: siteName,
  category: "Ecommerce",
  keywords: [
    "Faith Online Shop",
    "Tanzania online shop",
    "Dar es Salaam ecommerce",
    "electronics Tanzania",
    "fashion Tanzania",
    "COD Tanzania",
    "Pesapal Tanzania",
    "Bank Deposit Tanzania"
  ],
  authors: [{ name: siteName, url: siteUrl }],
  title: {
    default: defaultTitle,
    template: "%s | Faith Online Shop"
  },
  description: defaultDescription,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  openGraph: {
    title: defaultTitle,
    description: defaultDescription,
    siteName,
    type: "website",
    locale: "sw_TZ",
    countryName: "Tanzania",
    url: siteUrl,
    images: [
      {
        url: defaultOgImage,
        width: 1200,
        height: 630,
        alt: "Faith Online Shop Tanzania"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: [defaultOgImage]
  },
  icons: {
    icon: "/favicon-faith-logo.png",
    shortcut: "/favicon-faith-logo.png",
    apple: "/favicon-faith-logo.png"
  },
  manifest: "/manifest.webmanifest"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    logo: `${siteUrl}/favicon-faith-logo.png`,
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: phoneNumber,
        contactType: "customer service",
        areaServed: "TZ",
        availableLanguage: ["sw", "en"]
      }
    ],
    sameAs: [whatsappLink],
    address: {
      "@type": "PostalAddress",
      streetAddress: shopLocation,
      addressLocality: "Dar es Salaam",
      addressCountry: "TZ"
    }
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/shop?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang="sw-TZ">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
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
