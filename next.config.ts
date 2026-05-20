import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsHmrCache: false,
  },
  serverExternalPackages: ['pdf-parse', 'mammoth'],
  // Optimisation images désactivée pour Supabase Storage URLs
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
};

export default nextConfig;
