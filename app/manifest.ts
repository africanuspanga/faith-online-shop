import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Faith Online Shop",
    short_name: "Faith Shop",
    description:
      "Nunua electronics, fashion, beauty, home goods na accessories kwa usafiri wa uhakika Tanzania nzima.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#f45e02",
    lang: "sw-TZ",
    icons: [
      {
        src: "/favicon-faith-logo.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/favicon-faith-logo.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}

