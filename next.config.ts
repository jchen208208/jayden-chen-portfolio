import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // three.js ships modern ESM; transpiling keeps the App Router server bundle happy.
  transpilePackages: ["three"],

  // Dev is sometimes opened from another device on the LAN (e.g. a browser on a
  // different machine). Next 16 blocks cross-origin /_next/* dev requests by
  // default, which breaks HMR + hydration. Allow the local network hosts.
  allowedDevOrigins: ["10.0.0.100", "localhost", "127.0.0.1"],
};

export default nextConfig;
