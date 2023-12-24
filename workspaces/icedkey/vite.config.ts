/* Build config for exposed configurators (src/configurator/*) */
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { dependencies } from "./package.json";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const deps = Object.keys(dependencies);

export default defineConfig({
  build: {
    outDir: join(__dirname, "dist/configurator"),
    lib: {
      entry: join(__dirname, "src/configurator/configurator.ts"),
      name: "configurator",
      fileName: "configurator",
      formats: [ "es", "cjs" ],
    },
    rollupOptions: {
      external: deps,
    },
  },
  plugins: [
    dts({
      outDir: join(__dirname, "dist/configurator/types"),
      entryRoot: join(__dirname, "src/configurator"),
      rollupTypes: true, // Generate single d.ts file
    }),
  ],
});
