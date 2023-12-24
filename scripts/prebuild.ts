import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import originalTsconfig from "../tsconfig.json";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export type RecursivePartial<T> = {
  [P in keyof T]?:
  T[P] extends Array<infer U> ? Array<Value<U>> : Value<T[P]>;
};
type AllowedPrimitives = boolean | string | number | Date;
type Value<T> = T extends AllowedPrimitives ? T : RecursivePartial<T>;

const tsconfig = originalTsconfig as RecursivePartial<typeof originalTsconfig> ;
delete tsconfig.compilerOptions?.baseUrl;
delete tsconfig.compilerOptions?.paths;

await Promise.all([
  writeFile(join(__dirname, "../workspaces/create/template/tsconfig.json"), JSON.stringify(tsconfig, null, 2)),
  writeFile(join(__dirname, "../workspaces/icedkey/tsconfig.json"), JSON.stringify(tsconfig, null, 2)),
]);
