/* Game — Susun Kata:
   Susun huruf (atau suku kata) yang diacak jadi kata yang benar,
   dengan gambar sebagai petunjuk. */
window.GameSusun = (() => {
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

  function start(params) {
    active = true;
    timers = [];
    const pool = params.pool.filter(w => w.word.length <= 7);

    let round = 0, correctTaps = 0, attempts = 0;

    const area = document.getElementById('game-area');
    const progressEl = document.getElementById('game-progress');

    function partsFor(w) {
      if (params.mode === 'suku') return w.word.match(/.{1,2}/g) || [w.word];
      return w.word.split('');
    }

    function renderRound() {
      if (!active || !pool.length) return;
      progressEl.textContent = (round + 1) + '/' + ROUNDS;
      let w = pool[(Math.random() * pool.length) | 0];
      let prev = state && state.word;
      let guard = 0;
      while (w.word === prev && guard++ < 8) w = pool[(Math.random() * pool.length) | 0];
      state = { word: w.word };

      const parts = partsFor(w);
      const tiles = shuffle(parts.map((p, i) => ({ p, i })));

      area.innerHTML =
        '<div class="quiz-prompt">' +
          '<span class="quiz-emoji big">' + w.emoji + '</span>' +
          '<p class="match-hint">Susun huruf-hurufnya jadi kata! 🧩</p>' +
        '</div>' +
        '<div class="build-slots">' +
          parts.map(() => '<span class="build-slot"></span>').join('') +
        '</div>' +
        '<div class="build-tiles">' +
          tiles.map((t, i) =>
            '<button class="build-tile trace-font" data-i="' + t.i + '" data-p="' + t.p + '">' + t.p + '</button>'
          ).join('') +
        '</div>';

      const slots = area.querySelectorAll('.build-slot');
      const btns = area.querySelectorAll('.build-tile');
      let fillIdx = 0;

      btns.forEach(btn => btn.addEventListener('click', () => {
        if (!active || btn.classList.contains('used')) return;
        const expected = parts[fillIdx];
        attempts++;
        if (btn.dataset.p === expected) {
          btn.classList.add('used');
          slots[fillIdx].textContent = expected;
          slots[fillIdx].classList.add('filled');
          fillIdx++;
          correctTaps++;
          AudioSys.sfx.correct();
          if (fillIdx === parts.length) {
            AudioSys.praiseCorrect(params.profile);
            const rect = slots[slots.length - 1].getBoundingClientRect();
            Confetti.burst(14, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
            later(() => {
              round++;
              if (round >= ROUNDS) finish();
              else renderRound();
            }, 850);
          }
        } else {
          btn.classList.add('wrong');
          AudioSys.sfx.wrong();
          AudioSys.encourage();
          later(() => btn.classList.remove('wrong'), 500);
        }
      }));
    }

    function finish() {
      clearTimers();
      const accuracy = attempts ? Math.round((correctTaps / attempts) * 100) : 100;
      const stars = attempts === correctTaps ? 3 : (attempts - correctTaps) <= 2 ? 2 : 1;
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
