import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Smaller production artifact for low-memory Aliyun deploys
  output: "standalone",
};

export default nextConfig;
