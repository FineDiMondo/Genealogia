// @ts-check
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  testMatch: ["**/*.test.js"],
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: process.env.GN370_TEST_URL || "http://localhost:8080",
    headless: true,
  },
  webServer: process.env.GN370_TEST_URL
    ? undefined
    : {
        command: "python scripts/serve_with_isolation.py --port 8080",
        url: "http://localhost:8080",
        timeout: 15000,
        reuseExistingServer: true,
      },
});
