import { exec } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const execPromise = async (command: string): Promise<{ stdout: string, stderr: string }> =>
  new Promise((resolve, reject) =>
    exec(command, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      }

      resolve({ stdout, stderr });
    }));

export {
  execPromise as exec,
};

export async function generateEnvTypeDef(): Promise<void> {
  const __dirname = fileURLToPath(new URL(".", import.meta.url));
  const dotEnvPath = join(__dirname, "../.env");

  if (!existsSync(dotEnvPath)) {
    return;
  }

  const dotEnvContent = Buffer.from(await readFile(dotEnvPath));
  const envVars = dotenv.parse(dotEnvContent);
  const envVarNames = Object.keys(envVars);

  await writeFile(join(__dirname, "../src/env.d.ts"), `
    /// <reference types="vite/client" />

    interface ImportMetaEnv {
      ${envVarNames.map(envVarName => `readonly ${envVarName}: string;`).join("\n")}
    }

    interface ImportMeta {
      readonly env: ImportMetaEnv
    }
  `);
}
