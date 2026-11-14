import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Avoid auto-writing AGENTS.md into the repo on every `next dev`.
  experimental: {
    // @ts-expect-error agentRules is supported by this Next version
    agentRules: false,
  },
};

export default nextConfig;
