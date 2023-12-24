export type IcedKeyOptions = {
  platform: "cloudflare", // TODO: | "vercel" | "bun" | "deno" | "lambda" | "lambda-edge" | "fastly" | "lagon" | "winterjs" | "nodejs"
  /** If your access to your IcedKey instance is from SPA (Single Page Application), set your domains which runs your frontend here. */
  allowedOrigin?: string | string[],
  favicon?: string,
  outDir?: string,
  google?: {
    serviceAccountJsonPath?: string,
  },
};
