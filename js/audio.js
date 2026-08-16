/* Sistem suara:
   - ANTREAN SERIAL: semua ucapan diputar satu per satu (tidak pernah bertumpuk).
     Pujian selesai dulu, baru kata berikutnya bersuara. Tombol "dengar ulang"
     memakai { flush: true } agar langsung memotong antrean.
   - ElevenLabs (jika dikonfigurasi lewat /admin): hasil DI-CACHE permanen di
     IndexedDB (kunci = voiceId + teks) → tiap teks hanya memakai kredit SEKALI.
     Sapaan nama & panggilan di-*prewarm* saat login/daftar (di-generate diam-diam
     dan disimpan) sehingga tidak pernah memakai kredit lagi setelah itu.
   - Tanpa konfigurasi → fallback Web Speech API (gratis).
   - Pujian dinamis & antusias: kombinasi kata pembuka + nama + kata pujian yang
     diacak, tanpa mengulang berturut-turut, dengan nada semangat. */
window.AudioSys = (() => {
  /* ================== KATA PUJIAN (banyak variasi) ================== */
  const STARTERS = ['Wah', 'Wow', 'Hore', 'Yeay', 'Asyik', 'Sip', 'Keren', 'Hebat', 'Luar biasa', 'Mantap', 'Top', 'Sensasional'];
  const PRAISE = ['pintar', 'hebat', 'cerdas', 'keren', 'luar biasa', 'mantap', 'jenius', 'istimewa', 'juara', 'top', 'sangat pintar', 'luar biasa pintar', 'bintang', 'jago', 'istimewa'];
  /* Penutup pujian — dibedakan sesuai subjek: membaca vs berhitung.
     Semua kalimat penuh (tanpa '!' ganda) dan TIDAK memakai varian
     '... sekali' agar tidak pernah terdengar 'sekali-sekali'. */
  const SUFFIX = [
    '',
    ' Teruskan ya!',
    ' Semangat terus ya!',
    ' Ayo terus belajar!',
    ' Kamu makin jago!',
    ' Bintang untukmu!',
    ' Membaca jadi menyenangkan!',
    ' Kamu pasti bisa!',
    ' Keren!'
  ];
  const SUFFIX_MATH = [
    '',
    ' Teruskan ya!',
    ' Semangat terus ya!',
    ' Ayo terus belajar!',
    ' Kamu makin jago!',
    ' Bintang untukmu!',
    ' Berhitung jadi menyenangkan!',
    ' Hebat berhitungnya!',
    ' Kamu pasti bisa!'
  ];
  /* Subjek yang sedang dipelajari ('baca' | 'hitung') — mengubah sapaan
     dan penutup pujian agar selalu relevan dengan pelajarannya. */
  let subject = 'baca';
  function setSubject(s) { subject = s === 'hitung' ? 'hitung' : 'baca'; }
  const ENCOURAGE = [
    'Tidak apa-apa, ayo coba lagi ya!',
    'Ayo coba lagi, pasti bisa!',
    'Jangan menyerah, coba sekali lagi ya!',
    'Tidak apa-apa! Coba lagi, ya!',
    'Hampir benar! Ayo coba lagi!',
    'Ayo semangat, coba lagi ya!',
    'InsyaAllah, kamu pasti bisa! Coba lagi ya!',
    'InsyaAllah, pelan-pelan saja, ayo coba lagi!'
  ];
  const GREET = [
    'Halo, %N%! Ayo belajar membaca!',
    'Halo, %N%! Selamat datang di petualangan membaca!',
    'Halo, %N%! Ayo kita belajar sambil bermain!',
    'Halo, %N%! Sudah siap belajar hari ini?'
  ];
  /* Sapaan islami — dipakai saat tutor muslim aktif */
  const GREET_MUSLIM = [
    "Assalamu'alaikum, %N%! Ayo belajar membaca!",
    "Assalamu'alaikum, %N%! Selamat datang di petualangan belajar!",
    "Assalamu'alaikum %N%! Alhamdulillah, yuk kita belajar hari ini!",
    "Assalamu'alaikum, %N%! Sudah siap belajar? Alhamdulillah, semangat ya!"
  ];
  /* Sapaan saat tab Belajar Hitung */
  const GREET_MATH = [
    'Halo, %N%! Ayo belajar berhitung!',
    'Halo, %N%! Selamat datang di petualangan berhitung!',
    'Halo, %N%! Ayo kita berhitung sambil bermain!',
    'Halo, %N%! Sudah siap berhitung hari ini?'
  ];
  const GREET_MATH_MUSLIM = [
    "Assalamu'alaikum, %N%! Ayo belajar berhitung!",
    "Assalamu'alaikum, %N%! Selamat datang di petualangan berhitung!",
    "Assalamu'alaikum %N%! Alhamdulillah, yuk kita berhitung hari ini!",
    "Assalamu'alaikum, %N%! Sudah siap berhitung? Alhamdulillah, semangat ya!"
  ];
  const GAME_DONE = [
    'Luar biasa! %N% dapat bintang %S%!',
    'Keren! %N% dapat bintang %S%!',
    'Wow! %N% mendapat bintang %S%!',
    'Hore! %N% dapat bintang %S%! Kamu hebat!'
  ];
  const GAME_DONE_3 = [
    'Luar biasa! %N% dapat bintang tiga!',
    'Sempurna! %N% dapat bintang tiga!',
    'Wah, %N% dapat bintang tiga! Hebat sekali!',
    'Hore! %N% dapat bintang tiga penuh!'
  ];
  const STREAK = [
    'Wah, %N% hebat sekali! Teruskan!',
    '%N% sedang melaju! Keren sekali!',
    'Wow! %N% menjawab berturut-turut! Pintar!',
    'Hore! %N% makin jago! Ayo lanjutkan!'
  ];
  const UNIT_DONE = [
    'Keren! %N% sudah mahir unit ini!',
    'Luar biasa! %N% menuntaskan unit ini!',
    'Hore! %N% sudah selesai unit ini! Hebat!',
    'Wah, %N% sudah menguasai unit ini! Pintar sekali!'
  ];

  let lastPick = { starter: null, word: null, suffix: null };
  let muted = false;
  let voice = null;
  let elCfg = null;          // konfigurasi lama/fallback { apiKey, voiceId, speed }
  let currentAudio = null;
  let elChain = Promise.resolve();
  let speakChain = Promise.resolve();
  let elFailedUntil = 0;   // jeda fallback setelah kegagalan API
  let elCfgKey = '';       // fingerprint konfigurasi terakhir untuk deteksi perubahan

  /* Pilih acak tanpa mengulang pilihan terakhir */
  function pick(arr, key) {
    let pool = arr;
    if (lastPick[key]) pool = arr.filter(x => x !== lastPick[key]);
    const item = pool[(Math.random() * pool.length) | 0] || arr[0];
    lastPick[key] = item;
    return item;
  }

  /* ================== ElevenLabs ================== */

  /* Pilih voice sesuai TUTOR SUARA profil aktif:
     - tutor perempuan  → femaleVoiceId (fallback: voiceId lama)
     - tutor laki-laki  → maleVoiceId (fallback: femaleVoiceId, lalu voiceId lama)
     Tiap gender punya cache suaranya sendiri (kunci cache = voiceId + teks),
     jadi berpindah tutor tidak memakai kredit dua kali untuk teks yang sama. */
  /* Mode server (cache bersama di server, hemat kredit): API key cukup di
     server, browser tidak perlu memegangnya. Voice tetap dipilih sesuai
     tutor gender profil aktif. */
  function elCfgFor(p) {
    const s = Store.getElevenLabs();
    const serverMode = !!(s && s.serverTts && s.serverUrl);
    if (!s || (!s.apiKey && !serverMode)) return null;
    const voice = (p && p.tutorGender === 'male')
      ? (s.maleVoiceId || s.femaleVoiceId || s.voiceId || '')
      : (s.femaleVoiceId || s.maleVoiceId || s.voiceId || '');
    if (!voice) return null;
    return {
      apiKey: s.apiKey || '',
      voiceId: voice,
      speed: Number(s.speed) || 0.75,
      serverTts: !!s.serverTts,
      serverUrl: s.serverUrl || '',
      serverToken: s.serverToken || '',
      gender: (p && p.tutorGender === 'male') ? 'male' : 'female'
    };
  }
  /* Konfigurasi yang dipakai sekarang: selalu baca SEGAR dari localStorage
     agar pengaturan yang disimpan di Admin langsung aktif tanpa perlu reload.
     elCfg hanya dipakai sebagai cache internal; selalu di-refresh dulu. */
  function effectiveCfg() {
    refreshEl(); // selalu ambil terbaru dari localStorage
    return elCfgFor(Store.getProfile()) || elCfg;
  }

  function refreshEl() {
    const s = Store.getElevenLabs() || {};
    const hasDirect = !!(s.apiKey && (s.voiceId || s.femaleVoiceId || s.maleVoiceId));
    const hasServer = !!(s.serverTts && s.serverUrl && (s.femaleVoiceId || s.maleVoiceId || s.voiceId));
    elCfg = (hasDirect || hasServer) ? s : null;
    // Reset cooldown jika konfigurasi berubah (deteksi via fingerprint)
    const newKey = (s.apiKey || '') + '|' + (s.femaleVoiceId || '') + '|' + (s.maleVoiceId || '') + '|' + (s.voiceId || '') + '|' + (s.serverUrl || '');
    if (newKey !== elCfgKey) { elCfgKey = newKey; elFailedUntil = 0; }
  }
  refreshEl();
  // Juga saat tab lain mengubah localStorage (misal: admin dan user di dua tab)
  window.addEventListener('storage', () => { refreshEl(); elFailedUntil = 0; });

  let dbPromise = null;
  /* DB lama (sebelum rebrand) — hanya dibaca sebagai cadangan sekali,
     supaya audio yang sudah di-generate tidak hilang (hemat kredit). */
  let oldDbPromise = null;
  function idb() {
    if (!dbPromise) {
      dbPromise = new Promise((res, rej) => {
        const rq = indexedDB.open('piskola-audio', 1);
        rq.onupgradeneeded = () => rq.result.createObjectStore('blobs');
        rq.onsuccess = () => res(rq.result);
        rq.onerror = () => rej(rq.error);
      });
    }
    return dbPromise;
  }
  function oldIdb() {
    if (!oldDbPromise) {
      oldDbPromise = new Promise((res) => {
        try {
          const rq = indexedDB.open('belajarbaca-audio', 1);
          rq.onsuccess = () => res(rq.result);
          rq.onerror = () => res(null);
        } catch (e) { res(null); }
      });
    }
    return oldDbPromise;
  }
  async function getFrom(db, key) {
    if (!db) return null;
    try {
      return await new Promise(res => {
        const rq = db.transaction('blobs').objectStore('blobs').get(key);
        rq.onsuccess = () => res(rq.result || null);
        rq.onerror = () => res(null);
      });
    } catch (e) { return null; }
  }
  async function cacheGet(key) {
    try {
      const hit = await getFrom(await idb(), key);
      if (hit) return hit;
      // Cadangan dari DB lama → pindahkan ke DB baru agar tak perlu generate ulang
      const old = await getFrom(await oldIdb(), key);
      if (old) { cacheSet(key, old); return old; }
      return null;
    } catch (e) { return null; }
  }
  async function cacheSet(key, blob) {
    try {
      const db = await idb();
      await new Promise((res, rej) => {
        const tx = db.transaction('blobs', 'readwrite');
        tx.objectStore('blobs').put(blob, key);
        tx.oncomplete = res;
        tx.onerror = rej;
      });
    } catch (e) { /* abaikan */ }
  }

  /* Putar blob; resolve saat selesai (atau dipotong/error). */
  function playBlob(blob, speed, volume) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(blob);
      const a = new Audio(url);
      if (speed && speed !== 1) a.playbackRate = speed;
      if (volume && volume !== 1) a.volume = Math.max(0, Math.min(1, volume));
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        URL.revokeObjectURL(url);
        if (currentAudio === a) currentAudio = null;
        resolve();
      };
      currentAudio = a;
      a.play().catch(finish);
      a.onended = finish;
      a.onerror = finish;
      a.onpause = finish; // dipotong oleh stopAudio() → jangan menggantung antrean
      setTimeout(finish, 20000); // pengaman: jangan pernah menggantung antrean
    });
  }

  /* Kecepatan ElevenLabs: relatif terhadap kecepatan dasar & lafal per teks.
     Materi belajar (rate 0.7) → lebih pelan; pujian (rate 0.85) → lebih hidup.
     BATAS API ElevenLabs: speed harus di rentang 0.7–1.2. */
  function elSpeedFor(cfg, rate) {
    const base = Number(cfg.speed) || 0.75;
    const r = rate || 0.78;
    const s = base * (r / 0.78);
    return Math.max(0.7, Math.min(1.2, Math.round(s * 100) / 100));
  }

  /* Nomor generasi pembatalan: dinaikkan tiap stopAudio() (flush).
     Permintaan/fetch yang tertunda dari generasi lama tidak akan diputar
     atau di-cache — mencegah suara lama muncul setelah tombol 'dengar lagi'. */
  let cancelGen = 0;

  /* Generate (dan putar jika opts.play) satu teks via ElevenLabs.
     Hasil selalu di-cache → teks sama tidak pernah memakai kredit lagi.
     Kembali { ok, msg }.
     ANTI-MACET: fetch dibatasi 10 dtk (AbortController) dan antrean selalu
     berjalan, jadi permintaan yang menggantung TIDAK pernah membuat suara
     berikutnya (atau tombol 'dengar lagi') ikut macet. */
  /* Mode SERVER: server memegang API key, meng-generate sekali per teks,
     menyimpan MP3 ke disk, lalu memutar ulang (0 kredit). Endpoint:
     {serverUrl}?text=..&voice=..&speed=..[&token=..] → audio/mpeg */
  function serverSpeak(cfg, text, speed, volume, play) {
    const url = new URL(cfg.serverUrl, location.href);
    // Normalisasi: pastikan berakhir dengan /tts (mis. user mengisi domain saja)
    if (!/\/tts$/i.test(url.pathname)) url.pathname = url.pathname.replace(/\/+$/, '') + '/tts';
    url.searchParams.set('text', text);
    url.searchParams.set('voice', cfg.voiceId);
    url.searchParams.set('speed', String(speed));
    if (cfg.serverToken) url.searchParams.set('token', cfg.serverToken);
    const gen = cancelGen;
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 15000); // 15 dtk, jangan pernah macet
    return fetch(url, { signal: ctrl.signal })
      .then(async (res) => {
        clearTimeout(to);
        if (gen !== cancelGen) return { ok: false, msg: 'dibatalkan' };
        if (!res.ok) {
          const detail = await res.text().catch(() => '');
          console.warn('[TTS-Server] gagal (' + res.status + '):', detail.slice(0, 300));
          return { ok: false, msg: 'Server TTS ' + res.status + ' ' + detail.slice(0, 160) };
        }
        const blob = await res.blob();
        if (gen !== cancelGen) return { ok: false, msg: 'dibatalkan' };
        return play
          ? playBlob(blob, speed, volume).then(() => ({ ok: true, msg: 'ok', blob }))
          : { ok: true, msg: 'ok' }; // cukup generate & cache di server
      })
      .catch(err => ({ ok: false, msg: 'Gagal terhubung: ' + err.message }));
  }

  /* Generate (dan putar jika opts.play) satu teks via ElevenLabs.
     Hasil selalu di-cache → teks sama tidak pernah memakai kredit lagi.
     Kembali { ok, msg }.
     ANTI-MACET: fetch dibatasi 10 dtk (AbortController) dan antrean selalu
     berjalan, jadi permintaan yang menggantung TIDAK pernah membuat suara
     berikutnya (atau tombol 'dengar lagi') ikut macet. */
  function elSpeak(rawText, cfgOverride, opts) {
    const cfg = cfgOverride || elCfg;
    const play = opts ? opts.play !== false : true;
    if (!cfg) return Promise.resolve({ ok: false, msg: 'ElevenLabs belum dikonfigurasi' });
    if (Date.now() < elFailedUntil) return Promise.resolve({ ok: false, msg: 'fallback (kegagalan sebelumnya)' });
    
    // Perbaikan pelafalan untuk 1 huruf (ElevenLabs v2 sering baca bahasa Inggris)
    let text = rawText.trim();
    if (/^[A-Za-z]$/.test(text)) {
      const map = {
        'a': 'a', 'b': 'bé', 'c': 'cé', 'd': 'dé', 'e': 'é', 'f': 'èf', 'g': 'gé', 'h': 'ha', 'i': 'i', 'j': 'jé',
        'k': 'ka', 'l': 'èl', 'm': 'èm', 'n': 'èn', 'o': 'o', 'p': 'pé', 'q': 'qi', 'r': 'èr', 's': 'ès', 't': 'té',
        'u': 'u', 'v': 'vi', 'w': 'wé', 'x': 'èks', 'y': 'yé', 'z': 'zèt'
      };
      text = map[text.toLowerCase()] || text;
    }
    
    const speed = elSpeedFor(cfg, opts ? opts.rate : null);
    const volume = cfg.gender === 'female' ? 0.6 : 1.0; // Turunkan volume tutor perempuan agar seimbang
    const key = cfg.voiceId + '|' + text; // kunci cache TIDAK TERMASUK kecepatan agar bisa ganti kecepatan tanpa potong pulsa/kuota
    
    const gen = cancelGen;
    const serverMode = !!(cfg.serverTts && cfg.serverUrl);

    /* Kembalikan promise PER-ITEM (bukan elChain) agar .then(r=>) di playText
       selalu mendapat hasil yang tepat untuk teks ini, bukan hasil dari
       item lain yang di-queue sebelumnya (race condition lama). */
    let resolveItem, rejectItem;
    const itemPromise = new Promise((res, rej) => { resolveItem = res; rejectItem = rej; });

    elChain = elChain.then(() =>
      cacheGet(key).then(hit => {
        if (gen !== cancelGen) { resolveItem({ ok: false, msg: 'dibatalkan' }); return { ok: false, msg: 'dibatalkan' }; }
        if (hit) {
          const p = play ? playBlob(hit, speed, volume).then(() => ({ ok: true, msg: 'cache' })) : Promise.resolve({ ok: true, msg: 'cache' });
          return p.then(r => { resolveItem(r); return r; });
        }

        /* Mode server: server meng-generate & meng-cache sekali untuk SEMUA user */
        if (serverMode) {
          return serverSpeak(cfg, text, speed, volume, play).then(r => {
            if (r.ok && r.blob) cacheSet(key, r.blob);
            if (!r.ok && r.msg !== 'dibatalkan') elFailedUntil = Date.now() + 30000;
            resolveItem(r);
            return r;
          });
        }

        const ctrl = new AbortController();
        const to = setTimeout(() => ctrl.abort(), 10000); // 10 dtk, jangan pernah macet
        return fetch('https://api.elevenlabs.io/v1/text-to-speech/' + encodeURIComponent(cfg.voiceId), {
          method: 'POST',
          headers: { 'xi-api-key': cfg.apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.45,
              similarity_boost: 0.85,
              style: 0.55,
              use_speaker_boost: true
            }
          }),
          signal: ctrl.signal
        }).then(async (res) => {
          clearTimeout(to);
          if (gen !== cancelGen) { resolveItem({ ok: false, msg: 'dibatalkan' }); return { ok: false, msg: 'dibatalkan' }; }
          if (!res.ok) {
            const detail = await res.text().catch(() => '');
            console.warn('[ElevenLabs] gagal (' + res.status + '):', detail.slice(0, 300));
            const r = { ok: false, msg: 'ElevenLabs ' + res.status + ' ' + detail.slice(0, 160) };
            elFailedUntil = Date.now() + 30000;
            resolveItem(r);
            return r;
          }
          const blob = await res.blob();
          if (gen !== cancelGen) { resolveItem({ ok: false, msg: 'dibatalkan' }); return { ok: false, msg: 'dibatalkan' }; }
          cacheSet(key, blob);
          if (play) {
            return playBlob(blob, speed, volume).then(() => { const r = { ok: true, msg: 'ok' }; resolveItem(r); return r; });
          }
          const r = { ok: true, msg: 'ok' }; resolveItem(r); return r;
        }).catch(err => {
          clearTimeout(to);
          const r = { ok: false, msg: 'Gagal terhubung: ' + err.message };
          if (r.msg !== 'dibatalkan') elFailedUntil = Date.now() + 30000;
          resolveItem(r);
          return r;
        });
      }).catch(err => {
        const r = { ok: false, msg: 'Error internal: ' + err.message };
        resolveItem(r);
        return r;
      })
    );
    return itemPromise; // ← per-item, bukan seluruh chain
  }

  function stopAudio() {
    cancelGen++;                    // batalkan permintaan ElevenLabs yang tertunda
    elChain = Promise.resolve();    // antrean ElevenLabs tidak pernah macet
    speakChain = Promise.resolve(); // kosongkan antrean yang belum diputar
    if (currentAudio) { try { currentAudio.pause(); } catch (e) { } currentAudio = null; }
    if (window.speechSynthesis) { try { speechSynthesis.cancel(); } catch (e) { } }
  }

  /* ================== Web Speech (fallback) ================== */

  function pickVoice() {
    try {
      const vs = window.speechSynthesis ? speechSynthesis.getVoices() : [];
      return vs.find(v => v.lang === 'id-ID')
        || vs.find(v => v.lang && v.lang.toLowerCase().startsWith('id'))
        || null;
    } catch (e) { return null; }
  }
  function refreshVoice() { voice = pickVoice(); }
  if (window.speechSynthesis) {
    refreshVoice();
    speechSynthesis.onvoiceschanged = refreshVoice;
  }

  /* Ucapkan; panggil onEnd saat selesai (agar antrean lanjut). */
  function wsSpeak(text, opts, onEnd) {
    if (muted || !window.speechSynthesis) { if (onEnd) onEnd(); return; }
    const o = opts || {};
    try {
      // Bug Android: speechSynthesis kadang 'macet' setelah cancel — resume() menyegarkannya
      if (window.speechSynthesis.resume) { try { window.speechSynthesis.resume(); } catch (e) { } }
      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.lang = 'id-ID';
      u.rate = o.rate ?? 0.78;
      u.pitch = o.pitch ?? 1.12;
      if (onEnd) { u.onend = onEnd; u.onerror = onEnd; }
      speechSynthesis.speak(u);
    } catch (e) { if (onEnd) onEnd(); }
  }

  /* ================== ANTREAN SERIAL ================== */

  function playText(text, opts) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = () => { if (!settled) { settled = true; resolve(); } };
      const guard = setTimeout(finish, 12000); // pengaman: jangan menggantung antrean
      const done = () => { clearTimeout(guard); finish(); };

      const cfg = effectiveCfg();
      if (cfg) {
        elSpeak(text, cfg, { rate: opts ? opts.rate : null }).then(r => {
          if (r && r.ok) {
            done(); // audio ElevenLabs sudah diputar & selesai
          } else {
            // ElevenLabs gagal → fallback ke Web Speech
            const msg = (r && r.msg) || '';
            console.info('[Audio] ElevenLabs fallback:', msg);
            wsSpeak(text, opts || {}, done);
          }
        }).catch(() => wsSpeak(text, opts || {}, done));
      } else {
        wsSpeak(text, opts || {}, done);
      }
    });
  }

  function speak(text, opts = {}) {
    if (muted || !text) return;
    if (opts.flush) stopAudio(); // potong suara & antrean lama, mulai dari sini
    speakChain = speakChain.then(() => playText(text, opts)).catch(() => { });
  }

  /* ================== API publik ================== */

  function setMuted(v) { muted = v; if (v) stopAudio(); }
  function isMuted() { return muted; }

  /* Tes suara dari halaman Admin (memakai konfigurasi yang sedang diisi) */
  function testVoice(text, cfg) {
    stopAudio();
    return elSpeak(text, cfg);
  }

  /* Prewarm: generate & simpan suara DIAM-DIAM (tanpa diputar) supaya sapaan
     nama/panggilan siap tanpa memakai kredit lagi setelahnya. Memakai voice
     sesuai tutor gender profil aktif. */
  function prewarm(text) {
    refreshEl();
    const cfg = elCfgFor(Store.getProfile()) || elCfg;
    if (!cfg || muted || !text) return;
    elSpeak(text, cfg, { play: false }).catch(() => { });
  }

  /* Nama huruf ditulis TANPA aksen (spelling umum di buku anak): sebagian
     engine TTS membaca 'wé' sebagai dua suku kata ('we-e' → terdengar
     "we we"). 'be, ce, de, ... we, eks' dibaca pelan & jelas oleh TTS. */
  const LETTER_NAMES = {
    a: 'a', b: 'be', c: 'ce', d: 'de', e: 'e', f: 'ef', g: 'ge', h: 'ha', i: 'i',
    j: 'je', k: 'ka', l: 'el', m: 'em', n: 'en', o: 'o', p: 'pe', q: 'ki', r: 'er',
    s: 'es', t: 'te', u: 'u', v: 've', w: 'we', x: 'eks', y: 'ye', z: 'zet'
  };

  /* Benda yang diucapkan: 1 huruf → nama huruf; suku kata/kata → teks pelan */
  function speakItem(item, opts = {}) {
    if (item.length === 1) speak(LETTER_NAMES[item.toLowerCase()] || item, { rate: 0.7, ...opts });
    else speak(item, { rate: 0.72, ...opts });
  }
  function speakLetter(letter) { speakItem(letter); }

  /* ---- Pujian dinamis, antusias, dan bervariasi ---- */
  function nameCall(p) {
    return (p.panggilan === 'kakak' ? 'Kakak' : 'Adek') + ' ' + p.nama;
  }
  function muslimOn(p) { return !!(p && p.muslim); }

  function praiseSentence(p) {
    const n = nameCall(p);
    let starter = pick(STARTERS, 'starter');
    const word = pick(PRAISE, 'word');
    // hindari pola "... top! Top!" — starter tidak boleh sama dengan kata pujian
    if (starter.toLowerCase() === word) {
      const alt = pick(STARTERS.filter(s => s.toLowerCase() !== word), 'starter');
      if (alt) starter = alt;
    }
    /* Penutup relevan dengan pelajaran (baca/hitung) dan TIDAK pernah
       mengulang kata 'sekali' yang sudah ada di kata pujian. */
    let suffixes = subject === 'hitung' ? SUFFIX_MATH : SUFFIX;
    if (word.indexOf('sekali') !== -1) suffixes = suffixes.filter(s => s.indexOf('sekali') === -1);
    // hindari pengulangan kata yang sama (mis. "keren! Keren!")
    suffixes = suffixes.filter(s => s.trim().toLowerCase().replace(/!/g, '') !== word);
    const suffix = pick(suffixes, 'suffix');
    // beberapa pola agar tidak monoton
    const patterns = [
      starter + ', ' + n + ' ' + word + '!',
      starter + '! ' + n + ' ' + word + '!',
      n + ' ' + word + '! ' + starter + '!',
      starter + ', ' + n + ' memang ' + word + '!'
    ];
    // Tutor muslim: selipkan pujian islami agar suasana belajar lebih islami
    if (muslimOn(p)) {
      patterns.push(
        'MasyaAllah, ' + n + ' ' + word + '!',
        'Alhamdulillah, ' + n + ' ' + word + '!',
        'MasyaAllah! ' + n + ' memang ' + word + '!',
        'Subhanallah, ' + n + ' ' + word + ' sekali!',
        'MasyaAllah, tabarakallah, ' + n + ' ' + word + '!',
        'Alhamdulillah! ' + n + ' hebat sekali!'
      );
    }
    return patterns[(Math.random() * patterns.length) | 0] + suffix;
  }

  /* Nada bicara: pujian/semangat → pitch lebih tinggi & sedikit lebih cepat */
  function praiseOpts() { return { rate: 0.85, pitch: 1.38 }; }

  function praiseCorrect(p) { speak(praiseSentence(p), praiseOpts()); }
  function praiseStreak(p) {
    let pool = STREAK;
    if (muslimOn(p)) {
      pool = pool.concat([
        'MasyaAllah, ' + nameCall(p) + ' hebat sekali! Teruskan!',
        'Alhamdulillah, ' + nameCall(p) + ' menjawab berturut-turut! Hebat!'
      ]);
    }
    speak(pick(pool, 'streak').replace('%N%', nameCall(p)), praiseOpts());
  }
  function praiseGame(p, stars) {
    let pool = stars >= 3 ? GAME_DONE_3 : GAME_DONE;
    if (muslimOn(p)) {
      pool = pool.concat([
        (stars >= 3 ? 'MasyaAllah! ' : 'Alhamdulillah, ') + '%N% dapat bintang %S%!',
        'MasyaAllah, %N% hebat sekali, dapat bintang %S%!',
        'Alhamdulillah, %N% menyelesaikan dengan bintang %S%!'
      ]);
    }
    const t = pick(pool, 'gamedone').replace('%N%', nameCall(p)).replace('%S%', String(stars));
    speak(t, praiseOpts());
  }
  function praiseUnit(p) {
    let pool = UNIT_DONE;
    if (muslimOn(p)) {
      pool = pool.concat([
        'MasyaAllah! ' + nameCall(p) + ' sudah mahir unit ini!',
        'Alhamdulillah, ' + nameCall(p) + ' menuntaskan unit ini! Hebat!'
      ]);
    }
    speak(pick(pool, 'unitdone').replace('%N%', nameCall(p)), praiseOpts());
  }
  function encourage() {
    speak(pick(ENCOURAGE, 'enc'), { rate: 0.82, pitch: 1.15 });
  }

  function greetText(p) {
    const math = subject === 'hitung';
    let pool = math ? GREET_MATH : GREET;
    if (muslimOn(p)) pool = math ? GREET_MATH_MUSLIM : GREET_MUSLIM;
    return pick(pool, 'greet').replace('%N%', nameCall(p));
  }
  function greet(p) { speak(greetText(p), { rate: 0.8, pitch: 1.22 }); }

  /* Sambutan saat masuk game (islami → diawali Bismillah) */
  function gameWelcome(p, kalimat) {
    const prefix = muslimOn(p) ? 'Bismillah! ' : '';
    speak(prefix + kalimat + ', ' + nameCall(p) + ' siap ya!', { rate: 0.78, pitch: 1.25 });
  }

  /* ---- Angka 0–100 → kata bahasa Indonesia (untuk belajar hitung) ---- */
  const SATUAN = ['nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
  const BELAS = ['sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas',
    'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas'];
  function angkaKeKata(n) {
    n = Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
    if (n <= 9) return SATUAN[n];
    if (n < 20) return BELAS[n - 10];
    if (n === 100) return 'seratus';
    const puluh = Math.floor(n / 10);
    const satu = n % 10;
    const puluhKata = SATUAN[puluh] + ' puluh';
    return satu ? puluhKata + ' ' + SATUAN[satu] : puluhKata;
  }

  /* ---- Efek suara (WebAudio) ---- */
  let ctx = null;
  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type = 'triangle', gain = 0.12, delay = 0) {
    if (muted) return;
    try {
      const c = ac();
      const t = c.currentTime + delay;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + dur + 0.02);
    } catch (e) { /* abaikan */ }
  }
  const sfx = {
    tap: () => tone(520, 0.06, 'square', 0.05),
    correct: () => { tone(660, 0.12, 'triangle', 0.14); tone(880, 0.16, 'triangle', 0.14, 0.1); },
    wrong: () => tone(210, 0.2, 'sine', 0.1),
    connect: () => { tone(523, 0.1, 'triangle', 0.12); tone(784, 0.14, 'triangle', 0.12, 0.09); },
    stroke: () => tone(740, 0.07, 'sine', 0.09),
    letterDone: () => { tone(523, 0.1, 'triangle', 0.12); tone(659, 0.1, 'triangle', 0.12, 0.09); tone(784, 0.18, 'triangle', 0.12, 0.18); },
    fanfare: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.12, i * 0.11)); }
  };

  return {
    setMuted, isMuted, speak, speakItem, speakLetter, testVoice,
    refreshConfig: refreshEl, // dipanggil app.js setelah fetch config dari server
    prewarm, angkaKeKata,
    setSubject,
    praiseCorrect, praiseStreak, praiseGame, praiseUnit, encourage, greet, greetText, gameWelcome,
    sfx
  };
})();
