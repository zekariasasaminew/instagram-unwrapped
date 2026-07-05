// Bundles worker/parse.worker.ts standalone into public/worker.js (IIFE,
// browser target, all dependencies inlined) so it can be instantiated via a
// plain `new Worker('/worker.js')` string - see worker/parse.worker.ts for why.
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

await build({
  entryPoints: [join(root, "worker", "parse.worker.ts")],
  outfile: join(root, "public", "worker.js"),
  bundle: true,
  format: "iife",
  target: "es2020",
  platform: "browser",
  minify: process.env.NODE_ENV === "production",
  logLevel: "info",
});
