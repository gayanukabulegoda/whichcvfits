import type { NextConfig } from "next";
import path from "node:path";
const nextConfig: NextConfig = {
  agentRules: false,
  distDir: process.env.WHICHCVFITS_QA_DIST_DIR || ".next",
  env: { WHICHCVFITS_TARGET: process.env.WHICHCVFITS_TARGET || "node" },
  webpack(config, { webpack }) {
    if (process.env.WHICHCVFITS_TARGET === "cloudflare") {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /runtime(?:\.ts)?$/,
          (resource: { context: string; request: string }) => {
            if (resource.context === path.resolve("src/db"))
              resource.request = path.resolve("src/db/cloudflare.ts");
          },
        ),
      );
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};
export default nextConfig;
