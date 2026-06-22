// Uji coba manual: daftar "Ocir" 2 tiket, verifikasi e-tiket + QR code
const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page    = await browser.newPage();
  const hasil   = [];

  function log(status, pesan) {
    const simbol = status === 'LULUS' ? '✓' : '✗';
    hasil.push(`  ${simbol} [${status}] ${pesan}`);
  }

  try {
    // 1. Buka halaman utama
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    log('LULUS', 'Halaman utama terbuka');

    // 2. Isi nama
    await page.fill('#nama', 'Ocir');
    log('LULUS', 'Nama "Ocir" diisi');

    // 3. Isi email
    await page.fill('#email', 'ocir@workshopclaudecode.id');
    log('LULUS', 'Email diisi');

    // 4. Tambah tiket → 2
    await page.click('#btnPlus');
    const nilaiTiket = await page.inputValue('#tiket');
    const labelHarga = await page.textContent('#ticketPrice');
    if (nilaiTiket === '2') log('LULUS', `Jumlah tiket = ${nilaiTiket}`);
    else log('GAGAL', `Jumlah tiket seharusnya 2, dapat: ${nilaiTiket}`);
    if (labelHarga.includes('100.000')) log('LULUS', `Total harga tampil: ${labelHarga.trim()}`);
    else log('GAGAL', `Total harga salah: ${labelHarga.trim()}`);

    // 5. Screenshot form sebelum submit
    await page.screenshot({ path: 'tests/ss-01-form.png', fullPage: false });
    log('LULUS', 'Screenshot form tersimpan → ss-01-form.png');

    // 6. Klik Beli Tiket → tunggu redirect ke etiket.html
    await page.click('#submitBtn');
    await page.waitForURL('**/etiket.html**', { timeout: 6000 });
    const url = page.url();
    if (url.includes('etiket.html') && url.includes('WCC-'))
      log('LULUS', `Redirect ke e-tiket berhasil: ${url.split('?')[1].substring(0, 40)}…`);
    else log('GAGAL', `URL tidak sesuai: ${url}`);

    // 7. Tunggu QR code termuat (img src diset oleh JS)
    await page.waitForFunction(() => {
      const img = document.getElementById('qrImg');
      return img && img.src && img.src.includes('qrserver.com');
    }, { timeout: 5000 });
    log('LULUS', 'Atribut src QR code diset ke qrserver.com');

    // Tunggu gambar QR benar-benar selesai dimuat
    await page.waitForFunction(() => {
      const img = document.getElementById('qrImg');
      return img && img.complete && img.naturalWidth > 0;
    }, { timeout: 10000 });
    log('LULUS', 'Gambar QR code berhasil dimuat (naturalWidth > 0)');

    // 8. Verifikasi data di e-tiket
    const displayNama  = await page.textContent('#displayNama');
    const displayTiket = await page.textContent('#displayTiket');
    const displayHarga = await page.textContent('#displayHarga');
    const displayKode  = await page.textContent('#displayKode');
    const displayEmail = await page.textContent('#displayEmail');

    if (displayNama.trim() === 'Ocir')
      log('LULUS', `Nama di e-tiket: "${displayNama.trim()}"`);
    else
      log('GAGAL', `Nama seharusnya "Ocir", dapat: "${displayNama.trim()}"`);

    if (displayTiket.includes('2'))
      log('LULUS', `Jumlah tiket di e-tiket: "${displayTiket.trim()}"`);
    else
      log('GAGAL', `Jumlah tiket salah: "${displayTiket.trim()}"`);

    if (displayHarga.includes('100.000'))
      log('LULUS', `Total harga di e-tiket: "${displayHarga.trim()}"`);
    else
      log('GAGAL', `Total harga salah: "${displayHarga.trim()}"`);

    if (displayKode.startsWith('WCC-'))
      log('LULUS', `Kode tiket: "${displayKode.trim()}"`);
    else
      log('GAGAL', `Kode tiket tidak valid: "${displayKode.trim()}"`);

    if (displayEmail.includes('ocir@'))
      log('LULUS', `Email di e-tiket: "${displayEmail.trim()}"`);
    else
      log('GAGAL', `Email salah: "${displayEmail.trim()}"`);

    // 9. Verifikasi URL QR code mengandung kode tiket
    const qrSrc = await page.getAttribute('#qrImg', 'src');
    if (qrSrc.includes(displayKode.trim()))
      log('LULUS', `QR code berisi kode tiket yang benar`);
    else
      log('GAGAL', `QR src tidak mengandung kode tiket: ${qrSrc}`);

    // 10. Screenshot e-tiket final
    await page.screenshot({ path: 'tests/ss-02-etiket.png', fullPage: false });
    log('LULUS', 'Screenshot e-tiket tersimpan → ss-02-etiket.png');

    // Simpan kode tiket untuk dicek di data file
    process.env._KODE = displayKode.trim();

  } catch (err) {
    log('GAGAL', `Error tidak terduga: ${err.message}`);
  } finally {
    await browser.close();
  }

  // Laporan
  const lulus = hasil.filter(h => h.includes('[LULUS]')).length;
  const gagal = hasil.filter(h => h.includes('[GAGAL]')).length;
  console.log('\n════════════════════════════════════════');
  console.log('  HASIL UJI COBA — Pendaftaran "Ocir"');
  console.log('════════════════════════════════════════');
  hasil.forEach(h => console.log(h));
  console.log('────────────────────────────────────────');
  console.log(`  Total: ${lulus + gagal} | ✓ Lulus: ${lulus} | ✗ Gagal: ${gagal}`);
  console.log('════════════════════════════════════════\n');

  process.exit(gagal > 0 ? 1 : 0);
})();
