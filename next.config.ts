import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.E2E_DIST_DIR || ".next",
  serverExternalPackages: ["@react-pdf/renderer"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
