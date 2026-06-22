// ============================================================
//  WORKSHOP CLAUDE CODE — Backend Server
//  - Melayani file statis (HTML, CSS, JS)
//  - POST /api/daftar  → simpan pendaftaran, kembalikan kode tiket
//  - Data disimpan di: data/pendaftaran.json
// ============================================================

const http   = require('http');
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

const PORT      = 3000;
const ROOT      = __dirname;
const DATA_FILE = path.join(ROOT, 'data', 'pendaftaran.json');

// Tipe konten untuk file statis
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css' : 'text/css; charset=utf-8',
  '.js'  : 'application/javascript; charset=utf-8',
};

// ── Inisialisasi file data jika belum ada ──────────────────
const dataDir = path.join(ROOT, 'data');
if (!fs.existsSync(dataDir))      fs.mkdirSync(dataDir);
if (!fs.existsSync(DATA_FILE))    fs.writeFileSync(DATA_FILE, '[]');

// ── Helper: baca JSON body dari request ───────────────────
function bacaBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end',  ()    => {
      try   { resolve(JSON.parse(raw)); }
      catch { reject(new Error('JSON tidak valid')); }
    });
  });
}

// ── Helper: kirim respons JSON ────────────────────────────
function kirimJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

// ── Endpoint POST /api/daftar ─────────────────────────────
async function handleDaftar(req, res) {
  let body;
  try {
    body = await bacaBody(req);
  } catch {
    return kirimJSON(res, 400, { sukses: false, pesan: 'Request tidak valid.' });
  }

  const { nama, email, jumlahTiket } = body;

  // Validasi dasar di sisi server
  if (!nama || typeof nama !== 'string' || nama.trim().length < 2) {
    return kirimJSON(res, 400, { sukses: false, pesan: 'Nama tidak valid.' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return kirimJSON(res, 400, { sukses: false, pesan: 'Email tidak valid.' });
  }
  const qty = parseInt(jumlahTiket, 10);
  if (!qty || qty < 1 || qty > 10) {
    return kirimJSON(res, 400, { sukses: false, pesan: 'Jumlah tiket tidak valid (1–10).' });
  }

  // Buat kode tiket unik: WCC-XXXXXXXX
  const kodeTiket = 'WCC-' + crypto.randomBytes(4).toString('hex').toUpperCase();

  const entri = {
    kodeTiket,
    nama:        nama.trim(),
    email:       email.toLowerCase().trim(),
    jumlahTiket: qty,
    totalHarga:  qty * 50000,
    waktu:       new Date().toISOString(),
  };

  // Simpan ke file JSON
  try {
    const semua = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    semua.push(entri);
    fs.writeFileSync(DATA_FILE, JSON.stringify(semua, null, 2));
  } catch {
    return kirimJSON(res, 500, { sukses: false, pesan: 'Gagal menyimpan data.' });
  }

  console.log(`[DAFTAR] ${entri.waktu} | ${entri.kodeTiket} | ${entri.nama} | ${entri.email} | ${entri.jumlahTiket} tiket`);
  return kirimJSON(res, 200, { sukses: true, kodeTiket, pesan: 'Pendaftaran berhasil.' });
}

// ── File statis ───────────────────────────────────────────
function handleStatis(req, res) {
  const urlPath = req.url.split('?')[0]; // buang query string

  // Blokir akses langsung ke folder sensitif
  if (urlPath.startsWith('/data/') || urlPath.startsWith('/node_modules/')) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  const filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);

  // Cegah path traversal (mis. /../../../etc/passwd)
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  const ext         = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not Found'); }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

// ── Server utama ──────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/daftar') {
    return handleDaftar(req, res);
  }
  handleStatis(req, res);
});

server.listen(PORT, () => {
  console.log(`Server berjalan → http://localhost:${PORT}`);
  console.log(`Data tersimpan  → ${DATA_FILE}`);
});
