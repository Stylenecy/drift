import fs from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

// Pin the workspace root to the monorepo root (drift/), where npm workspaces
// install `next`; a stray parent lockfile otherwise makes Next infer the wrong
// root. A build of this folder on its own (e.g. a remote Vercel build of
// apps/web) has its own node_modules and is its own root.
const workspaceRoot = path.join(__dirname, "../..");
const root = fs.existsSync(path.join(workspaceRoot, "node_modules", "next")) ? workspaceRoot : __dirname;

const nextConfig: NextConfig = {
  turbopack: { root },
  // @drip/shared ships raw TypeScript; Next compiles it in-place.
  transpilePackages: ["@drip/shared"],
};

export default nextConfig;
