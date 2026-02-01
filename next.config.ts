import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize performance
  compress: true,
  poweredByHeader: false,
  // Ensure Fast Refresh works properly
  reactStrictMode: true,
};

export default nextConfig;
