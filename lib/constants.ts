import { Truck, Shield, Phone, Clock } from "lucide-react";

export const phoneNumber = "+255653670590";
export const whatsappLink = "https://wa.me/255653670590";

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
    title: "Usafiri BURE Tanzania Nzima",
    subtitle: "Kutoka Dar es Salaam hadi mikoani, tunafikisha haraka",
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
  { label: "Usafirishaji Bure", icon: Truck },
  { label: "Lipa Unapopokea", icon: Shield },
  { label: "Huduma Masaa 24/7", icon: Clock },
  { label: "Wasiliana Sasa", icon: Phone }
] as const;
