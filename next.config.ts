import type { NextConfig } from "next";

/** Ensure rewrite destinations always have an absolute http(s) origin. */
function normalizeApiUrl(raw: string | undefined): string {
  const fallback = "http://localhost:4000";
  const value = (raw ?? fallback).trim().replace(/\/+$/, "");
  if (!value) return fallback;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return value;
  // Common mistake: host without scheme (breaks Vercel rewrites).
  return `https://${value}`;
}

const apiUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${apiUrl}/api/auth/:path*`,
      },
      {
        source: "/backend/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
