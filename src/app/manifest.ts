import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "C.R.I.B.S. — Child Raising Information Basis System",
    short_name: "C.R.I.B.S.",
    description: "A centralized guide for parents of children with Autism Spectrum Disorder.",
    start_url: "/home",
    display: "standalone",
    background_color: "#FFF8F1",
    theme_color: "#8E7BD1",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
