import type { MetadataRoute } from "next";
import { clientConfig } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = clientConfig.NEXT_PUBLIC_APP_URL;
  if (process.env.NODE_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } }; // не индексировать staging
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/sell", "/manage", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
