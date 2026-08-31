import type { NextConfig } from "next";
import "./src/env.mjs";

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
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ]
  },
};

import { withSentryConfig } from "@sentry/nextjs";

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
  org: "altrex-fitness",
  project: "altrex-gms",
  sentryUrl: "https://sentry.io/",
  
  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,
  widenClientFileUpload: true,
  reactComponentAnnotation: {
    enabled: true,
  },
  sourcemaps: {
    disable: true,
  },
  disableLogger: true,
  automaticVercelMonitors: true,
});