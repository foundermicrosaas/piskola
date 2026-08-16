/* Halaman PRO (/pro):
   - Dibuka saat user (akun gratis) mengetuk game berlabel PRO di aplikasi.
   - Menjelaskan benefit PRO + harga Rp 47.000/tahun (metode bayar menyusul).
   - Jika akun sudah PRO → tampilkan status "sudah PRO" tanpa CTA pembelian. */
(function () {
  const $ = (s) => document.querySelector(s);

  function qs(name) {
    return new URLSearchParams(location.search).get(name) || '';
  }

  /* 6 game PRO (indeks 4–9) per kategori kurikulum */
  const PRO_GAMES = [
    { cat: '📖 Belajar Baca — Huruf', emoji: '🔠', items: [
      ['Urutan Huruf', '🔢'], ['Balon Huruf', '🎈'], ['Dengar & Tebak Kata', '👂'],
      ['Gambar & Kata', '🖼️'], ['Huruf Hilang', '🕵️'], ['Susun Kata', '🧩']
    ] },
    { cat: '📖 Belajar Baca — Suku Kata', emoji: '🧩', items: [
      ['Gambar & Kata', '🖼️'], ['Dengar & Tebak Kata', '👂'], ['Dengar & Pilih Kata', '🗣️'],
      ['Suku Kata Hilang', '🕵️'], ['Kartu Pasangan', '🃏'], ['Pasangkan Suku Kata', '🔗']
    ] },
    { cat: '🔢 Belajar Hitung — Angka', emoji: '🔢', items: [
      ['Kartu Pasangan', '🃏'], ['Dengar & Tebak Angka', '👂'], ['Pasangkan Angka', '🔗'],
      ['Lebih Besar atau Kecil?', '⚖️'], ['Susun Angka', '🧩'], ['Kuis Angka', '🏆']
    ] },
    { cat: '🔢 Belajar Hitung — Operasi', emoji: '➕', items: [
      ['Angka Hilang', '🕵️'], ['Susun Jawaban', '🧩'], ['Dengar & Hitung', '👂'],
      ['Hitung Maju / Mundur', '🚀'], ['Soal Cerita', '📖'], ['Kuis Campuran', '🏆']
    ] }
  ];

  function renderGames() {
    const list = $('#pro-game-list');
    list.innerHTML = PRO_GAMES.map(g =>
      '<div class="pro-game-cat">' + g.emoji + ' <b>' + g.cat + '</b></div>' +
      g.items.map(it =>
        '<div class="pro-game-item">' +
          '<span class="pgi-emoji">' + it[1] + '</span>' +
          '<span class="pgi-name">' + it[0] + '</span>' +
          '<span class="pgi-pro">PRO</span>' +
        '</div>'
      ).join('')
    ).join('');
  }

  function init() {
    const p = Store.getProfile();
    const title = qs('title');
    const nama = qs('nama');

    renderGames();

    // Catatan game yang sedang dicoba (dari aplikasi)
    const note = $('#pro-locked-note');
    if (title) {
      note.innerHTML = 'Kamu mencoba: <b>“' + title.replace(/</g, '&lt;') + '”</b> 🔒 — game ini termasuk paket PRO. Yuk buka semuanya!';
    } else {
      note.innerHTML = 'Akun gratis membuka <b>4 game pertama</b> di tiap unit. Jadi PRO untuk membuka <b>6 game sisanya</b> di semua unit!';
    }

    if (p && p.isPro) {
      // Sudah PRO → tampilkan status, sembunyikan CTA beli
      $('#pro-price').classList.add('hidden');
      const done = document.createElement('section');
      done.className = 'pro-done pro-section';
      done.innerHTML =
        '<div class="pro-hero-emoji">🎉</div>' +
        '<h2>' + (p.panggilan === 'kakak' ? 'Kakak' : 'Adek') + ' ' + p.nama + ' sudah PRO!</h2>' +
        '<p class="pro-note">Semua game di semua unit sudah terbuka. Selamat belajar!</p>' +
        '<div class="modal-actions" style="max-width:280px;margin:18px auto 0">' +
          '<a class="btn btn-primary" style="text-decoration:none;flex:1" href="../index.html">🚀 Main Sekarang</a>' +
        '</div>';
      $('#pro-hero').after(done);
      return;
    }

    // CTA pembelian memanggil Google Pay
    $('#btn-pro-cta').addEventListener('click', () => {
      if (window.PaymentSys) {
        PaymentSys.triggerPayment();
      } else {
        alert('Sistem pembayaran sedang dimuat. Silakan tunggu sebentar dan coba lagi.');
      }
    });
  }

  init();
})();
