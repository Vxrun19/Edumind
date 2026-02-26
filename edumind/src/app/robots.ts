import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/courses", "/trending"],
        disallow: [
          "/dashboard",
          "/chat",
          "/history",
          "/progress",
          "/profile",
          "/assessment",
          "/onboarding",
          "/checkout",
          "/api/",
        ],
      },
    ],
    sitemap: "https://edumind-omega.vercel.app/sitemap.xml",
  };
}
