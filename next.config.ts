import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Cloudflare OpenNext supplies the production worker bundle. */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
