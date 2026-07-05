// This file is bundled standalone via esbuild (see scripts/build-worker.mjs)
// into public/worker.js and instantiated with a plain `new Worker('/worker.js')`
// string, rather than Next.js's `new Worker(new URL(...))` bundler-integration
// pattern - Turbopack has open reports of gaps in that asset-resolution path,
// and a separately-bundled worker is something we can verify compiles
// correctly independent of the Next.js build.
//
// Spike stage: just proves the worker boots and can round-trip a message from
// a production build. The real parsing pipeline gets wired in once this is
// confirmed working (see lib/pipeline.ts).

self.onmessage = (event: MessageEvent) => {
  if (event.data?.type === "ping") {
    postMessage({ type: "pong", receivedAt: Date.now() });
  }
};
