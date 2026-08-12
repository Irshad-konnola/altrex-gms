import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['wish-prankish-dropbox.ngrok-free.dev'], // Keeping your existing config
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mdzscvrenajhbhsrqans.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**', // This restricts it to your public Supabase storage
      },
    ],
  },
};

export default nextConfig;