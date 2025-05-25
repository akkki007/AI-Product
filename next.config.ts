import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.40.65",
  "192.168.1.100", // Another IP
  "localhost"],
};

export default nextConfig;
