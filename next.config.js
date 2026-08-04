/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pg", "bcryptjs"],
  async rewrites() {
    return [{ source: "/demo", destination: "/demo.html" }];
  },
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