import { Truck, Shield, Phone, Clock } from "lucide-react";

export const phoneNumber = "+255653670590";
export const whatsappLink = "https://wa.me/255653670590";
export const serviceHours = "09:00 - 19:00";
export const shopLocation = "Mnazi Mmoja Opposite NBC Bank Dsm, Tanzania";
export const bankDetails = {
  bankName: "CRDB BANK",
  accountName: "FAITH ONLINE SHOP",
  accountNumber: "10215141271"
} as const;
export const mpesaDetails = {
  provider: "Vodacom M-Pesa",
  phone: "0769 979 767",
  accountName: "TUMAINIELY B. MOSHI"
} as const;

export const heroSlides = [
  {
    id: 1,
    title: "Order Today, Pay on Delivery",
    subtitle: "Save up to 30% on everyday customer favorites",
    cta: "Shop Best Sellers",
    image: "/slide-01.jpg"
  },
  {
    id: 2,
    title: "Fast Delivery Across Tanzania",
    subtitle: "From Dar es Salaam to upcountry destinations, your order gets to you quickly and reliably",
    cta: "Start Shopping",
    image: "/slide-02.jpg"
  },
  {
    id: 3,
    title: "Everyday Products Worth Coming Back For",
    subtitle: "Electronics, fashion, beauty, and home essentials at prices that make sense",
    cta: "Browse the Shop",
    image: "/slide-03.jpg"
  }
] as const;

export const trustItems = [
  { label: "Reliable Delivery", icon: Truck },
  { label: "3 Payment Options", icon: Shield },
  { label: `Support ${serviceHours}`, icon: Clock },
  { label: "Contact Us", icon: Phone }
] as const;
