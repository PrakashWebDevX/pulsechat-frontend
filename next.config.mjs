/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow Google profile pictures
    domains: ["lh3.googleusercontent.com", "googleusercontent.com"],
  },
  env: {
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
  },
};

export default nextConfig;
