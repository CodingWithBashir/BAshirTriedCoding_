import type { NextConfig } from "next";

const configuredApiOrigin = process.env.API_INTERNAL_URL?.trim();
const defaultApiOrigin = process.env.VERCEL === "1"
  ? "https://coding-with-bashir-api.onrender.com"
  : "http://127.0.0.1:4000";
const apiOrigin = (configuredApiOrigin || defaultApiOrigin).replace(/\/+$/, "");
if (!/^https?:\/\//i.test(apiOrigin)) {
  throw new Error("API_INTERNAL_URL must be an absolute HTTP or HTTPS URL without a trailing slash.");
}

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  allowedDevOrigins: ["*.e2b.app", "*.e2b.dev", "localhost", "127.0.0.1"],
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
