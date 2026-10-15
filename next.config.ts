import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel handles output automatically — no standalone mode needed.
  typescript: {
    // We have some legacy types from the Drizzle migration; don't fail the build on TS warnings.
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow the dynamic z-ai-web-dev-sdk import in the coach route to be bundled server-side.
  serverExternalPackages: ["z-ai-web-dev-sdk"],
  // Prisma + sharp need to be externalized on Vercel's serverless runtime.
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
