/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NFT_STORAGE_KEY: process.env.NFT_STORAGE_KEY,
  }
}

module.exports = nextConfig
