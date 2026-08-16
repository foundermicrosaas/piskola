/* Game — Kartu Pasangan (memory):
   Buka dua kartu, temukan pasangannya.
   - mode 'case': pasangan huruf besar ↔ huruf kecil
   - mode 'suku': pasangan suku kata ↔ gambar kata */
window.GameMemory = (() => {
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

  function buildPairs(params) {
    if (params.mode === 'suku') {
      return params.syllables.map(sy => {
        const [word, emoji] = params.words[sy][0];
        return { a: sy, b: emoji, bEmoji: true };
      });
    }
    if (params.mode === 'kata') {
      return params.pool.slice(0, 8).map(w => {
        return { a: w.word, b: w.emoji, bEmoji: true };
      });
    }
    const upper = params.letterCase === 'upper';
    return params.letters.slice(0, 8).map(ch => ({
      a: upper ? ch : ch.toUpperCase(),
      b: upper ? ch.toLowerCase() : ch.toLowerCase(),
      bEmoji: false
    }));
  }

  function start(params) {
    active = true;
    timers = [];
    const pairs = buildPairs(params);
    // Kartu: [ {pair, side} ... ] — 2 kartu per pasangan
    const cards = shuffle(pairs.flatMap((p, i) => [
      { pair: i, side: 'a', label: p.a },
      { pair: i, side: 'b', label: p.b, emoji: p.bEmoji }
    ]));

    let mistakes = 0;
    let open = [];          // kartu yang sedang terbuka (indeks)
    let locked = false;
    let matchedCount = 0;

    const area = document.getElementById('game-area');
    const progressEl = document.getElementById('game-progress');
    progressEl.textContent = 'Cari ' + pairs.length + ' pasangan';

    area.innerHTML =
      '<p class="match-hint">Buka kartu dan temukan pasangannya! 🃏</p>' +
      '<div class="mem-grid cols-' + Math.min(4, cards.length / 2) + '">' +
        cards.map((c, i) =>
          '<button class="mem-card" data-i="' + i + '" data-pair="' + c.pair + '" data-side="' + c.side + '">' +
            '<span class="mem-back">?</span>' +
            '<span class="mem-front' + (c.emoji ? ' emoji' : ' trace-font') + '">' + c.label + '</span>' +
          '</button>'
        ).join('') +
      '</div>';

    const btns = area.querySelectorAll('.mem-card');

    function flipBack(idx) {
      const b = btns[idx];
      if (b && !b.classList.contains('matched')) b.classList.remove('flipped');
    }

    function finish() {
      clearTimers();
      const accuracy = Math.round((pairs.length / (pairs.length + mistakes)) * 100);
      const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      AudioSys.sfx.fanfare();
      Confetti.rain(50);
      later(() => {
        active = false;
        params.onDone({ stars, accuracy, plays: 1 });
      }, 700);
    }

    btns.forEach(btn => btn.addEventListener('click', () => {
      if (!active || locked || btn.classList.contains('flipped') || btn.classList.contains('matched')) return;
      AudioSys.sfx.tap();
      btn.classList.add('flipped');
      open.push(btn);

      if (open.length === 2) {
        locked = true;
        const [b1, b2] = open;
        if (b1.dataset.pair === b2.dataset.pair) {
          matchedCount++;
          b1.classList.add('matched');
          b2.classList.add('matched');
          open = [];
          AudioSys.sfx.correct();
          AudioSys.praiseCorrect(params.profile);
          later(() => {
            locked = false;
            if (matchedCount === pairs.length) finish();
          }, 350);
        } else {
          mistakes++;
          AudioSys.sfx.wrong();
          later(() => {
            flipBack(Number(b1.dataset.i));
            flipBack(Number(b2.dataset.i));
            open = [];
            locked = false;
          }, 750);
        }
      }
    }));
  }

  function cancel() { active = false; clearTimers(); }

  return { start, cancel };
})();
