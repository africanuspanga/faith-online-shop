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

export const heroSlides = [
  {
    id: 1,
    title: "Agiza Sasa, Lipa Ukipokea",
    subtitle: "Punguzo la 30% kwa bidhaa zote muhimu",
    cta: "Angalia Ofa",
    image: "/slide-01.jpg"
  },
  {
    id: 2,
    title: "Usafiri wa Haraka Tanzania Nzima",
    subtitle: "Kutoka Dar es Salaam hadi mikoani, tunafikisha kwa uhakika na gharama nafuu",
    cta: "Anza Kuagiza",
    image: "/slide-02.jpg"
  },
  {
    id: 3,
    title: "Bidhaa Halisi kwa Maisha ya Kila Siku",
    subtitle: "Electronics, Fashion, Beauty na Home kwa bei rafiki",
    cta: "Shop Sasa",
    image: "/slide-03.jpg"
  }
] as const;

export const trustItems = [
  { label: "Usafiri wa Uhakika", icon: Truck },
  { label: "Malipo Njia 3", icon: Shield },
  { label: `Huduma ${serviceHours}`, icon: Clock },
  { label: "Wasiliana Sasa", icon: Phone }
] as const;
