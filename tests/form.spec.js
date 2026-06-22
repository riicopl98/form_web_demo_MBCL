// ============================================================
//  TES OTOMATIS — Form Pendaftaran Workshop Claude Code
//  Framework : Playwright
//  Server    : http://localhost:8080
//
//  Skenario:
//   1. Nama / Email kosong  → peringatan muncul, data tidak terkirim
//   2. Jumlah Tiket = 2     → total harga = Rp 100.000
//   3. Format email salah   → pesan error yang jelas
//   4. Semua diisi benar    → konfirmasi pendaftaran berhasil
// ============================================================

const { test, expect } = require('@playwright/test');

// Buka halaman segar sebelum setiap tes (baseURL diambil dari playwright.config.js)
test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

// ============================================================
//  SKENARIO 1 — Nama atau Email kosong
// ============================================================

test('1a. Nama kosong → error muncul, form tidak terkirim', async ({ page }) => {
  // Isi email saja, nama dibiarkan kosong
  await page.fill('#email', 'budi@email.com');
  await page.click('#submitBtn');

  // Pesan error nama harus terlihat
  const errorNama = page.locator('#error-nama');
  await expect(errorNama).toBeVisible();
  await expect(errorNama).not.toHaveText('');

  // Pesan sukses TIDAK boleh muncul
  await expect(page.locator('#successMessage')).not.toHaveClass(/visible/);
});

test('1b. Email kosong → error muncul, form tidak terkirim', async ({ page }) => {
  // Isi nama saja, email dibiarkan kosong
  await page.fill('#nama', 'Budi Santoso');
  await page.click('#submitBtn');

  const errorEmail = page.locator('#error-email');
  await expect(errorEmail).toBeVisible();
  await expect(errorEmail).not.toHaveText('');

  await expect(page.locator('#successMessage')).not.toHaveClass(/visible/);
});

test('1c. Nama DAN Email kosong → dua error sekaligus muncul', async ({ page }) => {
  await page.click('#submitBtn');

  await expect(page.locator('#error-nama')).not.toHaveText('');
  await expect(page.locator('#error-email')).not.toHaveText('');
  await expect(page.locator('#successMessage')).not.toHaveClass(/visible/);
});

// ============================================================
//  SKENARIO 2 — Jumlah Tiket = 2 → total Rp 100.000
// ============================================================

test('2. Tiket = 2 → total harga tampil Rp 100.000', async ({ page }) => {
  // Klik tombol + sekali (nilai awal = 1, menjadi 2)
  await page.click('#btnPlus');

  const labelHarga = page.locator('#ticketPrice');
  await expect(labelHarga).toContainText('100.000');

  // Pastikan nilai input tiket benar
  await expect(page.locator('#tiket')).toHaveValue('2');
});

test('2b. Tiket = 1 (awal) → total harga tampil Rp 50.000', async ({ page }) => {
  await expect(page.locator('#ticketPrice')).toContainText('50.000');
});

test('2c. Tiket naik lalu turun kembali ke 1 → total kembali Rp 50.000', async ({ page }) => {
  await page.click('#btnPlus');  // → 2
  await page.click('#btnMinus'); // → 1
  await expect(page.locator('#ticketPrice')).toContainText('50.000');
  await expect(page.locator('#tiket')).toHaveValue('1');
});

// ============================================================
//  SKENARIO 3 — Format email salah
// ============================================================

test('3a. Email "abc" (tanpa @) → error format email', async ({ page }) => {
  await page.fill('#nama', 'Budi Santoso');
  await page.fill('#email', 'abc');
  await page.click('#submitBtn');

  const errorEmail = page.locator('#error-email');
  await expect(errorEmail).toBeVisible();
  await expect(errorEmail).toContainText('tidak valid');
  await expect(page.locator('#successMessage')).not.toHaveClass(/visible/);
});

test('3b. Email "abc@" (domain kosong) → error format email', async ({ page }) => {
  await page.fill('#nama', 'Budi Santoso');
  await page.fill('#email', 'abc@');
  await page.click('#submitBtn');

  await expect(page.locator('#error-email')).toContainText('tidak valid');
});

test('3c. Email "abc@domain" (tanpa TLD) → error format email', async ({ page }) => {
  await page.fill('#nama', 'Budi Santoso');
  await page.fill('#email', 'abc@domain');
  await page.click('#submitBtn');

  await expect(page.locator('#error-email')).toContainText('tidak valid');
});

// ============================================================
//  SKENARIO 4 — Semua data benar → redirect ke halaman e-tiket
// ============================================================

test('4a. Data valid → redirect ke halaman etiket.html', async ({ page }) => {
  await page.fill('#nama', 'Budi Santoso');
  await page.fill('#email', 'budi@email.com');
  await page.click('#submitBtn');

  // Setelah API sukses, URL harus berpindah ke etiket.html
  await page.waitForURL('**/etiket.html**', { timeout: 5000 });
  expect(page.url()).toContain('etiket.html');
  expect(page.url()).toContain('kode=WCC-');
});

test('4b. Halaman e-tiket menampilkan nama dan email pendaftar', async ({ page }) => {
  await page.fill('#nama', 'Siti Rahayu');
  await page.fill('#email', 'siti@email.com');
  await page.click('#submitBtn');

  await page.waitForURL('**/etiket.html**', { timeout: 5000 });
  await expect(page.locator('#displayNama')).toHaveText('Siti Rahayu');
  await expect(page.locator('#displayEmail')).toContainText('siti@email.com');
});

test('4c. E-tiket 2 tiket → tampil total Rp 100.000 dan kode WCC-', async ({ page }) => {
  await page.fill('#nama', 'Andi Wijaya');
  await page.fill('#email', 'andi@email.com');
  await page.click('#btnPlus'); // → 2 tiket

  await page.click('#submitBtn');

  await page.waitForURL('**/etiket.html**', { timeout: 5000 });
  await expect(page.locator('#displayTiket')).toContainText('2');
  await expect(page.locator('#displayHarga')).toContainText('100.000');
  await expect(page.locator('#displayKode')).toContainText('WCC-');
});

test('4d. Tombol "Kembali" di e-tiket mengarah ke halaman utama', async ({ page }) => {
  await page.fill('#nama', 'Rina Marlina');
  await page.fill('#email', 'rina@email.com');
  await page.click('#submitBtn');

  await page.waitForURL('**/etiket.html**', { timeout: 5000 });
  await page.click('.btn-kembali');

  await page.waitForURL('**/', { timeout: 3000 });
  await expect(page.locator('h1')).toContainText('Workshop Claude Code');
});
