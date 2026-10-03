import type { NextConfig } from "next";
const config: NextConfig = {
  transpilePackages: ["@celeste/domain"],
  poweredByHeader: false,
};
export default config;
