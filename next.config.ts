import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverRuntimeConfig: {
    figmaStatic: path.resolve(__dirname, "./src/app"),
  },
};

export default nextConfig;
