import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "icedkey";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  platform: "cloudflare",
  // favicon: join(__dirname, "assets/favicon.ico"),
  // outDir: join(__dirname, "dist"),
  // google: {
  //   serviceAccountJsonPath: join(__dirname, "secrets/google-service-account.json"),
  // },
});
