import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Add a rule for handling `.node` files
    if (isServer) {
      config.module.rules.push({
        test: /\.node$/,
        use: "node-loader",
      });
    }

    // Return the modified configuration
    return config;
  },
  /* other config options here */
};

export default nextConfig;
