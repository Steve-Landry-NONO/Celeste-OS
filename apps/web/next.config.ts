import type { NextConfig } from "next";
const config: NextConfig = {
  transpilePackages: ["@celeste/domain"],
  poweredByHeader: false,
  experimental: {
    serverActions: { bodySizeLimit: "22mb" },
  },
};
export default config;
