#!/usr/bin/env node

import { cp, mkdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { cwd } from "node:process";
import { fileURLToPath } from "node:url";
import minimist from "minimist";
import { Shescape } from "shescape";
import { build, createServer } from "vite";
import devServer from "@hono/vite-dev-server";
import pages from "@hono/vite-cloudflare-pages";
import { exec } from "../utils";
import type { IcedKeyOptions } from "../types";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const { _: [ subCommand ] } = minimist(process.argv.slice(2));
const projectRoot = cwd();
const userAssetsDir = join(__dirname, "../src/user-assets");
// TODO support icedkey.config.[js|cjs|mjs|json|json5]
const { favicon: faviconPath, outDir, google }: IcedKeyOptions = await import(`${cwd()}/icedkey.config.ts`);
const commonViteConfig = {
  root: projectRoot,
  plugins: [ pages() ],
};

await rm(userAssetsDir, { recursive: true, force: true });

if (faviconPath) {
  await mkdir(userAssetsDir, { recursive: true });
  await cp(faviconPath, join(userAssetsDir, "favicon.ico"));
}

if (subCommand === "dev") {
  const server = await createServer({
    ...commonViteConfig,
    plugins: [
      devServer({
        entry: join(__dirname, "../src/app/index.tsx"),
      }),
    ],
  });
  await server.listen();

  server.printUrls();
} else if (subCommand === "build") {
  await build({
    ...commonViteConfig,
    build: {
      outDir: outDir ?? join(projectRoot, "dist"),
      lib: {
        entry: join(__dirname, "../src/app/index.tsx"),
        name: "app",
        fileName: "app",
        formats: [ "es" ],
      },
    },
    plugins: [
      pages(),
      devServer({
        entry: "src/app/index.tsx",
      }),
    ],
  });
} else if (subCommand === "postdeploy") {
  if (!google?.serviceAccountJsonPath) {
    process.exit(0);
  }

  console.info("Uploading credentials of Google as a secrets...");

  const shescape = new Shescape({ shell: true });

  const serviceAccountJson = await readFile(google.serviceAccountJsonPath, { encoding: "utf8" });
  const serializedServiceAccountJson = shescape.escape(JSON.stringify(JSON.parse(serviceAccountJson)));

  try {
    const { stderr } = await exec(`echo "${serializedServiceAccountJson}" | npx wrangler put GOOGLE_SERVICE_ACCOUNT_JSON`);

    if (stderr) {
      console.error(stderr);
    }
  } catch (err) {
    console.error("Failed to upload secrets");
    process.exit(1);
  }
} else {
  console.log(`IcedKey: unknown subcommand "${subCommand}"`);
}
