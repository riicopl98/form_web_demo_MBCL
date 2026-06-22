// ============================================================
//  WORKSHOP CLAUDE CODE — Script
//  Bagian 1: Counter tiket & kalkulasi harga
//  Bagian 2: Validasi form & tampilkan pesan sukses
// ============================================================

const HARGA_PER_TIKET = 50000;
const MAX_TIKET       = 10;
const MIN_TIKET       = 1;

// --- Elemen DOM ---
const namaInput   = document.getElementById('nama');
const emailInput  = document.getElementById('email');
const tiketInput  = document.getElementById('tiket');
const btnPlus     = document.getElementById('btnPlus');
const btnMinus    = document.getElementById('btnMinus');
const priceLabel  = document.getElementById('ticketPrice');
const form        = document.getElementById('registrationForm');
const submitBtn   = document.getElementById('submitBtn');
const successBox  = document.getElementById('successMessage');
const successText = document.getElementById('successDetail');
const successKode = document.getElementById('successKode');
const btnReset    = document.getElementById('btnReset');

// ============================================================
//  BAGIAN 1: COUNTER TIKET
// ============================================================

function formatRupiah(jumlah) {
  return 'Rp ' + jumlah.toLocaleString('id-ID');
}

// Perbarui label total dan status tombol +/− setiap jumlah tiket berubah
function perbaruiTotal() {
  const qty = parseInt(tiketInput.value, 10);
  priceLabel.textContent = 'TOTAL HARGA: ' + formatRupiah(qty * HARGA_PER_TIKET);
  btnMinus.disabled = qty <= MIN_TIKET;
  btnPlus.disabled  = qty >= MAX_TIKET;
}

// Tombol + dan − hanya aktif dalam batas MIN–MAX (dijaga oleh disabled),
// jadi cukup ubah nilai lalu panggil perbaruiTotal()
btnPlus.addEventListener('click', () => {
  tiketInput.value = parseInt(tiketInput.value, 10) + 1;
  perbaruiTotal();
});

btnMinus.addEventListener('click', () => {
  tiketInput.value = parseInt(tiketInput.value, 10) - 1;
  perbaruiTotal();
});

perbaruiTotal(); // inisialisasi saat halaman pertama dibuka

// ============================================================
//  BAGIAN 2: VALIDASI FORM
// ============================================================

function tandaiError(fieldId, pesan) {
  document.getElementById(fieldId).classList.add('invalid');
  document.getElementById('error-' + fieldId).textContent = pesan;
}

function hapusError(fieldId) {
  document.getElementById(fieldId).classList.remove('invalid');
  document.getElementById('error-' + fieldId).textContent = '';
}

function emailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Hapus error saat pengguna mulai mengetik ulang
[namaInput, emailInput].forEach(input => {
  input.addEventListener('input', () => hapusError(input.id));
});

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const nama  = namaInput.value.trim();
  const email = emailInput.value.trim();
  const tiket = parseInt(tiketInput.value, 10);

  // Reset semua error sebelum validasi ulang
  ['nama', 'email', 'tiket'].forEach(hapusError);

  let valid = true;

  if (!nama || nama.length < 2) {
    tandaiError('nama', nama ? 'Nama terlalu pendek (minimal 2 karakter).' : 'Nama lengkap wajib diisi.');
    valid = false;
  }

  if (!email) {
    tandaiError('email', 'Alamat email wajib diisi.');
    valid = false;
  } else if (!emailValid(email)) {
    tandaiError('email', 'Format email tidak valid. Contoh: nama@email.com');
    valid = false;
  }

  if (!valid) return;

  // Kirim data ke API, tampilkan hasil
  submitBtn.disabled  = true;
  submitBtn.innerHTML = '<span class="btn-text">Memproses...</span>';

  fetch('/api/daftar', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ nama, email, jumlahTiket: tiket }),
  })
    .then(res => res.json())
    .then(data => {
      if (!data.sukses) throw new Error(data.pesan);

      // Buka halaman e-tiket dengan data pendaftaran sebagai URL params
      const params = new URLSearchParams({
        kode:  data.kodeTiket,
        nama,
        tiket,
        email,
      });
      window.location.href = '/etiket.html?' + params.toString();
    })
    .catch(err => {
      // Kembalikan tombol ke kondisi normal agar pengguna bisa coba lagi
      submitBtn.disabled  = false;
      submitBtn.innerHTML = '<span class="btn-text">Beli Tiket</span><span class="btn-icon">→</span>';
      alert('Gagal mendaftar: ' + (err.message || 'Silakan coba lagi.'));
    });
});

// Tombol "Daftar Lagi" — kembalikan form ke kondisi awal
btnReset.addEventListener('click', () => {
  form.reset();
  tiketInput.value    = MIN_TIKET;
  submitBtn.disabled  = false;
  submitBtn.innerHTML = '<span class="btn-text">Beli Tiket</span><span class="btn-icon">→</span>';

  ['nama', 'email', 'tiket'].forEach(hapusError);
  perbaruiTotal();

  successBox.classList.remove('visible');
  form.style.display = '';
});
