import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.12', '192.168.1.*', 'localhost:3000'],
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
