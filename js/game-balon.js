/* Game — Balon Huruf / Balon Suku Kata:
   Balon-balon naik berisi huruf/suku kata; dengar instruksi, lalu
   pecahkan balon yang benar. */
window.GameBalon = (() => {
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

  const ROUNDS = 6;

  function start(params) {
    active = true;
    timers = [];
    const items = params.items;
    
    // Siapkan audio huruf/suku kata di background
    items.forEach(item => AudioSys.prewarmItem(item));
    
    const show = (it) => {
      if (params.display === 'upper') return it.toUpperCase();
      if (params.display === 'lower') return it.toLowerCase();
      return it;
    };

    let round = 0, correct = 0, attempts = 0, busy = false;

    const area = document.getElementById('game-area');
    const progressEl = document.getElementById('game-progress');

    function renderRound() {
      if (!active) return;
      progressEl.textContent = (round + 1) + '/' + ROUNDS;
      let target = items[(Math.random() * items.length) | 0];
      let prev = state && state.target;
      let guard = 0;
      while (target === prev && guard++ < 8) target = items[(Math.random() * items.length) | 0];
      state = { target };

      const choices = shuffle([target, ...shuffle(items.filter(i => i !== target)).slice(0, 4)]);

      area.innerHTML =
        '<p class="match-hint">Dengarkan, lalu pecahkan balon yang benar! 🎈</p>' +
        '<div class="balloon-stage" id="balloon-stage">' +
          choices.map((it, i) =>
            '<button class="balloon" data-it="' + it + '" style="left:' + (8 + i * 19) + '%;animation-delay:' + (i * 0.7) + 's">' +
              '<span class="balloon-fill"></span>' +
              '<span class="balloon-label">' + show(it) + '</span>' +
              '<span class="balloon-string"></span>' +
            '</button>'
          ).join('') +
        '</div>';

      busy = true;
      const playPrompt = () => AudioSys.speakItem(target, { flush: true });
      window.lastGamePrompt = playPrompt;
      later(playPrompt, 400);
      later(() => { busy = false; }, 900);

      area.querySelectorAll('.balloon').forEach(b => {
        b.addEventListener('click', () => {
          if (!active || busy || b.classList.contains('done')) return;
          attempts++;
          if (b.dataset.it === state.target) {
            correct++;
            b.classList.add('pop', 'done');
            AudioSys.sfx.correct();
            AudioSys.praiseCorrect(params.profile);
            const rect = b.getBoundingClientRect();
            Confetti.burst(16, { x: rect.left + rect.width / 2, y: rect.top + 20 });
            later(() => {
              round++;
              if (round >= ROUNDS) finish();
              else renderRound();
            }, 750);
          } else {
            b.classList.add('wrong');
            AudioSys.sfx.wrong();
            AudioSys.encourage();
            later(() => b.classList.remove('wrong'), 500);
          }
        });
      });
    }

    function finish() {
      clearTimers();
      const accuracy = Math.round((correct / attempts) * 100);
      const stars = accuracy >= 95 ? 3 : accuracy >= 80 ? 2 : 1;
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
