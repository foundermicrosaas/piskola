/* Game — Cari Huruf / Cari Suku Kata:
   Sebuah kotak berisi 20 ubin; anak mencari & mengetuk SEMUA ubin yang
   berisi huruf/suku kata yang diminta (5 salinan tersembunyi di antara
   ubin lain). Bedanya dengan kuis biasa: anak MEMBURU & MENGUMPULKAN —
   lebih interaktif dan melatih ketelitian. 5 ronde → bintang dari akurasi. */
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
  const HIDDEN = 5;   // jumlah salinan huruf/suku kata yang dicari
  const CELLS = 20;   // total ubin (4 baris × 5 kolom)

  function start(params) {
    active = true;
    timers = [];
    const items = params.items;
    const show = (it) => {
      if (params.display === 'upper') return it.toUpperCase();
      if (params.display === 'lower') return it.toLowerCase();
      return it;
    };

    let round = 0, foundCount = 0, correctTaps = 0, wrongTaps = 0;
    let current = null; // { target, cells: [...] }

    const area = document.getElementById('game-area');
    const progressEl = document.getElementById('game-progress');

    function renderRound() {
      if (!active) return;
      progressEl.textContent = 'Ronde ' + (round + 1) + '/' + ROUNDS;
      // pilih target yang berbeda dari ronde sebelumnya
      let target = items[(Math.random() * items.length) | 0];
      let prev = current && current.target;
      let guard = 0;
      while (target === prev && guard++ < 8) target = items[(Math.random() * items.length) | 0];

      // susun grid: 5 salinan target + sisanya pengalih (boleh berulang)
      const others = items.filter(i => i !== target);
      const distractors = [];
      for (let i = 0; i < CELLS - HIDDEN; i++) {
        distractors.push(others[(Math.random() * others.length) | 0]);
      }
      const cells = shuffle([].concat(new Array(HIDDEN).fill(target), distractors));
      current = { target, cells };
      foundCount = 0;

      area.innerHTML =
        '<div class="game-question">' +
          '<p class="match-hint" style="margin:0;">Temukan semua <b class="cari-target">' + show(target) + '</b> di kotak ajaib! 🔍</p>' +
          '<button class="btn-speaker" id="btn-speaker" aria-label="Dengar lagi">🔊</button>' +
          '<p class="cari-counter"><span id="cari-found">0</span>/' + HIDDEN + ' ditemukan</p>' +
        '</div>' +
        '<div class="cari-grid">' +
          cells.map((c, i) =>
            '<button class="cari-tile" data-i="' + i + '"><span class="cari-cell trace-font">' + show(c) + '</span></button>'
          ).join('') +
        '</div>';

      document.getElementById('btn-speaker').addEventListener('click', () => AudioSys.speakItem(target, { flush: true }));

      const tiles = area.querySelectorAll('.cari-tile');
      tiles.forEach(t => t.addEventListener('click', () => onTap(t, cells[Number(t.dataset.i)])));

      // auto-play tanpa flush (tidak memotong suara apa pun)
      later(() => AudioSys.speakItem(target), 350);
    }

    function onTap(tile, val) {
      if (!active || tile.classList.contains('found') || tile.classList.contains('wrong')) return;
      if (val === current.target) {
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
      clearTimers();
      const attempts = correctTaps + wrongTaps;
      const accuracy = attempts ? Math.round((correctTaps / attempts) * 100) : 100;
      const stars = accuracy >= 95 ? 3 : accuracy >= 85 ? 2 : 1;
      AudioSys.sfx.fanfare();
      Confetti.rain(50);
      later(() => {
        active = false;
        params.onDone({ stars, accuracy, plays: 1 });
      }, 700);
    }

    renderRound();
  }

  function cancel() { active = false; clearTimers(); }

  return { start, cancel };
})();
