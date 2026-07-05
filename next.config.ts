import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No API routes or server rendering anywhere in this app - everything runs
  // client-side in the browser, so it ships as a plain static site (also a
  // real trust signal here: a skeptical visitor can check devtools/Network
  // and see there's no backend for their data to go to).
  output: "export",
};

export default nextConfig;
