"use strict";

const { join } = require("node:path");

module.exports = {
  root: true,
  extends: "phanective/node",

  env: {
    browser: true,
    node: true,
  },
  parserOptions: {
    sourceType: "module",
    project: join(__dirname, "./tsconfig.json"),
  },
  overrides: [
    {
      files: [ "workspaces/icedkey/**/*" ],
      extends: [ "plugin:drizzle/recommended" ],
      plugins: [ "drizzle" ],
    },
    // TODO configure in eslint-config-phanective
    {
      files: [ "**/*.cjs" ],
      parserOptions: {
        sourceType: "script",
      },
      rules: {
        strict: [ "error", "global" ],
      },
    },
    {
      files: [
        "**/*.config.*",
        "**/.eslintrc.*",
      ],
      rules: {
        "node/no-unpublished-import": "off",
      },
    },
    {
      files: [ "workspaces/**/bin/*.ts" ],
      rules: {
        "node/shebang": "off",
      },
    },
  ],
};
