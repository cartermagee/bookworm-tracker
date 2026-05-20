import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // App Router is the default in Next 15; no flag needed.
  experimental: {
    // Server Actions are opt-in but we don't use them — see ADR-0004 (mutations go through
    // TanStack Query + the typed fetch client to the .NET API directly).
  },
};

export default nextConfig;
