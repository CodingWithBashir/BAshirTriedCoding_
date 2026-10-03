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
  async redirects() {
    return [
      { source: "/about", destination: "/courses", permanent: true },
      { source: "/services", destination: "/courses", permanent: true },
      { source: "/projects", destination: "/courses", permanent: true },
      { source: "/projects/:path*", destination: "/courses", permanent: true },
      { source: "/blog", destination: "/courses", permanent: true },
      { source: "/blog/:path*", destination: "/courses", permanent: true },
      { source: "/contact", destination: "/courses", permanent: true },
      { source: "/resources", destination: "/courses", permanent: true },
      { source: "/assistant", destination: "/courses", permanent: true },
    ];
  },
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
