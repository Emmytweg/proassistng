import type { MetadataRoute } from "next";

import { serviceCategories } from "@/lib/services";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.proassistng.com.ng";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes = [
    "",
    "/browse-talents",
    "/services",
    "/how-it-works",
    "/contact",
  ];

  const serviceCategoryRoutes = serviceCategories.map(
    (c) => `/services/${encodeURIComponent(c.slug)}`,
  );

  const allRoutes = [...routes, ...serviceCategoryRoutes];

  return allRoutes.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
