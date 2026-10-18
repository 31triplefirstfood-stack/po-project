import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  outputFileTracingIncludes: {
    '/api/purchase-orders/*/pdf': ['./public/fonts/Sarabun-*.ttf'],
  },
};

export default nextConfig;
