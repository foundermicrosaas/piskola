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

  function start({ pool, profile, onDone }) {
    active = true;
    timers = [];

    let round = 0, correct = 0, attempts = 0, busy = false;

    const area = document.getElementById('game-area');
    const progressEl = document.getElementById('game-progress');

    function renderRound() {
      if (!active) return;
      progressEl.textContent = (round + 1) + '/' + ROUNDS;
      let targetObj = pool[(Math.random() * pool.length) | 0];
      let prev = state && state.target;
      let guard = 0;
      while (targetObj.word === (prev && prev.word) && guard++ < 8) {
        targetObj = pool[(Math.random() * pool.length) | 0];
      }
      state = { target: targetObj };

      const others = shuffle(pool.filter(w => w.word !== targetObj.word)).slice(0, 4);
      const choices = shuffle([targetObj, ...others]);

      area.innerHTML =
        '<p class="match-hint">Dengarkan, lalu pecahkan balon yang benar! 🎈</p>' +
        '<div class="balloon-stage" id="balloon-stage">' +
          choices.map((w, i) => {
            const fontClass = w.word.length > 5 ? 'long-word' : w.word.length > 8 ? 'very-long-word' : '';
            return '<button class="balloon" data-it="' + w.word + '" style="left:' + (8 + i * 19) + '%;animation-delay:' + (i * 0.7) + 's">' +
              '<span class="balloon-fill"></span>' +
              '<span class="balloon-label ' + fontClass + '">' + w.word + '</span>' +
              '<span class="balloon-string"></span>' +
            '</button>';
          }).join('') +
        '</div>';

      busy = true;
      const playPrompt = () => AudioSys.speakItem(state.target.word, { flush: true });
      window.lastGamePrompt = playPrompt;
      later(() => AudioSys.speakItem(state.target.word), 400);
      later(() => { busy = false; }, 900);

      area.querySelectorAll('.balloon').forEach(b => {
        b.addEventListener('click', () => {
          if (!active || busy || b.classList.contains('done')) return;
          attempts++;
          if (b.dataset.it === state.target.word) {
            correct++;
            b.classList.add('pop', 'done');
            AudioSys.sfx.correct();
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
