import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node", // linkedom needs no jsdom/browser environment
    include: ["test/**/*.test.ts"],
  },
});
