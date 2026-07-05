// Bundled standalone via esbuild (see scripts/build-worker.mjs) into
// public/worker.js and instantiated with a plain `new Worker('/worker.js')`
// string - see the comment history on this file / the commit that added it
// for why (Turbopack's `new Worker(new URL(...))` asset-resolution pattern
// was judged too risky to verify without a real browser in this project's
// dev environment).
//
// Runs the whole parsing pipeline off the main thread: nothing here ever
// sends data anywhere - the parsed Summary is posted straight back to the
// page that created this worker.
import { runPipeline } from "../lib/pipeline";
import type { WorkerRequest, WorkerResponse } from "../lib/types";

function post(response: WorkerResponse) {
  postMessage(response);
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;
  if (message?.type !== "parse") return;

  try {
    const summary = await runPipeline(message.file, (phase, processed, total) => {
      post({ type: "progress", phase, processed, total });
    });
    post({ type: "result", summary });
  } catch (err) {
    post({
      type: "error",
      phase: "parsing",
      message: err instanceof Error ? err.message : "Something went wrong reading this file.",
      fatal: true,
    });
  }
};
