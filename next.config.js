/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pg", "bcryptjs"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "assets.yourdomain.com",
      },
    ],
  },
};

module.exports = nextConfig;