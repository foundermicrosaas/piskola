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
    if (params.mode === 'word2pic') {
      // 8 pasangan acak (atau semua yang ada)
      let selected = shuffle(params.pool || []).slice(0, 8);
      // pastikan minimal 4 untuk mengisi grid
      if (selected.length < 4) selected = selected.concat(selected); 
      return selected.slice(0, 8).map(w => {
        return { a: w.word, b: w.emoji, bEmoji: true };
      });
    }
    // mode fallback jika ada yang salah panggil
    return [];
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
        cards.map((c, i) => {
          const fontClass = !c.emoji && c.label.length > 5 ? 'long-word' : '';
          return '<button class="mem-card" data-i="' + i + '" data-pair="' + c.pair + '" data-side="' + c.side + '">' +
            '<span class="mem-back">?</span>' +
            '<span class="mem-front' + (c.emoji ? ' emoji' : ' trace-font ' + fontClass) + '">' + c.label + '</span>' +
          '</button>';
        }).join('') +
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
