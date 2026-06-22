const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  // Scroll ke seksi peta
  await page.locator('.map-section').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);

  // Verifikasi elemen peta ada
  const iframe = await page.locator('.map-frame iframe');
  const src    = await iframe.getAttribute('src');
  const judul  = await page.locator('.map-section h2').textContent();
  const alamat = await page.locator('.map-address').textContent();

  console.log('Judul seksi :', judul.trim());
  console.log('Alamat      :', alamat.trim());
  console.log('iframe src  :', src.substring(0, 80) + '…');
  console.log('Koordinat OK:', src.includes('-6.1957601') && src.includes('106.8214547') ? '✓ Ya' : '✗ Tidak');
  console.log('Marker OK   :', src.includes('marker') ? '✓ Ya' : '✗ Tidak');

  await page.screenshot({ path: 'tests/ss-03-peta.png', fullPage: false });
  console.log('Screenshot  : tests/ss-03-peta.png');

  await browser.close();
})();
