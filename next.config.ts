import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // nodemailer is server-only; keep it out of the bundler.
  serverExternalPackages: ['nodemailer'],
  // Pin the project root (a stray lockfile higher up the folder tree would otherwise be picked).
  turbopack: { root: path.resolve('.') },
  // The download page was removed; send old links home.
  async redirects() {
    return [
      { source: '/download', destination: '/', permanent: false },
      { source: '/features/web-app', destination: '/features', permanent: false },
      { source: '/features/call-forwarding', destination: '/features', permanent: false },
      { source: '/blog/call-and-text-from-your-computer', destination: '/blog', permanent: false },
      // The iPhone app links to these (Remote Config terms/privacy URLs).
      { source: '/terms.html', destination: '/terms', permanent: true },
      { source: '/privacy.html', destination: '/privacy', permanent: true },
    ];
  },
};

export default nextConfig;
