/* Build config for CLI (src/bin/*) */
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineBuildConfig } from "unbuild";
import { dependencies } from "./package.json";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const deps = Object.keys(dependencies);

export default defineBuildConfig({
  entries: [ join(__dirname, "src/bin/cli.ts") ],
  // outDir: join(__dirname, "dist"),
  externals: deps,
  declaration: false,
  rollup: {
    esbuild: {
      target: "es2022"
    }
  }
});
