import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // nodemailer is server-only; keep it out of the bundler.
  serverExternalPackages: ['nodemailer'],
  // Pin the project root (a stray lockfile higher up the folder tree would otherwise be picked).
  turbopack: { root: path.resolve('.') },
};

export default nextConfig;
