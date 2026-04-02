import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ProAssistNG",
    short_name: "ProAssistNG",
    description:
      "ProAssistNG connects clients with vetted Nigerian freelancers across design, development, marketing, writing, and virtual assistance.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
