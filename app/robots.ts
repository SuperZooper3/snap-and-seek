import type { MetadataRoute } from "next";

const baseUrl =
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_APP_URL ?? "https://snapandseek.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/games/", "/join/", "/debug/"] },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
