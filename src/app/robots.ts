import type { MetadataRoute } from "next";

// Keep private and one-time pages out of search results. The if-found pages also send their own noindex headers.
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/f/", "/api/", "/ask", "/find", "/saved", "/settings"] }] };
}
