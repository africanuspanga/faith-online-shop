import type { Category } from "@/lib/types";

export const categories: Category[] = [
  {
    slug: "electronic",
    label: "Electronic",
    description: "Vifaa vya kisasa vya kidijitali kwa matumizi ya kila siku.",
    image: "/116plus-smart-watch.webp"
  },
  {
    slug: "fashion",
    label: "Fashion",
    description: "Mavazi ya kisasa kwa muonekano wa kujiamini.",
    image: "/black-hoodie-streetwear.webp"
  },
  {
    slug: "fashion-accessories",
    label: "Fashion & Accessories",
    description: "Saa, miwani, na mifuko inayokamilisha mtindo wako.",
    image: "/womens-crossbody-bag.webp"
  },
  {
    slug: "hardware-automobile",
    label: "Hardware & Automobile",
    description: "Vifaa vya gari na vifaa muhimu vya matumizi ya nje.",
    image: "/12v-car-kettle.webp"
  },
  {
    slug: "health-beauty",
    label: "Health & Beauty",
    description: "Bidhaa za urembo na afya kwa mwonekano bora kila siku.",
    image: "/vitamin-c-serum.webp"
  },
  {
    slug: "home-living",
    label: "Home & Living",
    description: "Bidhaa za nyumbani zinazoongeza urahisi na mwonekano mzuri.",
    image: "/led-desk-lamp.jpg"
  }
];

export const categoryMap = new Map(categories.map((category) => [category.slug, category]));
