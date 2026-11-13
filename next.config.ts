import type { NextConfig } from "next";
import { publicImagePatterns } from "./src/lib/image-sources";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: false,
  experimental: {
    globalNotFound: true,
  },
  async headers() {
    return [
      {
        // The handwriting font (src/styles/globals.css). public/ files default
        // to max-age=0; these never change under the same name.
        source: "/fonts/caveat/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
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
