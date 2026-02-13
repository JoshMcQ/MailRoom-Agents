/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  experimental: {
    serverActions: true
  },
  transpilePackages: [
    "@mailroom/core",
    "@mailroom/connectors",
    "@mailroom/llm",
    "@mailroom/ui",
    "@mailroom/types"
  ]
};

export default config;
