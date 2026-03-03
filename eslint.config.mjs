import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "script",
      globals: {
        // Browser
        window: "readonly",
        document: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        Promise: "readonly",
        fetch: "readonly",
        URL: "readonly",
        Blob: "readonly",
        FileReader: "readonly",
        Worker: "readonly",
        SharedArrayBuffer: "readonly",
        Atomics: "readonly",
        TextEncoder: "readonly",
        TextDecoder: "readonly",
        crypto: "readonly",
        // Vendor libraries (browser-side)
        JSZip: "readonly",
        // GN370 namespace
        GN370: "writable",
        sqlite3InitModule: "readonly",
        // Node.js (for test files)
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        __dirname: "readonly",
        process: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
      "no-console": "off",
      "no-var": "off",
    },
  },
  {
    // Test files can use Node globals more freely
    files: ["tests/**/*.js", "scripts/**/*.js"],
    languageOptions: {
      globals: {
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        __dirname: "readonly",
        process: "readonly",
        Buffer: "readonly",
        File: "readonly",
      },
    },
  },
  {
    ignores: [
      "node_modules/**",
      "out/**",
      "assets/js/sql-runtime.js",
      "assets/vendor/**",
    ],
  },
];
