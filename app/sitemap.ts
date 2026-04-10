import type { MetadataRoute } from "next";

import { getLandingPageConfigs } from "@/lib/seo-landing-pages";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL ?? "https://rezoomind.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // High-priority pages (homepage, main features)
  const highPriority: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/feed`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/insights`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
  ];

  // SEO landing pages (job category pages)
  const landingPages: MetadataRoute.Sitemap = getLandingPageConfigs().map((config) => ({
    url: `${baseUrl}/${config.slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  // Static informational pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  return [...highPriority, ...landingPages, ...staticPages];
}
