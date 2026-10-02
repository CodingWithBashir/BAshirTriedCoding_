import type { NextConfig } from "next";

const apiOrigin = process.env.API_INTERNAL_URL || "http://127.0.0.1:4000";

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
