import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["xlsx"],
  outputFileTracingIncludes: {
    "/": ["./data/**"],
  },
};

export default nextConfig;
