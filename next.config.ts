import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Indique à Vercel que le middleware s'appelle proxy (Next.js 16)
  experimental: {},
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
