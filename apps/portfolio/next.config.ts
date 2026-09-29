import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  async rewrites() {
    // Preserve the full prefix. Each application owns its own basePath.
    const smartRent = process.env.SMARTRENT_ORIGIN || 'http://127.0.0.1:3000';
    const splitSafari = process.env.SPLITSAFARI_ORIGIN || 'http://127.0.0.1:3002';
    return [
      { source: '/app/portfolio', destination: '/' },
      { source: '/app/smartrent/:path*', destination: `${smartRent}/app/smartrent/:path*` },
      { source: '/app/SplitSafari/:path*', destination: `${splitSafari}/app/SplitSafari/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
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
