import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SmartRent",
    short_name: "SmartRent",
    description: "Tenant management and rent billing.",
    start_url: "./login",
    scope: "./",
    display: "standalone",
    background_color: "#f6f8fb",
    theme_color: "#0f172a",
    orientation: "portrait-primary",
    icons: [
      { src: "./pwa-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "./pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "./pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
