/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "assets.yourdomain.com", // replace with your R2 custom domain
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ["pg", "bcryptjs"],
  },
};

module.exports = nextConfig;
