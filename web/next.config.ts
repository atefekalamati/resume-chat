import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // The dev-only badge would cover the chat button, which sits bottom-left in English.
  devIndicators: false,
  allowedDevOrigins: ["*.devtunnels.ms"],
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Bundle the resume content with the server functions on deploy.
  outputFileTracingIncludes: { "/api/chat": ["./content/**/*"] },
};

export default nextConfig;
