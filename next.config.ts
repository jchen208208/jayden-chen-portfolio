import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // three.js ships modern ESM; transpiling keeps the App Router server bundle happy.
  transpilePackages: ["three"],

  // Dev is sometimes opened from another device on the LAN (e.g. a browser on a
  // different machine). Next 16 blocks cross-origin /_next/* dev requests by
  // default, which breaks HMR + hydration. Allow the local network hosts.
  allowedDevOrigins: ["10.0.0.100", "localhost", "127.0.0.1"],

  // The desk speaker's album covers (`lib/itunes`) come from Apple's image
  // CDN. Only its artwork path is allowed, so the image optimizer can't be
  // pointed at anything else.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.mzstatic.com", pathname: "/image/thumb/**", search: "" },
    ],
  },
};

export default nextConfig;
