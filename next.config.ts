import type { NextConfig } from "next";
import { publicImagePatterns } from "./src/lib/image-sources";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: false,
  experimental: {
    globalNotFound: true,
  },
  images: {
    remotePatterns: [
      ...publicImagePatterns,
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
