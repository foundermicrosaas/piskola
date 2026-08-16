/* Logika aplikasi: kurikulum 9 unit × 10 game, login/register akun anak,
   sambutan per game, pengaturan, dan tautan ke halaman Admin (admin/). */
(function () {
  const $ = UI.$;
  const $$ = UI.$$;

  /* ==================== DATA KURIKULUM ==================== */

  const LETTER_GROUPS = [
    { label: 'A–I', chars: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'] },
    { label: 'J–R', chars: ['j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r'] },
    { label: 'S–Z', chars: ['s', 't', 'u', 'v', 'w', 'x', 'y', 'z'] }
  ];

  /* Perbanyak kata tiap suku kata (3 → 4–5) supaya soal & jawaban bervariasi
     dan anak tidak bosan dengan pertanyaan yang sama. Tanpa kata 'musik'. */
  const WORDS = {
    ba: [['baju', '👕'], ['balon', '🎈'], ['batu', '🪨'], ['bantal', '🛏️'], ['bangku', '🪑']],
    bi: [['biru', '🔵'], ['bintang', '⭐'], ['bibir', '👄'], ['biskuit', '🍪'], ['bibit', '🌱']],
    bu: [['buku', '📕'], ['burung', '🐦'], ['buah', '🍎'], ['bus', '🚌'], ['bumi', '🌍']],
    be: [['bebek', '🦆'], ['beras', '🍚'], ['bendera', '🚩'], ['benang', '🧵'], ['becak', '🛺']],
    bo: [['bola', '⚽'], ['boneka', '🧸'], ['botol', '🍼'], ['bolu', '🧁'], ['bohlam', '💡']],
    ma: [['mama', '👩'], ['mata', '👁️'], ['mangga', '🥭'], ['masjid', '🕌'], ['macan', '🐯']],
    mi: [['minum', '🥤'], ['mic', '🎤'], ['mie', '🍜'], ['mimpi', '💭']],
    mu: [['mutiara', '🦪'], ['mulut', '👄'], ['murid', '🧑‍🎓'], ['museum', '🏛️']],
    me: [['melon', '🍈'], ['merah', '❤️'], ['mentega', '🧈'], ['melati', '🌼'], ['mentimun', '🥒']],
    mo: [['mobil', '🚗'], ['motor', '🏍️'], ['monyet', '🐒'], ['mop', '🧹']],
    ka: [['kambing', '🐐'], ['kapal', '🚢'], ['katak', '🐸'], ['kaca', '🪞'], ['kartu', '🃏']],
    ki: [['kipas', '🪭'], ['kijang', '🦌'], ['kiri', '⬅️'], ['kiwi', '🥝']],
    ku: [['kucing', '🐱'], ['kursi', '🪑'], ['kue', '🍰'], ['kuda', '🐴']],
    ke: [['kereta', '🚂'], ['kertas', '📄'], ['kelinci', '🐰'], ['kepiting', '🦀'], ['kemeja', '👔']],
    ko: [['koki', '👨‍🍳'], ['kotak', '📦'], ['kompor', '🍳'], ['kopi', '☕'], ['koper', '🧳']]
  };

  /* Kamus kata rata (untuk game kuis/susun/hilang di unit huruf) */
  const WORDS_FLAT = [];
  Object.keys(WORDS).forEach(syl => {
    WORDS[syl].forEach(([word, emoji]) => WORDS_FLAT.push({ word, emoji, syl }));
  });

  const HURUF_GAMES = [
    { id: 'tebak', type: 'tebak', title: 'Tebak Huruf', emoji: '🔊', desc: 'Dengar bunyi huruf, lalu pilih huruf yang benar.' },
    { id: 'tracing', type: 'tracing', title: 'Tebak Bentuk Huruf', emoji: '✏️', desc: 'Ikuti garis putus-putus bentuk huruf dengan jarimu.' },
    { id: 'pasangan', type: 'pasangan', title: 'Pasangan Huruf', emoji: '🔗', desc: 'Hubungkan huruf besar dengan huruf kecilnya.' },
    { id: 'memory', type: 'memory', title: 'Kartu Pasangan', emoji: '🃏', desc: 'Buka kartu dan temukan pasangan hurufnya.' },
    { id: 'urutan', type: 'urutan', title: 'Urutan Huruf', emoji: '🔢', desc: 'Huruf mana yang hilang di urutan ini?' },
    { id: 'balon', type: 'balon', title: 'Balon Huruf', emoji: '🎈', desc: 'Pecahkan balon yang hurufnya benar.' },
    { id: 'kuis-sound2pic', type: 'kuis', mode: 'sound2pic', title: 'Dengar & Tebak Kata', emoji: '👂', desc: 'Dengar kata, lalu pilih gambarnya.' },
    { id: 'kuis-pic2word', type: 'kuis', mode: 'pic2word', title: 'Gambar & Kata', emoji: '🖼️', desc: 'Lihat gambar, pilih tulisan katanya.' },
    { id: 'hilang', type: 'hilang', title: 'Huruf Hilang', emoji: '🕵️', desc: 'Huruf mana yang hilang dari kata ini?' },
    { id: 'susun', type: 'susun', title: 'Susun Kata', emoji: '🧩', desc: 'Susun huruf-hurufnya jadi kata yang benar.' }
  ];

  const SUKU_GAMES = [
    { id: 'sambung', type: 'sambung', title: 'Sambung Huruf', emoji: '🔗', desc: 'Tarik garis dari b ke a, jadilah suku kata!' },
    { id: 'tebak', type: 'tebak', title: 'Tebak Suku Kata', emoji: '🎧', desc: 'Dengar suku kata, lalu pilih yang benar.' },
    { id: 'susun', type: 'susun', title: 'Susun Kata', emoji: '🧩', desc: 'Susun suku kata jadi kata yang benar.' },
    { id: 'balon', type: 'balon', title: 'Balon Suku Kata', emoji: '🎈', desc: 'Pecahkan balon suku kata yang benar.' },
    { id: 'kuis-pic2word', type: 'kuis', mode: 'pic2word', title: 'Gambar & Kata', emoji: '🖼️', desc: 'Lihat gambar, pilih tulisan katanya.' },
    { id: 'kuis-sound2pic', type: 'kuis', mode: 'sound2pic', title: 'Dengar & Tebak Kata', emoji: '👂', desc: 'Dengar kata, lalu pilih gambarnya.' },
    { id: 'kuis-sound2word', type: 'kuis', mode: 'sound2word', title: 'Dengar & Pilih Kata', emoji: '🗣️', desc: 'Dengar kata, pilih tulisan yang benar.' },
    { id: 'hilang', type: 'hilang', title: 'Suku Kata Hilang', emoji: '🕵️', desc: 'Suku kata mana yang hilang dari kata ini?' },
    { id: 'memory', type: 'memory', title: 'Kartu Pasangan', emoji: '🃏', desc: 'Temukan pasangan suku kata dan gambarnya.' },
    { id: 'pasangan', type: 'pasangan', title: 'Pasangkan Suku Kata', emoji: '🔗', desc: 'Hubungkan suku kata dengan gambarnya.' }
  ];

  const SYL_GROUPS = [
    { label: 'b', syllables: ['ba', 'bi', 'bu', 'be', 'bo'] },
    { label: 'm', syllables: ['ma', 'mi', 'mu', 'me', 'mo'] },
    { label: 'k', syllables: ['ka', 'ki', 'ku', 'ke', 'ko'] }
  ];

  const UNITS = [];
  /* Urutan unit dibuat berurutan secara numerik (Unit 1–3 kapital, 4–6 kecil),
     bukan berselang-seling — dulu tampil 1, 4, 2, 5, 3, 6 karena mengikuti
     urutan huruf besar/kecil tiap kelompok. */
  LETTER_GROUPS.forEach((g, gi) => {
    const upper = g.chars.map(c => c.toUpperCase());
    UNITS.push({
      id: 'kapital-' + (gi + 1),
      title: 'Unit ' + (gi + 1) + ' — Huruf Kapital ' + g.label,
      emoji: '🔠',
      desc: 'Kenali nama, bunyi, dan bentuk huruf kapital ' + upper.join(', ') + '.',
      kind: 'huruf', letterCase: 'upper', letters: upper,
      games: HURUF_GAMES
    });
  });
  LETTER_GROUPS.forEach((g, gi) => {
    UNITS.push({
      id: 'kecil-' + (gi + 1),
      title: 'Unit ' + (gi + 4) + ' — Huruf Kecil ' + g.label.toLowerCase(),
      emoji: '🔡',
      desc: 'Kenali nama, bunyi, dan bentuk huruf kecil ' + g.chars.join(', ') + '.',
      kind: 'huruf', letterCase: 'lower', letters: g.chars,
      games: HURUF_GAMES
    });
  });
  SYL_GROUPS.forEach((g, gi) => {
    UNITS.push({
      id: 'suku-' + g.label,
      title: 'Unit ' + (7 + gi) + ' — Suku Kata ' + g.label,
      emoji: '🧩',
      desc: 'Sambungkan huruf, eja, dan susun suku kata ' + g.syllables.join(', ') + ' jadi kata.',
      kind: 'suku', syllables: g.syllables,
      games: SUKU_GAMES
    });
  });

  /* ==================== KURIKULUM BELAJAR HITUNG ====================
     Dua kategori: mengenal angka (kind:'angka') dan operasi hitung
     (kind:'op'). Setiap unit punya 10 game; 4 pertama gratis, sisanya PRO.
     Level kesulitan dipisah: Mudah → Sedang → Sulit (Kelas 1 → 3). */

  const MATH_GAMES_ANGKA = [
    { id: 'm-count', type: 'math', mode: 'count', title: 'Hitung Benda', emoji: '🍎', desc: 'Hitung ada berapa benda, lalu pilih angkanya.' },
    { id: 'm-tebak', type: 'math', mode: 'quiz', quizType: 'word2num', title: 'Tebak Angka', emoji: '🔢', desc: 'Baca kata angkanya, pilih angka yang benar.' },
    { id: 'm-urutan', type: 'math', mode: 'order', title: 'Urutan Angka', emoji: '➡️', desc: 'Angka mana yang hilang di urutan ini?' },
    { id: 'm-balon', type: 'math', mode: 'balloon', title: 'Balon Angka', emoji: '🎈', desc: 'Pecahkan balon yang angkanya benar.' },
    { id: 'm-memory', type: 'math', mode: 'memory', title: 'Kartu Pasangan', emoji: '🃏', desc: 'Cocokkan angka dengan kata-katanya.' },
    { id: 'm-dengar', type: 'math', mode: 'listen', title: 'Dengar & Tebak Angka', emoji: '👂', desc: 'Dengar angkanya, lalu pilih yang benar.' },
    { id: 'm-pasang', type: 'math', mode: 'pair', title: 'Pasangkan Angka', emoji: '🔗', desc: 'Hubungkan angka dengan tulisan katanya.' },
    { id: 'm-banding', type: 'math', mode: 'compare', title: 'Lebih Besar atau Kecil?', emoji: '⚖️', desc: 'Pilih angka yang lebih besar.' },
    { id: 'm-susun', type: 'math', mode: 'build', title: 'Susun Angka', emoji: '🧩', desc: 'Dengar kata angkanya, susun angkanya.' },
    { id: 'm-kuis', type: 'math', mode: 'quiz', quizType: 'mix', title: 'Kuis Angka', emoji: '🏆', desc: 'Kuis seru mengenal angka dengan berbagai cara.' }
  ];

  function opGames(op) {
    const isMul = op === '×' || op === '÷';
    const skipTitle = op === '+' ? 'Hitung Maju' : op === '-' ? 'Hitung Mundur' : 'Hitung Melompat';
    const skipDesc = op === '+'
      ? 'Lanjutkan hitungan majunya!'
      : op === '-' ? 'Lanjutkan hitungan mundurnya!' : 'Lanjutkan hitungan melompatnya!';
    const opName = op === '+' ? 'penjumlahan' : op === '-' ? 'pengurangan' : op === '×' ? 'perkalian' : 'pembagian';
    const game7 = isMul
      ? { id: 'm-tabel', type: 'math', mode: 'table', title: op === '×' ? 'Tabel Perkalian' : 'Tabel Pembagian', emoji: '📊', desc: 'Lengkapi tabel ' + opName + 'nya.' }
      : { id: 'm-skip', type: 'math', mode: 'skip', title: skipTitle, emoji: '🚀', desc: skipDesc };
    return [
      { id: 'm-quiz', type: 'math', mode: 'quiz', quizType: 'op', title: 'Kuis Hitung', emoji: '🧠', desc: 'Hitung soal ' + opName + ', pilih jawabannya.' },
      { id: 'm-balon', type: 'math', mode: 'balloon', title: 'Balon Jawaban', emoji: '🎈', desc: 'Pecahkan balon yang jawabannya benar.' },
      { id: 'm-memory', type: 'math', mode: 'memory', title: 'Kartu Pasangan', emoji: '🃏', desc: 'Cocokkan soal dengan jawabannya.' },
      { id: 'm-pasang', type: 'math', mode: 'pair', title: 'Pasangkan Soal & Jawaban', emoji: '🔗', desc: 'Hubungkan soal dengan jawabannya.' },
      { id: 'm-hilang', type: 'math', mode: 'missing', title: 'Angka Hilang', emoji: '🕵️', desc: 'Angka apa yang hilang dari soal ini?' },
      { id: 'm-susun', type: 'math', mode: 'build', title: 'Susun Jawaban', emoji: '🧩', desc: 'Susun angka jawaban dengan benar.' },
      { id: 'm-dengar', type: 'math', mode: 'listen', title: 'Dengar & Hitung', emoji: '👂', desc: 'Dengar soalnya, lalu pilih jawaban.' },
      game7,
      { id: 'm-cerita', type: 'math', mode: 'story', title: 'Soal Cerita', emoji: '📖', desc: 'Baca ceritanya, lalu hitung jawabannya.' },
      { id: 'm-campur', type: 'math', mode: 'quiz', quizType: 'op-rev', title: 'Kuis Campuran', emoji: '🏆', desc: 'Soal ' + opName + ' dalam berbagai bentuk.' }
    ];
  }

  const MATH_UNITS = [
    { id: 'h-angka', title: 'Hitung 1 — Mengenal Angka 0–10', emoji: '🔢', level: 'Mudah', kelas: 'Kelas 1',
      desc: 'Kenali angka 0 sampai 10: hitung benda, baca kata angkanya, dan urutkan.',
      kind: 'angka', range: [0, 10], games: MATH_GAMES_ANGKA },
    { id: 'h-angka2', title: 'Hitung 2 — Angka 11–20', emoji: '🔟', level: 'Sedang', kelas: 'Kelas 1',
      desc: 'Kenali angka 11 sampai 20 dan cara membacanya.',
      kind: 'angka', range: [11, 20], games: MATH_GAMES_ANGKA },
    { id: 'h-tambah1', title: 'Hitung 3 — Penjumlahan sampai 10', emoji: '➕', level: 'Mudah', kelas: 'Kelas 1',
      desc: 'Jumlahkan dua angka, hasilnya sampai 10.',
      kind: 'op', op: '+', max: 10, games: opGames('+') },
    { id: 'h-tambah2', title: 'Hitung 4 — Penjumlahan sampai 20', emoji: '➕', level: 'Sedang', kelas: 'Kelas 1–2',
      desc: 'Penjumlahan dengan hasil sampai 20.',
      kind: 'op', op: '+', max: 20, games: opGames('+') },
    { id: 'h-kurang1', title: 'Hitung 5 — Pengurangan sampai 10', emoji: '➖', level: 'Mudah', kelas: 'Kelas 1',
      desc: 'Kurangi dua angka, hasilnya sampai 10.',
      kind: 'op', op: '-', max: 10, games: opGames('-') },
    { id: 'h-kurang2', title: 'Hitung 6 — Pengurangan sampai 20', emoji: '➖', level: 'Sedang', kelas: 'Kelas 1–2',
      desc: 'Pengurangan dengan angka sampai 20.',
      kind: 'op', op: '-', max: 20, games: opGames('-') },
    { id: 'h-kali1', title: 'Hitung 7 — Perkalian 1–5', emoji: '✖️', level: 'Sedang', kelas: 'Kelas 2',
      desc: 'Tabel perkalian 1 sampai 5.',
      kind: 'op', op: '×', tableMax: 5, games: opGames('×') },
    { id: 'h-kali2', title: 'Hitung 8 — Perkalian 6–10', emoji: '✖️', level: 'Sulit', kelas: 'Kelas 2–3',
      desc: 'Tabel perkalian 6 sampai 10.',
      kind: 'op', op: '×', tableMax: 10, games: opGames('×') },
    { id: 'h-bagi1', title: 'Hitung 9 — Pembagian 1–5', emoji: '➗', level: 'Sedang', kelas: 'Kelas 2',
      desc: 'Bagi bilangan dengan pembagi 1 sampai 5.',
      kind: 'op', op: '÷', tableMax: 5, games: opGames('÷') },
    { id: 'h-bagi2', title: 'Hitung 10 — Pembagian 6–10', emoji: '➗', level: 'Sulit', kelas: 'Kelas 3',
      desc: 'Pembagian dengan pembagi 6 sampai 10.',
      kind: 'op', op: '÷', tableMax: 10, games: opGames('÷') }
  ];

  /* Jumlah game gratis per unit untuk akun non-PRO (sisanya berlabel PRO) */
  const FREE_GAMES = 4;

  /* ==================== HELPERS ==================== */

  function profile() { return Store.getProfile(); }
  function panggilanLabel(p) { return p.panggilan === 'kakak' ? 'Kakak' : 'Adek'; }

  const WELCOME = {
    'tebak-huruf': 'Yuk kita belajar menebak huruf',
    'tebak-suku': 'Yuk kita belajar suku kata',
    tracing: 'Yuk kita belajar bentuk huruf',
    sambung: 'Yuk kita sambungkan huruf jadi suku kata',
    pasangan: 'Yuk kita pasangkan yang cocok',
    memory: 'Yuk kita cari pasangan kartunya',
    urutan: 'Yuk kita urutkan hurufnya',
    balon: 'Yuk kita pecahkan balon yang benar',
    'kuis-sound2pic': 'Yuk kita tebak kata dari suaranya',
    'kuis-pic2word': 'Yuk kita tebak tulisan katanya',
    'kuis-sound2word': 'Yuk kita dengarkan dan pilih kata yang benar',
    hilang: 'Yuk kita isi yang hilang',
    susun: 'Yuk kita susun huruf jadi kata',
    /* belajar hitung (kunci = mode game matematika) */
    count: 'Yuk kita belajar menghitung',
    quiz: 'Yuk kita jawab soal hitungannya',
    order: 'Yuk kita urutkan angkanya',
    balloon: 'Yuk kita pecahkan balon yang benar',
    memory: 'Yuk kita cari pasangan kartunya',
    pair: 'Yuk kita pasangkan yang cocok',
    missing: 'Yuk kita isi angka yang hilang',
    build: 'Yuk kita susun angka jawabannya',
    listen: 'Yuk kita dengarkan dan pilih jawabannya',
    table: 'Yuk kita lengkapi tabelnya',
    skip: 'Yuk kita lanjutkan hitungannya',
    compare: 'Yuk kita bandingkan angkanya',
    story: 'Yuk kita baca soal ceritanya'
  };

  function starRow(n) {
    return [1, 2, 3].map(i => '<span class="star ' + (i <= n ? 'on' : '') + '">⭐</span>').join('');
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ==================== LOGIN & REGISTER ==================== */

  let loginSel = null;
  let regDraft = { panggilan: null, avatar: null };

  function goLogin() {
    renderLogin();
    UI.showScreen('login');
  }

  function renderLogin() {
    const list = $('#login-accounts');
    const profiles = Store.getProfiles();
    loginSel = null;
    $('#login-pin-row').classList.add('hidden');
    $('#login-error').textContent = '';
    $('#login-pin').value = '';

    list.innerHTML = profiles.length
      ? profiles.map(pr =>
          '<button class="account-row" data-lid="' + pr.id + '">' +
            '<span class="account-avatar">' + pr.avatar + '</span>' +
            '<span class="account-name">' + pr.nama + '</span>' +
            '<span class="account-tag">' + panggilanLabel(pr) + '</span>' +
          '</button>'
        ).join('')
      : '<p class="empty">Belum ada akun. Yuk daftarkan anak dulu! 🐣</p>';

    $$('.account-row').forEach(row => {
      row.addEventListener('click', () => {
        $$('.account-row').forEach(r => r.classList.remove('selected'));
        row.classList.add('selected');
        loginSel = row.dataset.lid;
        AudioSys.sfx.tap();
        $('#login-pin-row').classList.remove('hidden');
        $('#login-pin').focus();
      });
    });
  }

  function doLogin() {
    const pr = Store.getProfiles().find(x => x.id === loginSel);
    const pin = $('#login-pin').value.trim();
    if (!pr) { $('#login-error').textContent = 'Pilih akun dulu ya!'; return; }
    if (pin.length !== 4) { $('#login-error').textContent = 'PIN harus 4 angka.'; return; }
    if (pin !== pr.pin) {
      $('#login-error').textContent = 'PIN salah, coba lagi ya!';
      AudioSys.sfx.wrong();
      return;
    }
    Store.setActive(pr.id);
    AudioSys.sfx.fanfare();
    goHome();
    AudioSys.greet(profile());
    AudioSys.prewarm(AudioSys.greetText(profile())); // siapkan sapaan tanpa kredit lagi
  }

  function goRegister() {
    regDraft = { panggilan: null, avatar: null };
    $('#reg-name').value = '';
    $('#reg-pin').value = '';
    $('#reg-pin2').value = '';
    $('#reg-error').textContent = '';
    $$('[data-reg-pg]').forEach(b => b.classList.remove('selected'));
    $$('[data-reg-av]').forEach(b => b.classList.remove('selected'));
    UI.showScreen('register');
    setTimeout(() => $('#reg-name').focus(), 250);
  }

  function doRegister() {
    const nama = $('#reg-name').value.trim();
    const pin = $('#reg-pin').value.trim();
    const pin2 = $('#reg-pin2').value.trim();
    if (!nama) { $('#reg-error').textContent = 'Tulis nama anak dulu ya!'; return; }
    if (!regDraft.panggilan) { $('#reg-error').textContent = 'Pilih panggilan (Kakak/Adek).'; return; }
    if (!regDraft.avatar) { $('#reg-error').textContent = 'Pilih avatar kesukaanmu.'; return; }
    if (pin.length !== 4) { $('#reg-error').textContent = 'PIN harus 4 angka.'; return; }
    if (pin !== pin2) { $('#reg-error').textContent = 'PIN dan ulangan PIN tidak sama.'; return; }
    if (Store.getProfiles().some(p => p.nama.toLowerCase() === nama.toLowerCase())) {
      $('#reg-error').textContent = 'Nama ini sudah terdaftar. Coba nama lain ya!';
      return;
    }
    Store.addProfile({ nama, panggilan: regDraft.panggilan, avatar: regDraft.avatar, pin });
    AudioSys.sfx.fanfare();
    goHome();
    AudioSys.greet(profile());
    AudioSys.prewarm(AudioSys.greetText(profile())); // sapaan nama dibuat SEKALI di awal, lalu dipakai ulang
  }

  function wireLogin() {
    $('#btn-start').addEventListener('click', () => {
      AudioSys.sfx.tap();
      if (Store.getProfile()) goHome();
      else goLogin();
    });
    $('#btn-to-register').addEventListener('click', () => { AudioSys.sfx.tap(); goRegister(); });
    $('#btn-login-go').addEventListener('click', doLogin);
    $('#login-pin').addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });

    $('#btn-register').addEventListener('click', doRegister);
    $('#btn-register-back').addEventListener('click', () => { AudioSys.sfx.tap(); goLogin(); });
    $('#reg-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#reg-pin').focus(); });

    $$('[data-reg-pg]').forEach(b => b.addEventListener('click', () => {
      $$('[data-reg-pg]').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      regDraft.panggilan = b.dataset.regPg;
      AudioSys.sfx.tap();
    }));
    $$('[data-reg-av]').forEach(b => b.addEventListener('click', () => {
      $$('[data-reg-av]').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      regDraft.avatar = b.dataset.regAv;
      AudioSys.sfx.tap();
    }));
  }

  /* ==================== HOME ==================== */

  let homeTab = 'baca'; // 'baca' | 'hitung'

  function goHome() { renderHome(); UI.showScreen('home'); }

  function renderHome() {
    const p = profile();
    if (!p) { goLogin(); return; }
    $('#greeting-emoji').textContent = p.avatar;
    $('#greeting-text').textContent = 'Halo, ' + panggilanLabel(p) + ' ' + p.nama + '!';
    $('#greeting-sub').textContent = homeTab === 'hitung' ? 'Ayo belajar berhitung!' : 'Ayo belajar membaca!';
    $('#section-title').textContent = homeTab === 'hitung' ? '🔢 Peta Belajar Hitung' : '📚 Peta Belajar Membaca';

    const units = homeTab === 'hitung' ? MATH_UNITS : UNITS;
    $('#unit-list').innerHTML = units.map(unit => {
      const prog = Store.getProgress();
      const up = prog[unit.id] || {};
      const gamesDone = unit.games.filter(g => up[g.id]).length;
      const stars = unit.games.reduce((s, g) => s + ((up[g.id] || {}).stars || 0), 0);
      const levelTag = unit.level ? '<span class="unit-level ' + unit.level.toLowerCase() + '">' + unit.level + '</span>' : '';
      return (
        '<button class="unit-card" data-unit="' + unit.id + '">' +
          '<span class="unit-emoji">' + unit.emoji + '</span>' +
          '<span class="unit-info">' +
            '<h3>' + unit.title + '</h3>' +
            '<p>' + unit.desc + '</p>' +
          '</span>' +
          '<span class="unit-meta">' + levelTag + '<span>' + gamesDone + '/' + unit.games.length + ' • ⭐' + stars + '</span></span>' +
        '</button>'
      );
    }).join('');

    $$('.unit-card').forEach(card => card.addEventListener('click', () => openUnit(card.dataset.unit)));

    // Banner ajakan PRO untuk akun gratis (mendorong konversi)
    const banner = $('#pro-banner');
    const isPro = !!(p.isPro);
    banner.classList.toggle('hidden', isPro);
    if (!isPro) {
      banner.innerHTML =
        '<div class="pro-banner">' +
          '<div class="pro-banner-info">' +
            '<span class="pro-banner-emoji">⭐</span>' +
            '<div><b>Jadikan PRO</b><span>Buka semua game belajar — Baca & Hitung!</span></div>' +
          '</div>' +
          '<button class="btn btn-primary sm" id="btn-go-pro">Lihat ▶</button>' +
        '</div>';
      $('#btn-go-pro').addEventListener('click', () => { AudioSys.sfx.tap(); location.href = 'pro/index.html'; });
    }
  }

  /* ==================== UNIT ==================== */

  function openUnit(unitId) {
    const unit = UNITS.concat(MATH_UNITS).find(u => u.id === unitId);
    if (!unit) return;
    $('#unit-title').textContent = unit.title + (unit.kelas ? ' • ' + unit.kelas : '');

    const isPro = !!(profile() && profile().isPro);

    $('#game-list').innerHTML = unit.games.map((g, idx) => {
      const prog = Store.getGameProgress(unit.id, g.id);
      const stars = prog ? prog.stars : 0;
      const locked = !isPro && idx >= FREE_GAMES; // akun gratis: 4 game pertama saja
      if (locked) {
        return (
          '<div class="game-card locked" data-locked="1" data-game="' + g.id + '">' +
            '<span class="game-emoji dim">' + g.emoji + '</span>' +
            '<div class="game-info">' +
              '<h3>' + g.title + ' <span class="pro-badge">⭐ PRO</span></h3>' +
              '<p>' + g.desc + '</p>' +
              '<span class="locked-note">🔒 Khusus member PRO</span>' +
            '</div>' +
            '<span class="lock-ico">🔒</span>' +
          '</div>'
        );
      }
      return (
        '<div class="game-card">' +
          '<span class="game-emoji">' + g.emoji + '</span>' +
          '<div class="game-info">' +
            '<h3>' + g.title + '</h3>' +
            '<p>' + g.desc + '</p>' +
            '<span class="star-row">' + starRow(stars) + '</span>' +
          '</div>' +
          '<button class="btn btn-primary btn-play" data-game="' + g.id + '">Main ▶</button>' +
        '</div>'
      );
    }).join('');

    $$('.btn-play').forEach(btn => {
      btn.addEventListener('click', () => {
        const g = unit.games.find(x => x.id === btn.dataset.game);
        startGame(unit, g);
      });
    });

    /* Game terkunci → arahkan ke halaman PRO (konversi) */
    $$('.game-card.locked').forEach(card => {
      card.addEventListener('click', () => {
        AudioSys.sfx.tap();
        const g = unit.games.find(x => x.id === card.dataset.game);
        const p = profile();
        location.href = 'pro/index.html?unit=' + encodeURIComponent(unit.id) +
          '&game=' + encodeURIComponent(g.id) +
          '&title=' + encodeURIComponent(g.title) +
          '&nama=' + encodeURIComponent(p ? p.nama : '');
      });
    });

    UI.showScreen('unit');
  }

  /* ==================== GAME ==================== */

  function startGame(unit, game) {
    $('#game-title').textContent = game.title;
    $('#game-progress').textContent = '';
    $('#game-overlay').classList.add('hidden');
    UI.showScreen('game');
    AudioSys.sfx.tap();

    // Beri tahu audio sedang belajar apa (baca/hitung) → pujian & sapaan relevan
    AudioSys.setSubject(game.type === 'math' ? 'hitung' : 'baca');

    // Sambutan interaktif: "Yuk kita ..., {panggilan + nama} siap ya!"
    const welcomeKey = game.type === 'math'
      ? game.mode
      : (game.id === 'tebak' ? (unit.kind === 'suku' ? 'tebak-suku' : 'tebak-huruf') : game.id);
    AudioSys.gameWelcome(profile(), WELCOME[welcomeKey] || 'Yuk kita main ' + game.title.toLowerCase());

    const onDone = (res) => {
      Store.setGameProgress(unit.id, game.id, res);
      showResult(unit, game.id, res);
    };
    const common = { profile: profile(), onDone };

    switch (game.type) {
      case 'tebak':
        GameTebak.start({
          items: unit.kind === 'huruf' ? unit.letters : unit.syllables,
          display: unit.kind === 'huruf' ? unit.letterCase : 'raw',
          ...common
        });
        break;
      case 'tracing':
        GameTracing.start({ letters: unit.letters, letterCase: unit.letterCase, ...common });
        break;
      case 'sambung':
        GameSambung.start({ syllables: unit.syllables, words: WORDS, ...common });
        break;
      case 'pasangan':
        GamePasangan.start({
          mode: unit.kind === 'suku' ? 'suku' : 'case',
          letterCase: unit.letterCase, letters: unit.letters,
          syllables: unit.syllables, words: WORDS, ...common
        });
        break;
      case 'memory':
        GameMemory.start({
          mode: unit.kind === 'suku' ? 'suku' : 'case',
          letterCase: unit.letterCase, letters: unit.letters,
          syllables: unit.syllables, words: WORDS, ...common
        });
        break;
      case 'urutan':
        GameUrutan.start({ letters: unit.letters, letterCase: unit.letterCase, ...common });
        break;
      case 'balon':
        GameBalon.start({
          items: unit.kind === 'huruf' ? unit.letters : unit.syllables,
          display: unit.kind === 'huruf' ? unit.letterCase : 'raw',
          ...common
        });
        break;
      case 'kuis':
        GameKuis.start({
          mode: game.mode,
          pool: unit.kind === 'suku' ? WORDS_FLAT.filter(w => unit.syllables.includes(w.syl)) : WORDS_FLAT,
          ...common
        });
        break;
      case 'hilang':
        GameHilang.start({
          mode: unit.kind === 'suku' ? 'suku' : 'huruf',
          letterCase: unit.letterCase, letters: unit.letters,
          syllables: unit.syllables, pool: WORDS_FLAT, ...common
        });
        break;
      case 'susun':
        GameSusun.start({
          mode: unit.kind === 'suku' ? 'suku' : 'huruf',
          letterCase: unit.letterCase,
          pool: unit.kind === 'suku' ? WORDS_FLAT.filter(w => unit.syllables.includes(w.syl)) : WORDS_FLAT,
          ...common
        });
        break;
      case 'math':
        GameMath.start({
          unit,
          mode: game.mode,
          quizType: game.quizType,
          profile: profile(),
          onDone
        });
        break;
    }
  }

  function showResult(unit, gameId, res) {
    const p = profile();
    const game = unit.games.find(x => x.id === gameId);
    const title = game ? game.title : 'Belajar';
    const overlay = $('#game-overlay');
    overlay.innerHTML =
      '<div class="result-card">' +
        '<div class="result-emoji">🎉</div>' +
        '<h3>Selamat ' + (p ? p.panggilan + ' ' + p.nama : '') + '!</h3>' +
        '<p class="result-sub">Menyelesaikan belajar ' + title + '</p>' +
        '<div class="star-row big">' + starRow(res.stars) + '</div>' +
        '<p class="result-acc">Akurasi: ' + res.accuracy + '%</p>' +
        '<div class="result-actions">' +
          '<button class="btn btn-secondary" id="btn-result-replay">🔁 Main Lagi</button>' +
          '<button class="btn btn-share" id="btn-result-share">📤 Bagikan</button>' +
          '<button class="btn btn-primary" id="btn-result-back">Kembali</button>' +
        '</div>' +
        '<div class="share-panel hidden" id="share-panel"></div>' +
      '</div>';
    overlay.classList.remove('hidden');
    AudioSys.sfx.fanfare();
    AudioSys.praiseGame(p, res.stars);

    $('#btn-result-replay').addEventListener('click', () => {
      overlay.classList.add('hidden');
      startGame(unit, game);
    });
    $('#btn-result-back').addEventListener('click', () => {
      overlay.classList.add('hidden');
      openUnit(unit.id);
    });
    $('#btn-result-share').addEventListener('click', () => {
      AudioSys.sfx.tap();
      openSharePanel(p, title, res);
    });
  }

  /* ==================== BAGIKAN HASIL BELAJAR ====================
     Kartu hasil digambar ke canvas (PNG), lalu dibagikan sebagai GAMBAR
     lewat Web Share API — pengguna memilih WhatsApp / WA Status /
     Facebook Story / Facebook Post di menu berbagi perangkat. */

  const SHARE_TEXT = {
    wa: (p, title, res) => 'Aku dapat ⭐' + res.stars + ' di game "' + title + '" (akurasi ' + res.accuracy + '%)! Ayo belajar sambil bermain! 📚',
    wastatus: (p, title, res) => 'Aku dapat ⭐' + res.stars + ' di "' + title + '"! 🎉 #BelajarSeru',
    fbstory: (p, title, res) => 'Aku dapat ⭐' + res.stars + ' di "' + title + '" (akurasi ' + res.accuracy + '%)! Yuk main juga! 📚✨',
    fbpost: (p, title, res) => 'Halo! Aku baru saja menyelesaikan belajar "' + title + '" dengan ⭐' + res.stars + ' dan akurasi ' + res.accuracy + '%! Belajar sambil bermain itu seru banget. Yuk gabung! 📚😊'
  };

  let shareCardCache = null; // { url, blob } — gambar kartu hasil belajar

  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawShareCard(ctx, W, H, p, title, res) {
    const F = '"Baloo 2", "Comic Sans MS", sans-serif';
    // Latar gradasi ceria
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#FFD86B');
    g.addColorStop(0.5, '#FF9A8B');
    g.addColorStop(1, '#F977CE');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // Bola-bola dekoratif
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#fff';
    [[150, 220, 160], [900, 180, 120], [120, 1150, 200], [980, 1200, 150], [540, 210, 70], [60, 700, 60], [1020, 680, 70]].forEach(([x, y, r]) => {
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    // Kartu putih
    roundRectPath(ctx, 80, 150, W - 160, H - 260, 60);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    roundRectPath(ctx, 80, 150, W - 160, 26, 60);
    ctx.fillStyle = '#FFD23F';
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    // Avatar
    ctx.font = '170px serif';
    ctx.fillText(p.avatar, W / 2, 470);
    // Nama
    ctx.fillStyle = '#2d2a3e';
    ctx.font = '800 84px ' + F;
    ctx.fillText(panggilanLabel(p) + ' ' + p.nama, W / 2, 630);
    // Sub judul
    ctx.fillStyle = '#8a7a99';
    ctx.font = '46px ' + F;
    ctx.fillText('Menyelesaikan belajar', W / 2, 730);
    ctx.fillStyle = '#3b82f6';
    ctx.font = '700 62px ' + F;
    ctx.fillText(title, W / 2, 820);
    // Bintang
    ctx.font = '150px serif';
    for (let i = 0; i < 3; i++) ctx.fillText(i < res.stars ? '⭐' : '☆', W / 2 - 200 + i * 200, 1000);
    // Akurasi
    ctx.fillStyle = '#2d2a3e';
    ctx.font = '800 62px ' + F;
    ctx.fillText('Akurasi ' + res.accuracy + '%', W / 2, 1130);
    // Footer
    ctx.fillStyle = '#7a5cff';
    ctx.font = '52px ' + F;
    ctx.fillText('Piskola — Ayo belajar sambil bermain! 📚✨', W / 2, 1240);
  }

  async function buildShareCard(p, title, res) {
    const W = 1080, H = 1350;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    try { await document.fonts.ready; } catch (e) { /* lanjut */ }
    drawShareCard(ctx, W, H, p, title, res);
    const url = cv.toDataURL('image/png');
    const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
    shareCardCache = { url, blob: blob || url };
    return url;
  }

  function openSharePanel(p, title, res) {
    const panel = $('#share-panel');
    panel.classList.remove('hidden');
    panel.innerHTML =
      '<p class="share-title">Bagikan hasil belajarnya! 📤</p>' +
      '<img class="share-preview" id="share-preview" alt="Kartu hasil belajar">' +
      '<div class="share-options">' +
        '<button class="share-opt" data-target="wa"><span>💬</span>WhatsApp</button>' +
        '<button class="share-opt" data-target="wastatus"><span>🟢</span>WA Status</button>' +
        '<button class="share-opt" data-target="fbstory"><span>📘</span>FB Story</button>' +
        '<button class="share-opt" data-target="fbpost"><span>📝</span>FB Post</button>' +
      '</div>' +
      '<p class="share-note">Pilih aplikasinya di menu berbagi yang muncul, ya!</p>';

    buildShareCard(p, title, res).then(url => {
      const img = $('#share-preview');
      if (img) img.src = url;
    }).catch(() => { /* preview gagal — tombol tetap bisa dipakai */ });

    panel.querySelectorAll('.share-opt').forEach(b =>
      b.addEventListener('click', () => doShare(b.dataset.target, p, title, res))
    );
  }

  async function doShare(target, p, title, res) {
    if (!shareCardCache) await buildShareCard(p, title, res);
    const text = SHARE_TEXT[target](p, title, res);
    const file = new File([shareCardCache.blob], 'hasil-belajar-' + p.nama + '.png', { type: 'image/png' });
    const nav = navigator;
    try {
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: 'Hasil Belajar — ' + p.nama, text });
        return;
      }
      if (nav.share) {
        await nav.share({ title: 'Hasil Belajar — ' + p.nama, text });
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return; // pengguna membatalkan — wajar
    }
    // Perangkat tanpa Web Share: unduh gambar + salin teks
    const a = document.createElement('a');
    a.href = shareCardCache.url;
    a.download = 'hasil-belajar-' + p.nama + '.png';
    document.body.appendChild(a); a.click(); a.remove();
    try { await navigator.clipboard.writeText(text); } catch (e2) { /* abaikan */ }
    alert('Kartu hasil belajar sudah diunduh! 📥\n\nBuka galeri foto, lalu kirim gambarnya ke WhatsApp / Facebook. Teksnya sudah ikut disalin ya!');
  }

  /* ==================== PENGATURAN ==================== */

  let setSel = { panggilan: null, avatar: null, tutor: null };

  function wireSettings() {
    $('#btn-sound').addEventListener('click', () => {
      const m = !AudioSys.isMuted();
      AudioSys.setMuted(m);
      Store.setMuted(m);
      updateMuteIcon();
      if (!m) AudioSys.sfx.tap();
    });

    $('#btn-settings').addEventListener('click', openSettings);
    $('#btn-close-settings').addEventListener('click', closeSettings);
    $('#settings-modal').addEventListener('click', (e) => { if (e.target === $('#settings-modal')) closeSettings(); });

    $$('[data-set-panggilan]').forEach(b => {
      b.addEventListener('click', () => {
        $$('[data-set-panggilan]').forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
        setSel.panggilan = b.dataset.setPanggilan;
        AudioSys.sfx.tap();
      });
    });
    $$('[data-set-avatar]').forEach(b => {
      b.addEventListener('click', () => {
        $$('[data-set-avatar]').forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
        setSel.avatar = b.dataset.setAvatar;
        AudioSys.sfx.tap();
      });
    });
    $$('[data-set-tutor]').forEach(b => {
      b.addEventListener('click', () => {
        $$('[data-set-tutor]').forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
        setSel.tutor = b.dataset.setTutor;
        AudioSys.sfx.tap();
      });
    });
    $('#set-muslim').addEventListener('change', () => AudioSys.sfx.tap());

    $('#btn-logout').addEventListener('click', () => {
      closeSettings();
      Store.setActive(null);
      AudioSys.sfx.tap();
      goLogin();
    });

    $('#btn-save-settings').addEventListener('click', () => {
      const p = profile();
      if (!p) return;
      Store.updateProfile(p.id, {
        nama: ($('#set-name').value.trim() || p.nama),
        panggilan: setSel.panggilan || p.panggilan,
        avatar: setSel.avatar || p.avatar,
        tutorGender: setSel.tutor || p.tutorGender,
        muslim: !!$('#set-muslim').checked
      });
      AudioSys.sfx.tap();
      closeSettings();
      goHome();
      AudioSys.prewarm(AudioSys.greetText(profile())); // sapaan baru ikut disiapkan (sesuai tutor & muslim)
    });

    /* Hapus HANYA progres pencapaian anak ini — akun & data lain tetap aman */
    $('#btn-clear-progress').addEventListener('click', () => {
      const p = profile();
      if (!p) return;
      if (!confirm('Hapus semua progres (bintang & nilai) untuk ' + p.nama + '? Akun dan pengaturan tetap aman.')) return;
      Store.clearProgress(p.id);
      AudioSys.sfx.tap();
      closeSettings();
      goHome();
    });

    /* Hapus anak ini saja — anak lain di akun yang sama tetap tersimpan */
    $('#btn-delete-profile').addEventListener('click', () => {
      const p = profile();
      if (!p) return;
      if (!confirm('Hapus akun ' + p.nama + ' beserta progresnya? Anak-anak lain tetap aman.')) return;
      Store.deleteProfile(p.id);
      AudioSys.sfx.tap();
      closeSettings();
      goLogin();
    });
  }

  function openSettings() {
    const p = profile();
    if (!p) return;
    setSel = { panggilan: p.panggilan, avatar: p.avatar, tutor: p.tutorGender || 'female' };
    $('#set-name').value = p.nama;
    $$('[data-set-panggilan]').forEach(b => b.classList.toggle('selected', b.dataset.setPanggilan === p.panggilan));
    $$('[data-set-avatar]').forEach(b => b.classList.toggle('selected', b.dataset.setAvatar === p.avatar));
    $$('[data-set-tutor]').forEach(b => b.classList.toggle('selected', b.dataset.setTutor === (p.tutorGender || 'female')));
    $('#set-muslim').checked = !!p.muslim;
    $('#settings-modal').classList.remove('hidden');
  }

  function closeSettings() { $('#settings-modal').classList.add('hidden'); }
  function updateMuteIcon() { $('#btn-sound').textContent = AudioSys.isMuted() ? '🔇' : '🔊'; }

  /* ==================== NAVIGASI ==================== */

  function wireNav() {
    $('#btn-back-home').addEventListener('click', () => { AudioSys.sfx.tap(); goHome(); });
    $('#btn-back-unit').addEventListener('click', () => {
      $('#game-overlay').classList.add('hidden'); // tutup layar hasil jika masih terbuka
      ['GameTebak', 'GameTracing', 'GameSambung', 'GamePasangan', 'GameMemory',
       'GameUrutan', 'GameBalon', 'GameKuis', 'GameHilang', 'GameSusun', 'GameMath'].forEach(name => {
        const g = window[name];
        if (g && g.cancel) g.cancel();
      });
      AudioSys.sfx.tap();
      goHome();
    });

    /* Tab Belajar Baca / Belajar Hitung */
    $$('.home-tabs .tab').forEach(t => {
      t.addEventListener('click', () => {
        homeTab = t.dataset.tab;
        $$('.home-tabs .tab').forEach(x => x.classList.toggle('active', x === t));
        AudioSys.sfx.tap();
        renderHome();
      });
    });
  }

  /* ==================== INSTALL PWA (popup) ==================== */

  let deferredPrompt = null;

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
  }
  function isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent || ''); }

  function installDismissed() {
    try { return localStorage.getItem('piskola-install-dismiss') === '1'; }
    catch (e) { return false; }
  }
  function dismissInstall() {
    try { localStorage.setItem('piskola-install-dismiss', '1'); } catch (e) { /* abaikan */ }
    $('#install-modal').classList.add('hidden');
  }

  function maybeShowInstall() {
    if (isStandalone() || installDismissed()) return;
    const isChrome = !!deferredPrompt;
    const ios = isIOS();
    if (!isChrome && !ios) return; // hanya tampilkan bila bisa di-install
    $('#install-ios').classList.toggle('hidden', !ios);
    $('#install-android').classList.toggle('hidden', ios);
    $('#btn-install-go').classList.toggle('hidden', ios);
    $('#install-modal').classList.remove('hidden');
  }

  function wireInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      setTimeout(maybeShowInstall, 1200);
    });
    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      $('#install-modal').classList.add('hidden');
    });

    $('#btn-install-go').addEventListener('click', async () => {
      if (!deferredPrompt) { $('#install-modal').classList.add('hidden'); return; }
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice.catch(() => ({}));
      deferredPrompt = null;
      $('#install-modal').classList.add('hidden');
      if (!choice || choice.outcome !== 'accepted') dismissInstall();
    });
    $('#btn-install-later').addEventListener('click', dismissInstall);
    $('#btn-install-close').addEventListener('click', dismissInstall);
  }

  /* ==================== INIT ==================== */

  /* Ambil konfigurasi voice dari server (jika tersedia) dan simpan ke localStorage.
     Ini memastikan semua perangkat user mendapat voice ID yang benar tanpa perlu
     konfigurasi manual per perangkat. Dipanggil diam-diam saat startup. */
  async function fetchServerConfig() {
    try {
      // Cari serverUrl dari localStorage — bisa sudah diisi dari perangkat lain atau belum
      const el = Store.getElevenLabs();
      // Coba endpoint /config relatif (selalu ada jika server berjalan di domain yang sama)
      const configUrl = new URL('/config', location.href);
      const res = await fetch(configUrl, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
      if (!res.ok) return;
      const cfg = await res.json();
      if (!cfg || (!cfg.femaleVoiceId && !cfg.maleVoiceId)) return;
      // Gabungkan dengan config yang sudah ada (tidak timpa apiKey lokal)
      const current = Store.getElevenLabs();
      Store.setElevenLabs(Object.assign({}, current, {
        femaleVoiceId: cfg.femaleVoiceId || current.femaleVoiceId || '',
        maleVoiceId:   cfg.maleVoiceId   || current.maleVoiceId   || '',
        voiceId:       cfg.femaleVoiceId || cfg.maleVoiceId || current.voiceId || '',
        speed:         cfg.speed         || current.speed   || 0.75,
        serverTts:     cfg.serverTts !== undefined ? cfg.serverTts : (current.serverTts || false),
        serverUrl:     current.serverUrl || '/tts',
        serverToken:   current.serverToken || '',
        apiKey:        current.apiKey || ''
      }));
      AudioSys.refreshConfig(); // beritahu AudioSys agar pakai config terbaru
    } catch (e) { /* server tidak tersedia atau belum dikonfigurasi — abaikan */ }
  }

  function init() {
    AudioSys.setMuted(Store.getSettings().muted === true);
    updateMuteIcon();
    wireLogin();
    wireSettings();
    wireNav();
    wireInstall();

    // Ambil config voice dari server secara diam-diam (tidak blokir UI)
    fetchServerConfig();

    if (Store.getProfile()) {
      setTimeout(() => {
        goHome();
        AudioSys.greet(profile());
        AudioSys.prewarm(AudioSys.greetText(profile())); // pastikan sapaan tersimpan tanpa kredit lagi
      }, 600);
    } else if (isIOS() && !isStandalone()) {
      // iOS tidak punya beforeinstallprompt → tampilkan panduan pasang
      setTimeout(maybeShowInstall, 2500);
    }

    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => { /* abaikan */ });
      });
    }
  }

  init();
})();
