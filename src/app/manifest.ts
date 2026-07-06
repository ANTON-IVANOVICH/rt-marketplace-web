import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Marketplace",
    short_name: "Marketplace",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#18181b",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
  };
}
