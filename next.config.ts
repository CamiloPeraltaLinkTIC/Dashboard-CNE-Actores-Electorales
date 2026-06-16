import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@google-analytics/data",
    "@grpc/grpc-js",
    "@grpc/proto-loader",
    "google-gax",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default nextConfig;
