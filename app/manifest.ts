import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Faith Online Shop",
    short_name: "Faith Shop",
    description:
      "Shop electronics, fashion, beauty, home goods, and accessories with reliable delivery across Tanzania.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#f45e02",
    lang: "en",
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
