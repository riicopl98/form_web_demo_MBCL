// Konfigurasi Playwright — hanya gunakan Chromium, tanpa server otomatis
// (server sudah berjalan di port 8080 via Python http.server)
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 10000,
  use: {
    browserName: 'chromium',
    headless: true,
    baseURL: 'http://localhost:3000',
  },
  reporter: [['list']],
});
