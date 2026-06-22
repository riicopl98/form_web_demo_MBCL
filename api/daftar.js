// Vercel Serverless Function — POST /api/daftar
// Menerima data pendaftaran, menyimpannya, dan mengembalikan kode tiket unik.
//
// Catatan penyimpanan:
//   - Lokal   : data/pendaftaran.json  (persisten)
//   - Vercel  : /tmp/pendaftaran.json  (ephemeral per-instance)
//   Untuk produksi nyata, ganti dengan database (Vercel KV, Upstash, dsb.)

const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');

const HARGA_PER_TIKET = 50000;

const DATA_FILE = process.env.VERCEL
  ? '/tmp/pendaftaran.json'
  : path.join(process.cwd(), 'data', 'pendaftaran.json');

function bacaData() {
  try   { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; }
}

function simpanData(entri) {
  const semua = bacaData();
  semua.push(entri);
  fs.writeFileSync(DATA_FILE, JSON.stringify(semua, null, 2));
}

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')
    return res.status(405).json({ sukses: false, pesan: 'Method tidak diizinkan.' });

  // Vercel mem-parse body JSON secara otomatis; fallback untuk keamanan
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const { nama, email, jumlahTiket } = body;

  if (!nama || typeof nama !== 'string' || nama.trim().length < 2)
    return res.status(400).json({ sukses: false, pesan: 'Nama tidak valid.' });

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ sukses: false, pesan: 'Email tidak valid.' });

  const qty = parseInt(jumlahTiket, 10);
  if (!qty || qty < 1 || qty > 10)
    return res.status(400).json({ sukses: false, pesan: 'Jumlah tiket tidak valid (1–10).' });

  const kodeTiket = 'WCC-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  const entri = {
    kodeTiket,
    nama:        nama.trim(),
    email:       email.toLowerCase().trim(),
    jumlahTiket: qty,
    totalHarga:  qty * HARGA_PER_TIKET,
    waktu:       new Date().toISOString(),
  };

  try {
    simpanData(entri);
  } catch (err) {
    console.error('[DAFTAR] Gagal simpan:', err.message);
    return res.status(500).json({ sukses: false, pesan: 'Gagal menyimpan data.' });
  }

  console.log(`[DAFTAR] ${entri.waktu} | ${entri.kodeTiket} | ${entri.nama}`);
  return res.status(200).json({ sukses: true, kodeTiket, pesan: 'Pendaftaran berhasil.' });
};
