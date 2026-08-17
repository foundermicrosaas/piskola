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
    ba: [['baju', '👕'], ['balon', '🎈'], ['batu', '🪨'], ['bantal', '🛌'], ['bangku', '🪑']],
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

  const BACA_GAMES = [
    { id: 'tebak', type: 'tebak', title: 'Tebak Kata', emoji: '🔍', desc: 'Dengarkan kata dan temukan tulisan yang benar.' },
    { id: 'cari', type: 'cari', title: 'Cari Kata', emoji: '🕵️', desc: 'Cari dan kumpulkan semua kata target yang tersembunyi.' },
    { id: 'balon', type: 'balon', title: 'Balon Kata', emoji: '🎈', desc: 'Pecahkan balon yang memiliki kata yang benar.' },
    { id: 'susun', type: 'susun', title: 'Susun Kata', emoji: '🚂', desc: 'Susun huruf-huruf menjadi kata yang benar.' },
    { id: 'pasangan', type: 'pasangan', mode: 'word2pic', title: 'Pasangkan Kata', emoji: '🔗', desc: 'Tarik garis dari tulisan kata ke gambarnya.' },
    { id: 'memory', type: 'memory', mode: 'word2pic', title: 'Memori Kata', emoji: '🎴', desc: 'Buka kartu untuk mencocokkan tulisan kata dan gambar.' },
    { id: 'kuis-sound2pic', type: 'kuis', mode: 'sound2pic', title: 'Tebak Gambar', emoji: '🖼️', desc: 'Dengarkan kata dan pilih gambar yang tepat.' },
    { id: 'kuis-pic2word', type: 'kuis', mode: 'pic2word', title: 'Tebak Tulisan', emoji: '📝', desc: 'Lihat gambar dan pilih tulisan yang benar.' },
    { id: 'kuis-sound2word', type: 'kuis', mode: 'sound2word', title: 'Dengar & Pilih', emoji: '👂', desc: 'Dengarkan dan pilih tulisan yang benar.' },
    { id: 'hilang', type: 'hilang', title: 'Huruf Hilang', emoji: '🧩', desc: 'Lengkapi huruf atau suku kata yang hilang.' }
  ];

  const SYL_GROUPS = [
    { label: 'b', syllables: ['ba', 'bi', 'bu', 'be', 'bo'] },
    { label: 'c', syllables: ['ca', 'ci', 'cu', 'ce', 'co'] },
    { label: 'd', syllables: ['da', 'di', 'du', 'de', 'do'] },
    { label: 'f', syllables: ['fa', 'fi', 'fu', 'fe', 'fo'] },
    { label: 'g', syllables: ['ga', 'gi', 'gu', 'ge', 'go'] },
    { label: 'h', syllables: ['ha', 'hi', 'hu', 'he', 'ho'] },
    { label: 'j', syllables: ['ja', 'ji', 'ju', 'je', 'jo'] },
    { label: 'k', syllables: ['ka', 'ki', 'ku', 'ke', 'ko'] },
    { label: 'l', syllables: ['la', 'li', 'lu', 'le', 'lo'] },
    { label: 'm', syllables: ['ma', 'mi', 'mu', 'me', 'mo'] },
    { label: 'n', syllables: ['na', 'ni', 'nu', 'ne', 'no'] },
    { label: 'p', syllables: ['pa', 'pi', 'pu', 'pe', 'po'] },
    { label: 'q', syllables: ['qa', 'qi', 'qu', 'qe', 'qo'] },
    { label: 'r', syllables: ['ra', 'ri', 'ru', 're', 'ro'] },
    { label: 's', syllables: ['sa', 'si', 'su', 'se', 'so'] },
    { label: 't', syllables: ['ta', 'ti', 'tu', 'te', 'to'] },
    { label: 'v', syllables: ['va', 'vi', 'vu', 've', 'vo'] },
    { label: 'w', syllables: ['wa', 'wi', 'wu', 'we', 'wo'] },
    { label: 'x', syllables: ['xa', 'xi', 'xu', 'xe', 'xo'] },
    { label: 'y', syllables: ['ya', 'yi', 'yu', 'ye', 'yo'] },
    { label: 'z', syllables: ['za', 'zi', 'zu', 'ze', 'zo'] }
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
      desc: 'Kenali nama, bunyi, dan bentuk huruf kapital ' + upper.join(', ') + '. Lalu mainkan gamenya dengan kata-kata!',
      kind: 'huruf', letterCase: 'upper', letters: upper,
      games: BACA_GAMES
    });
  });
  LETTER_GROUPS.forEach((g, gi) => {
    UNITS.push({
      id: 'kecil-' + (gi + 1),
      title: 'Unit ' + (gi + 1 + LETTER_GROUPS.length) + ' — Huruf Kecil ' + g.label.toLowerCase(),
      emoji: '🔡',
      desc: 'Kenali nama, bunyi, dan bentuk huruf kecil ' + g.chars.join(', ') + '. Lalu mainkan gamenya dengan kata-kata!',
      kind: 'huruf', letterCase: 'lower', letters: g.chars,
      games: BACA_GAMES
    });
  });
  SYL_GROUPS.forEach((g, gi) => {
    UNITS.push({
      id: 'suku-' + g.label,
      title: 'Unit ' + (gi + 1 + (LETTER_GROUPS.length * 2)) + ' — Suku Kata ' + g.label.toUpperCase(),
      emoji: '🧩',
      desc: 'Kenali dan pelajari suku kata ' + g.syllables.join(', ') + ' dengan menyusunnya menjadi kata bermakna!',
      kind: 'suku', syllables: g.syllables,
      games: BACA_GAMES
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
    tebak: 'Yuk kita belajar tebak kata',
    cari: 'Yuk kita cari kata di kotak ajaib',
    balon: 'Yuk kita pecahkan balon katanya',
    'pasangan-word2pic': 'Yuk kita pasangkan kata dengan gambarnya',
    'memory-word2pic': 'Yuk kita cocokkan kartu kata dengan gambarnya',
    'kuis-sound2pic': 'Yuk kita tebak gambar dari suaranya',
    'kuis-pic2word': 'Yuk kita tebak tulisan katanya',
    'kuis-sound2word': 'Yuk kita dengarkan dan pilih kata yang benar',
    hilang: 'Yuk kita isi huruf yang hilang',
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

  /* ==================== CANCEL ALL GAMES ====================
     Dipanggil setiap kali startGame() dijalankan untuk memastikan
     semua engine game sebelumnya dihentikan (timer, audio, render)
     sehingga tidak ada game "zombie" yang menimpa layar game baru. */
  function cancelAllGames() {
    const engines = [
      'GameTebak', 'GameCari', 'GameBalon', 'GamePasangan', 'GameMemory',
      'GameKuis', 'GameHilang', 'GameSusun', 'GameMath'
    ];
    engines.forEach(name => {
      if (window[name] && typeof window[name].cancel === 'function') {
        try { window[name].cancel(); } catch (e) { /* abaikan */ }
      }
    });
    // Bersihkan game-area dan pastikan overlay hasil tersembunyi
    const area = document.getElementById('game-area');
    if (area) area.innerHTML = '';
    const overlay = document.getElementById('game-overlay');
    if (overlay) overlay.classList.add('hidden');
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
  /* Hasil cek ketersediaan username ke server:
     true=tersedia, false=terpakai, null=belum dicek/server tak terjangkau */
  let regUsernameOk = null;

  function goLogin() {
    renderLogin();
    UI.showScreen('login');
  }

  function renderLogin() {
    $('#login-username').value = '';
    $('#login-pin').value = '';
    $('#login-error').textContent = '';
  }

  async function doLogin() {
    const username = $('#login-username').value.trim();
    const pin = $('#login-pin').value.trim();
    if (!username) { $('#login-error').textContent = 'Ketik Username dulu ya!'; return; }
    if (pin.length !== 4) { $('#login-error').textContent = 'PIN harus 4 angka.'; return; }
    
    $('#btn-login-go').textContent = '⏳ Memuat...';
    $('#login-error').textContent = '';
    
    try {
      const u = await Store.CloudSync.login(username, pin);
      Store.addProfile(u); // Akan menyimpan ke localStorage & activeId
      AudioSys.sfx.fanfare();
      goHome();
      AudioSys.greet(profile());
      AudioSys.prewarm(AudioSys.greetText(profile()));
    } catch (e) {
      $('#login-error').textContent = '❌ ' + e.message;
      AudioSys.sfx.wrong();
    } finally {
      $('#btn-login-go').textContent = 'Masuk ➡️';
    }
  }

  function goRegister() {
    regDraft = { panggilan: null, avatar: null };
    regUsernameOk = null;
    $('#reg-username').value = '';
    $('#reg-name').value = '';
    $('#reg-pin').value = '';
    $('#reg-pin2').value = '';
    $('#reg-error').textContent = '';
    const st = $('#reg-username-status');
    if (st) { st.textContent = ''; st.className = 'username-status'; }
    $$('[data-reg-pg]').forEach(b => b.classList.remove('selected'));
    $$('[data-reg-av]').forEach(b => b.classList.remove('selected'));
    UI.showScreen('register');
    setTimeout(() => $('#reg-name').focus(), 250);
  }

  async function doRegister() {
    const username = $('#reg-username').value.trim();
    const nama = $('#reg-name').value.trim();
    const pin = $('#reg-pin').value.trim();
    const pin2 = $('#reg-pin2').value.trim();
    if (!username) { $('#reg-error').textContent = 'Isi Username unik dulu ya!'; return; }
    if (regUsernameOk === false) { $('#reg-error').textContent = 'Username sudah dipakai. Pilih yang lain ya!'; return; }
    if (!nama) { $('#reg-error').textContent = 'Tulis nama panggilan anak!'; return; }
    if (!regDraft.panggilan) { $('#reg-error').textContent = 'Pilih panggilan (Kakak/Adek).'; return; }
    if (!regDraft.avatar) { $('#reg-error').textContent = 'Pilih avatar kesukaanmu.'; return; }
    if (pin.length !== 4) { $('#reg-error').textContent = 'PIN harus 4 angka.'; return; }
    if (pin !== pin2) { $('#reg-error').textContent = 'PIN dan ulangan PIN tidak sama.'; return; }
    
    $('#btn-register').textContent = '⏳ Menyimpan...';
    $('#reg-error').textContent = '';
    
    try {
      const u = await Store.CloudSync.register({
        username, nama, pin, 
        panggilan: regDraft.panggilan, avatar: regDraft.avatar
      });
      Store.addProfile(u);
      AudioSys.sfx.fanfare();
      goHome();
      AudioSys.greet(profile());
      AudioSys.prewarm(AudioSys.greetText(profile()));
    } catch (e) {
      $('#reg-error').textContent = '❌ ' + e.message;
    } finally {
      $('#btn-register').textContent = 'Daftar 🎉';
    }
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

    /* Cek ketersediaan username langsung ke database server (debounce),
       dengan indikator di bawah kolom: ✅ tersedia / ❌ sudah dipakai. */
    let usernameCheckTimer = null;
    $('#reg-username').addEventListener('input', () => {
      clearTimeout(usernameCheckTimer);
      const u = $('#reg-username').value.trim();
      const st = $('#reg-username-status');
      if (!u) {
        regUsernameOk = null;
        if (st) { st.textContent = ''; st.className = 'username-status'; }
        return;
      }
      if (st) { st.textContent = '⏳ Mengecek ketersediaan...'; st.className = 'username-status'; }
      usernameCheckTimer = setTimeout(async () => {
        try {
          const r = await Store.CloudSync.checkUsername(u);
          if (r && r.available === false) {
            regUsernameOk = false;
            if (st) { st.textContent = '❌ Username sudah dipakai. Pilih yang lain ya!'; st.className = 'username-status bad'; }
          } else {
            regUsernameOk = true;
            if (st) { st.textContent = '✅ Username tersedia!'; st.className = 'username-status ok'; }
          }
        } catch (e) {
          // Server tak terjangkau → jangan blokir; biarkan /api/register yang menegaskan
          regUsernameOk = null;
          if (st) { st.textContent = ''; st.className = 'username-status'; }
        }
      }, 450);
    });

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
  let currentUnitId = null; // unit yang sedang dibuka (dipakai tombol ⏹️ kembali)

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

    updateProBanner(p);
  }

  function updateProBanner(p) {
    const b = $('#pro-banner');
    if (!b) return;
    if (p.isPro) {
      b.className = 'pro-banner active';
      b.innerHTML = '<div>⭐ Status <b>PRO</b> Aktif — Semua unit bebas dimainkan!</div>';
    } else {
      b.className = 'pro-banner';
      b.innerHTML = '<div>Miliki <b>PRO</b> untuk membuka sisa game & unit eksklusif!</div>' +
                    '<button class="btn btn-primary sm" id="btn-banner-pro">Lihat PRO</button>';
      const bBtn = $('#btn-banner-pro');
      if (bBtn) bBtn.addEventListener('click', () => Payment.showModal());
    }
  }
  
  /* ==================== RAPOR PROGRES ==================== */
  function openRapor() {
    const p = profile();
    if (!p) return;
    const r = Store.getReport(p.id);
    
    $('#rapor-stars').textContent = r.stars;
    $('#rapor-acc').textContent = r.avg + '%';
    $('#rapor-streak').textContent = p.streakCount || 0;
    $('#rapor-plays').textContent = r.plays;
    
    let advice = '';
    const w = Object.keys(r.weakUnits);
    const s = Object.keys(r.strongUnits);
    
    if (r.plays === 0) {
      advice = 'Kakak belum main game nih. Yuk mulai main!';
    } else if (w.length > 0) {
      // Ambil unit yang lemah
      advice = `Adek masih sering salah di beberapa bagian. Yuk sering-sering main game <b>Tebak Kata</b> untuk melatih akurasi!`;
    } else if (s.length > 0) {
      advice = `Wah, luar biasa! Adek sangat pintar dan akurat. Teruskan belajarnya ke Unit yang lebih tinggi!`;
    } else {
      advice = `Bagus! Terus semangat belajar dan kumpulkan lebih banyak bintang!`;
    }
    $('#rapor-advice').innerHTML = advice;
    
    $('#rapor-modal').classList.remove('hidden');
    AudioSys.sfx.tap();
  }
  
  function wireRapor() {
    const btn = $('#btn-rapor');
    if (btn) btn.addEventListener('click', openRapor);
    
    const btnClose = $('#btn-close-rapor');
    if (btnClose) btnClose.addEventListener('click', () => {
      $('#rapor-modal').classList.add('hidden');
      AudioSys.sfx.tap();
    });
    
    $('#rapor-modal').addEventListener('click', (e) => {
      if (e.target === $('#rapor-modal')) {
        $('#rapor-modal').classList.add('hidden');
      }
    });
    
    // Tombol Bagikan Rapor (Social Proof)
    const btnShare = $('#btn-share-rapor');
    if (btnShare) btnShare.addEventListener('click', async () => {
      const p = profile();
      if (!p) return;
      AudioSys.sfx.tap();
      const r = Store.getReport(p.id);
      const text = `Yeay! ${p.nama} sudah main ${r.plays} game di Piskola dengan ⭐ ${r.stars} bintang dan akurasi ${r.avg}%! 🔥 Streak ${p.streakCount || 0} hari berturut-turut!\n\nYuk ajak anak belajar membaca dengan cara yang seru di piskola.com 📚`;
      try {
        if (navigator.share) {
          await navigator.share({ title: 'Rapor Belajar ' + p.nama + ' — Piskola', text });
          return;
        }
      } catch (e) {
        if (e && e.name === 'AbortError') return;
      }
      // Fallback: copy to clipboard
      try { await navigator.clipboard.writeText(text); } catch (e2) {}
      alert('Teks rapor sudah disalin!\n\nSilakan paste ke status WhatsApp atau Instagram Stories Anda.');
    });
  }

  /* ==================== UNIT ==================== */

  function openUnit(unitId) {
    const unit = UNITS.concat(MATH_UNITS).find(u => u.id === unitId);
    if (!unit) return;
    currentUnitId = unit.id;
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
    cancelAllGames(); // penting: timer/antrean game sebelumnya tidak boleh menimpa layar game baru
    $('#game-title').textContent = game.title;
    $('#game-progress').textContent = '';
    $('#game-overlay').classList.add('hidden');
    UI.showScreen('game');
    
    // Tampilkan tirai mulai
    const overlayStart = $('#game-start-overlay');
    overlayStart.classList.remove('hidden');
    
    AudioSys.stopAudio();
    AudioSys.setSubject(game.type === 'math' ? 'hitung' : 'baca');

    // Sambutan interaktif
    const welcomeKey = game.type === 'math'
      ? game.mode
      : (game.mode === 'word2pic' ? game.type + '-' + game.mode : game.id);
    AudioSys.gameWelcome(profile(), WELCOME[welcomeKey] || 'Yuk kita main ' + game.title.toLowerCase());

    const btnStart = $('#btn-start-game');
    const newBtnStart = btnStart.cloneNode(true);
    btnStart.parentNode.replaceChild(newBtnStart, btnStart);
    
    newBtnStart.addEventListener('click', () => {
      overlayStart.classList.add('hidden');
      AudioSys.sfx.tap();
      AudioSys.stopAudio(); // Stop audio instruksi kalau di-klik cepat

      const onDone = (res) => {
        Store.setGameProgress(unit.id, game.id, res);
        showResult(unit, game.id, res);
      };
      const common = { profile: profile(), onDone };

      // Set global variable so Repeat button knows what to repeat
      window.lastGamePrompt = () => {
        // Kita tidak punya referensi langsung ke prompt aktif di dalam game.js, 
        // tapi kita bisa memanggil AudioSys.speakText dengan lastText.
        if (window.lastSpeakText) AudioSys.speak(window.lastSpeakText);
      };

    switch (game.type) {
      case 'tebak':
      case 'cari':
      case 'balon':
        const wPool = unit.kind === 'suku' 
          ? WORDS_FLAT.filter(w => unit.syllables.includes(w.syl)) 
          : WORDS_FLAT.filter(w => unit.letters.map(l=>l.toLowerCase()).includes(w.word[0].toLowerCase()));
        
        if (game.type === 'tebak') GameTebak.start({ pool: wPool, ...common });
        if (game.type === 'cari') GameCari.start({ pool: wPool, ...common });
        if (game.type === 'balon') GameBalon.start({ pool: wPool, ...common });
        break;
      case 'pasangan':
      case 'memory':
        const wmPool = unit.kind === 'suku' 
          ? WORDS_FLAT.filter(w => unit.syllables.includes(w.syl)) 
          : WORDS_FLAT.filter(w => unit.letters.map(l=>l.toLowerCase()).includes(w.word[0].toLowerCase()));
        
        if (game.type === 'pasangan') GamePasangan.start({ pool: wmPool, mode: 'word2pic', ...common });
        if (game.type === 'memory') GameMemory.start({ pool: wmPool, mode: 'word2pic', ...common });
        break;
      case 'kuis':
        GameKuis.start({
          mode: game.mode,
          pool: unit.kind === 'suku' 
            ? WORDS_FLAT.filter(w => unit.syllables.includes(w.syl)) 
            : WORDS_FLAT.filter(w => unit.letters.map(l=>l.toLowerCase()).includes(w.word[0].toLowerCase())),
          ...common
        });
        break;
      case 'hilang':
        GameHilang.start({
          mode: unit.kind === 'suku' ? 'suku' : 'huruf',
          letterCase: unit.letterCase, letters: unit.letters,
          syllables: unit.syllables, 
          pool: unit.kind === 'suku' 
            ? WORDS_FLAT.filter(w => unit.syllables.includes(w.syl)) 
            : WORDS_FLAT.filter(w => unit.letters.map(l=>l.toLowerCase()).includes(w.word[0].toLowerCase())),
          ...common
        });
        break;
      case 'susun':
        GameSusun.start({
          mode: unit.kind === 'suku' ? 'suku' : 'huruf',
          letterCase: unit.letterCase,
          pool: unit.kind === 'suku' 
            ? WORDS_FLAT.filter(w => unit.syllables.includes(w.syl)) 
            : WORDS_FLAT.filter(w => unit.letters.map(l=>l.toLowerCase()).includes(w.word[0].toLowerCase())),
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
    }); // end btnStart click
  }

  function showResult(unit, gameId, res) {
    const p = profile();
    const game = unit.games.find(x => x.id === gameId);
    const title = game ? game.title : 'Belajar';
    const overlay = $('#game-overlay');
    
    // 1. Cek Streak
    const streakInfo = Store.updateStreak(p.id);
    let streakHtml = '';
    if (streakInfo.newStreak && streakInfo.count > 1) {
      streakHtml = '<div style="color:var(--orange); font-weight:bold; margin-top:8px; animation: bounce 1s;">🔥 Streak ' + streakInfo.count + ' Hari! Hebat!</div>';
    } else if (streakInfo.newStreak) {
      streakHtml = '<div style="color:var(--sky); font-weight:bold; margin-top:8px;">🔥 Hari Pertama! Keren!</div>';
    }

    // 2. Cek Kelulusan Unit (Sertifikat)
    let unitLulus = true;
    const FREE_GAMES = 4;
    const accessibleGames = p.isPro ? unit.games : unit.games.slice(0, FREE_GAMES);
    
    accessibleGames.forEach(g => {
      const pr = Store.getGameProgress(unit.id, g.id, p.id);
      if (!pr || pr.stars === 0) unitLulus = false;
    });
    
    let certBtn = '';
    if (unitLulus) {
      certBtn = '<button class="btn btn-primary" id="btn-result-cert" style="background:#F977CE; border-color:#d451a5; width:100%; margin-top:8px;">🏆 Bagikan Sertifikat Unit</button>';
    }

    overlay.innerHTML =
      '<div class="result-card">' +
        '<div class="result-emoji">🎉</div>' +
        '<h3>Selamat ' + (p ? p.panggilan + ' ' + p.nama : '') + '!</h3>' +
        '<p class="result-sub">Menyelesaikan belajar ' + title + '</p>' +
        '<div class="star-row big">' + starRow(res.stars) + '</div>' +
        '<p class="result-acc">Akurasi: ' + res.accuracy + '%</p>' +
        streakHtml +
        '<div class="result-actions" style="margin-top:16px;">' +
          '<button class="btn btn-secondary" id="btn-result-replay">🔁 Main Lagi</button>' +
          '<button class="btn btn-share" id="btn-result-share">📤 Bagikan Game</button>' +
          '<button class="btn btn-primary" id="btn-result-back">Kembali</button>' +
        '</div>' +
        certBtn +
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
    
    const btnCert = $('#btn-result-cert');
    if (btnCert) {
      btnCert.addEventListener('click', () => {
        AudioSys.sfx.tap();
        shareCertificate(p, unit);
      });
    }
  }

  /* ==================== SERTIFIKAT KELULUSAN UNIT ==================== */
  async function shareCertificate(p, unit) {
    const text = 'Alhamdulillah! ' + p.nama + ' sudah lulus ' + unit.title + '! 🎉 Terima kasih Piskola! Yuk main & belajar bareng!';
    
    // Gunakan Web Share API (tanpa gambar, karena kita belum membuat generator canvas untuk sertifikat, cukup text + emoji)
    // Atau jika mau gambar, panggil drawShareCard dengan modifikasi. Untuk sekarang, kita share text saja
    const nav = navigator;
    try {
      if (nav.share) {
        await nav.share({ title: 'Sertifikat Piskola — ' + p.nama, text });
        return;
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
    
    // Fallback copy
    try { await navigator.clipboard.writeText(text); } catch (e2) { }
    alert('Teks sertifikat berhasil disalin!\n\nSilakan paste (tempel) di status WhatsApp atau sosial media Anda.');
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
      '<div class="share-options" style="display: block;">' +
        '<button class="btn btn-share" style="width: 100%;" id="btn-share-native">🚀 Bagikan Sekarang</button>' +
      '</div>' +
      '<p class="share-note">Bagikan ke WhatsApp, Facebook, atau aplikasi lainnya!</p>';

    buildShareCard(p, title, res).then(url => {
      const img = $('#share-preview');
      if (img) img.src = url;
    }).catch(() => { /* preview gagal — tombol tetap bisa dipakai */ });

    $('#btn-share-native').addEventListener('click', () => doShare(p, title, res));
  }

  async function doShare(p, title, res) {
    if (!shareCardCache) await buildShareCard(p, title, res);
    
    // Gunakan teks default yang umum
    const text = 'Yeay! ' + p.nama + ' mendapat bintang ' + res.stars + ' di game ' + title + ' dengan akurasi ' + res.accuracy + '%! 🥳 Bikin bangga deh! Yuk main Piskola bareng!';
    
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

    $('#btn-download-audio').addEventListener('click', async () => {
      const btn = $('#btn-download-audio');
      const status = $('#download-status');
      if (btn.disabled) return;
      
      AudioSys.sfx.tap();
      btn.disabled = true;
      btn.textContent = '⏳ Mengunduh... (0%)';
      status.style.display = 'block';
      status.textContent = 'Pastikan internet stabil...';

      try {
        let total = WORDS_FLAT.length;
        let done = 0;
        // Pre-fetch all words via AudioSys.prewarm (yang memanggil fetch ke server lalu simpan ke IndexedDB)
        for (let i = 0; i < total; i++) {
          const w = WORDS_FLAT[i];
          await AudioSys.prewarm(w.word);
          done++;
          if (done % 5 === 0 || done === total) {
            btn.textContent = `⏳ Mengunduh... (${Math.round(done/total * 100)}%)`;
            status.textContent = `${done} / ${total} kata tersimpan`;
          }
        }
        
        // Coba prewarm pujian dan sambutan
        const basics = ['Wah', 'Keren', 'Hebat', 'Luar biasa', 'Sempurna'];
        for (let b of basics) await AudioSys.prewarm(b);

        btn.textContent = '✅ Suara Siap Offline';
        status.textContent = 'Anda bisa mematikan internet sekarang.';
        status.style.color = 'var(--green)';
      } catch (err) {
        btn.textContent = '❌ Gagal Mengunduh';
        status.textContent = 'Koneksi terputus. Coba lagi nanti.';
        status.style.color = 'var(--orange)';
      }
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = '☁️ Unduh Suara (Mode Offline)';
        status.style.display = 'none';
        status.style.color = 'var(--sky)';
      }, 5000);
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

  /* Batalkan SEMUA game yang masih berjalan — dipakai saat game baru dimulai
     dan saat keluar dari layar game, supaya timer lama tidak menimpa layar
     game berikutnya ("game sebelumnya tiba-tiba muncul"). */
  function cancelAllGames() {
    ['GameTebak', 'GameCari', 'GamePasangan', 'GameMemory',
     'GameBalon', 'GameKuis', 'GameHilang', 'GameSusun', 'GameMath'].forEach(name => {
      const g = window[name];
      if (g && g.cancel) g.cancel();
    });
  }

  function wireNav() {
    $('#btn-back-home').addEventListener('click', () => { AudioSys.sfx.tap(); goHome(); });

    /* Tombol ⏹️ (berhenti) sudah dihapus — cukup tombol 🏠 yang mengonfirmasi
       sebelum keluar dari game. Progres game yang sudah selesai tetap tersimpan
       (Store.setGameProgress → sinkron ke server). */
    $('#btn-back-home-game').addEventListener('click', () => {
      if (!confirm('Apakah kamu yakin ingin berhenti bermain dan kembali ke Beranda?')) return;
      AudioSys.stopAudio();
      $('#game-overlay').classList.add('hidden');
      $('#game-start-overlay').classList.add('hidden');
      cancelAllGames();
      AudioSys.sfx.tap();
      goHome(); // go directly home
    });

    $('#btn-repeat-audio').addEventListener('click', () => {
      AudioSys.sfx.tap();
      if (window.lastGamePrompt) window.lastGamePrompt();
    });

    /* Tab Belajar Baca / Belajar Hitung */
    $$('.home-tabs .tab').forEach(t => {
      t.addEventListener('click', () => {
        if (homeTab === t.dataset.tab) return; // hindari sapaan dobel jika tab sama diklik
        homeTab = t.dataset.tab;
        $$('.home-tabs .tab').forEach(x => x.classList.toggle('active', x === t));
        AudioSys.sfx.tap();
        AudioSys.setSubject(homeTab);
        AudioSys.greet(profile());
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
      if (!deferredPrompt) { $('#install-modal').classList.remove('hidden'); return; }
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
      // Gunakan /tts?action=get-config agar selalu lolos nginx proxy
      const el = Store.getElevenLabs();
      const base = el.serverUrl || '/tts';
      const configUrl = new URL(base, location.href);
      if (!/\/tts$/i.test(configUrl.pathname)) configUrl.pathname = configUrl.pathname.replace(/\/+$/, '') + '/tts';
      configUrl.searchParams.set('action', 'get-config');
      if (el.serverToken) configUrl.searchParams.set('token', el.serverToken);
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
        serverToken:   cfg.serverToken !== undefined ? cfg.serverToken : (current.serverToken || ''),
        apiKey:        current.apiKey || ''
      }));
      AudioSys.refreshConfig(); // beritahu AudioSys agar pakai config terbaru
    } catch (e) { /* server tidak tersedia atau belum dikonfigurasi — abaikan */ }
  }

  function init() {
    AudioSys.setMuted(Store.getSettings().muted === true);
    updateMuteIcon();
    wireLogin();
    wireNav();
    wireInstall();
    wireSettings();
    wireRapor();
    
    const sid = Store.getSettings().activeId;

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
