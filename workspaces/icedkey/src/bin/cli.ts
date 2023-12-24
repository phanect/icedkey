#!/usr/bin/env node

import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { cwd } from "node:process";
import { fileURLToPath } from "node:url";
import minimist from "minimist";
import { Shescape } from "shescape";
import { build, createServer } from "vite";
import devServer from "@hono/vite-dev-server";
import pages from "@hono/vite-cloudflare-pages";
import { exec, generateEnvTypeDef } from "../utils";
import type { IcedKeyOptions } from "../types";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

async function createD1(): Promise<void> {
  // TODO Cloudflare 上に D1 インスタンス作成する。その後テーブル作成する。(必要だっけ? → 必要だった https://www.javadrive.jp/sqlite/table/index1.html)
}

const { _: [ subCommand ] } = minimist(process.argv.slice(2));
const projectRoot = cwd();
const userAssetsDir = join(__dirname, "../src/user-assets");
// TODO support icedkey.config.[js|cjs|mjs|json|json5]
const { favicon: faviconPath, allowedOrigin, outDir, google }: IcedKeyOptions = await import(`${cwd()}/icedkey.config.ts`);
const commonViteConfig = {
  root: projectRoot,
  plugins: [ pages() ],
};

await rm(userAssetsDir, { recursive: true, force: true });

if (faviconPath) {
  await mkdir(userAssetsDir, { recursive: true });
  await cp(faviconPath, join(userAssetsDir, "favicon.ico"));
}

if (allowedOrigin) {
  function validateAllowedOrigin(allowedOrigin: string): { success: boolean, msg?: string } {
    let _allowedOrigin = allowedOrigin;

    if (_allowedOrigin.startsWith("http://")) {
      return { success: false, msg: "HTTP (non-HTTPS) is not supported." };
    }

    if (!_allowedOrigin.startsWith("https://")) {
      _allowedOrigin = `https://${_allowedOrigin}`;
    }

    try {
      const url = new URL(_allowedOrigin);

      if (url.username !== "" || url.password !== "") {
        return { success: false, msg: "Username and password in the URL is not allowed." };
      }

      if (url.pathname !== "/") {
        console.warn(`allowedOrigin has path (${url.pathname}), but it is ignored. IceKey only uses protocol (${url.protocol}) and domain (${url.host}) for CORS settings.`);
      }
      if (url.search !== "") {
        console.warn(`allowedOrigin has query string (${url.search}), but it is ignored. IceKey only uses protocol (${url.protocol}) and domain (${url.host}) for CORS settings.`);
      }
      if (url.hash !== "") {
        console.warn(`allowedOrigin has hash string (${url.hash}), but it is ignored. IceKey only uses protocol (${url.protocol}) and domain (${url.host}) for CORS settings.`);
      }

      return { success: true };
    } catch (err) {
      if (err instanceof TypeError) {
        return { success: false, msg: `allowedOrigin is not an URL: ${_allowedOrigin}` };
      } else {
        throw err;
      }
    }
  }

  async function addAllowedOriginsToDotEnv(allowedOrigin: string | string[]): Promise<void> {
    await writeFile(join(__dirname, "../../.env"), `VITE_ALLOWED_ORIGINS="${JSON.stringify(Array.isArray(allowedOrigin) ? allowedOrigin : [ allowedOrigin ])}"`);
    await generateEnvTypeDef();
  }

  if (typeof allowedOrigin === "string") {
    const { success, msg } = validateAllowedOrigin(allowedOrigin);

    if (success) {
      await addAllowedOriginsToDotEnv(allowedOrigin);
    } else {
      console.error(msg);
      process.exit(1);
    }
  } else if (Array.isArray(allowedOrigin)) {
    for (const domain of allowedOrigin) {
      const { success, msg } = validateAllowedOrigin(domain);

      if (!success) {
        console.error(msg);
        process.exit(1);
      }
    }

    await addAllowedOriginsToDotEnv(allowedOrigin);
  }
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

  console.info("Creating D1 database instance on your Cloudflare account...");
  await createD1();

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
