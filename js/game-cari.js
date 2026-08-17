/* Game — Cari Kata:
   Sebuah kotak berisi ubin; anak mencari & mengetuk SEMUA ubin yang
   berisi kata yang diminta (3 salinan tersembunyi di antara ubin lain).
   5 ronde → bintang dari akurasi. */
window.GameCari = (() => {
  let active = false;
  let timers = [];
  let state = null;

  function later(fn, ms) { const t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function shuffle(a) {
    const arr = a.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const ROUNDS = 5;
  const HIDDEN = 3;   // jumlah kata yang dicari
  const CELLS = 12;   // total ubin (3 baris × 4 kolom)

  function start(params) {   // FIX: gunakan params sebagai objek utuh agar onDone bisa diakses di finish()
    active = true;
    timers = [];
    const pool = params.pool;
    const onDone = params.onDone;  // FIX: simpan referensi onDone di scope yang bisa diakses finish()

    let round = 0, foundCount = 0, correctTaps = 0, wrongTaps = 0;
    let current = null; // { target, cells: [...] }

    const area = document.getElementById('game-area');
    const progressEl = document.getElementById('game-progress');

    function renderRound() {
      if (!active) return;
      progressEl.textContent = 'Ronde ' + (round + 1) + '/' + ROUNDS;
      // pilih target yang berbeda dari ronde sebelumnya
      let targetObj = pool[(Math.random() * pool.length) | 0];
      let prev = current && current.target;
      let guard = 0;
      while (targetObj.word === (prev && prev.word) && guard++ < 8) {
        targetObj = pool[(Math.random() * pool.length) | 0];
      }

      // susun grid: HIDDEN salinan target + sisanya pengalih (boleh berulang)
      const others = pool.filter(w => w.word !== targetObj.word);
      const distractors = [];
      for (let i = 0; i < CELLS - HIDDEN; i++) {
        distractors.push(others[(Math.random() * others.length) | 0]);
      }
      const cells = shuffle([].concat(new Array(HIDDEN).fill(targetObj), distractors));
      current = { target: targetObj, cells };
      foundCount = 0;

      area.innerHTML =
        '<div class="game-question">' +
          '<p class="match-hint" style="margin:0;">Temukan semua kata <b class="cari-target">' + current.target.word + '</b> ! 🔍</p>' +
          '<button class="btn-speaker" id="btn-speaker" aria-label="Dengar lagi">🔊</button>' +
          '<p class="cari-counter"><span id="cari-found">0</span>/' + HIDDEN + ' ditemukan</p>' +
        '</div>' +
        '<div class="cari-grid word-grid">' +
          cells.map((c, i) => {
            const fontClass = c.word.length > 5 ? 'long-word' : c.word.length > 8 ? 'very-long-word' : '';
            return '<button class="cari-tile ' + fontClass + '" data-i="' + i + '"><span class="cari-cell trace-font">' + c.word + '</span></button>';
          }).join('') +
        '</div>';

      document.getElementById('btn-speaker').addEventListener('click', () => AudioSys.speakItem(current.target.word, { flush: true }));

      const tiles = area.querySelectorAll('.cari-tile');
      tiles.forEach(t => t.addEventListener('click', () => onTap(t, cells[Number(t.dataset.i)])));

      // auto-play tanpa flush (tidak memotong suara apa pun)
      later(() => AudioSys.speakItem(current.target.word), 350);
    }

    function onTap(tile, valObj) {
      if (!active || tile.classList.contains('found') || tile.classList.contains('wrong')) return;
      if (valObj.word === current.target.word) {
        tile.classList.add('found');
        correctTaps++;
        foundCount++;
        const ctr = document.getElementById('cari-found');
        if (ctr) ctr.textContent = foundCount;
        AudioSys.sfx.correct();
        const rect = tile.getBoundingClientRect();
        Confetti.burst(10, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
        if (foundCount >= HIDDEN) {
          later(() => {
            round++;
            if (round >= ROUNDS) finish();
            else renderRound();
          }, 900);
        }
      } else {
        wrongTaps++;
        tile.classList.add('wrong');
        AudioSys.sfx.wrong();
        AudioSys.encourage();
        later(() => tile.classList.remove('wrong'), 450);
      }
    }

    function finish() {
      if (!active) return;
      clearTimers();
      const attempts = correctTaps + wrongTaps;
      const accuracy = attempts ? Math.round((correctTaps / attempts) * 100) : 100;
      const stars = accuracy >= 95 ? 3 : accuracy >= 85 ? 2 : 1;
      AudioSys.sfx.fanfare();
      Confetti.rain(50);
      later(() => {
        active = false;
        onDone({ stars, accuracy, plays: 1 });  // FIX: onDone lokal, bukan params.onDone
      }, 700);
    }

    renderRound();
  }

  function cancel() { active = false; clearTimers(); }

  return { start, cancel };
})();
