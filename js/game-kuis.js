/* Game — Kuis Kata (3 mode):
   - sound2pic  : dengar kata → pilih gambar
   - pic2word   : lihat gambar → pilih tulisan kata
   - sound2word : dengar kata → pilih tulisan kata (kata mirip) */
window.GameKuis = (() => {
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
  const MODE_INFO = {
    sound2pic: { hint: 'Dengarkan, lalu pilih gambarnya! 👂', speak: true },
    pic2word: { hint: 'Lihat gambarnya, pilih tulisan katanya! 🖼️', speak: true },
    sound2word: { hint: 'Dengarkan, lalu pilih tulisan yang benar! 🗣️', speak: true }
  };

  function start(params) {
    active = true;
    timers = [];
    const pool = params.pool.filter(w => w.word.length <= 7);
    
    let round = 0, correct = 0, attempts = 0, busy = false;

    const area = document.getElementById('game-area');
    const progressEl = document.getElementById('game-progress');

    function renderRound() {
      if (!active || !pool.length) return;
      progressEl.textContent = (round + 1) + '/' + ROUNDS;
      let target = pool[(Math.random() * pool.length) | 0];
      let prev = state && state.target;
      let guard = 0;
      while (target.word === (prev && prev.word) && guard++ < 8) target = pool[(Math.random() * pool.length) | 0];
      state = { target };

      const others = shuffle(pool.filter(w => w.word !== target.word));

      let choices, card;
      if (params.mode === 'sound2pic') {
        choices = shuffle([target, ...others.slice(0, 3)]);
        card = '<div class="quiz-prompt trace-font">❓</div>';
        area.innerHTML =
          '<p class="match-hint">' + mode.hint + '</p>' +
          '<div class="choice-grid">' +
            choices.map((w, i) =>
              '<button class="choice-btn tile-' + (i % 4) + '" data-w="' + w.word + '"><span class="quiz-emoji">' + w.emoji + '</span></button>'
            ).join('') +
          '</div>';
      } else if (params.mode === 'pic2word') {
        choices = shuffle([target, ...others.slice(0, 3)]);
        card = '<div class="quiz-emoji big">' + target.emoji + '</div>';
        area.innerHTML =
          '<p class="match-hint">' + mode.hint + '</p>' +
          card +
          '<div class="choice-grid">' +
            choices.map((w, i) =>
              '<button class="choice-btn tile-' + (i % 4) + '" data-w="' + w.word + '"><span class="quiz-word">' + w.word + '</span></button>'
            ).join('') +
          '</div>';
      } else {
        // sound2word: pilih tulisan dari kata-kata mirip
        const sims = others.filter(w => w.word.length === target.word.length).slice(0, 2);
        const extra = sims.length >= 2 ? sims : others.slice(0, 2 - sims.length);
        choices = shuffle([target, ...extra]);
        card = '<div class="quiz-prompt trace-font">❓</div>';
        area.innerHTML =
          '<p class="match-hint">' + mode.hint + '</p>' +
          '<div class="choice-grid three">' +
            choices.map((w, i) =>
              '<button class="choice-btn tile-' + (i % 4) + '" data-w="' + w.word + '"><span class="quiz-word">' + w.word + '</span></button>'
            ).join('') +
          '</div>';
      }

      busy = true;
      const playPrompt = () => AudioSys.speakItem(target.word, { flush: true });
      window.lastGamePrompt = playPrompt;
      later(playPrompt, 400);
      later(() => { busy = false; }, 1000);

      area.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!active || busy || btn.classList.contains('done')) return;
          attempts++;
          if (btn.dataset.w === target.word) {
            correct++;
            btn.classList.add('correct', 'done');
            AudioSys.sfx.correct();
            AudioSys.praiseCorrect(params.profile);
            const rect = btn.getBoundingClientRect();
            Confetti.burst(14, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
            later(() => {
              round++;
              if (round >= ROUNDS) finish();
              else renderRound();
            }, 800);
          } else {
            btn.classList.add('wrong');
            AudioSys.sfx.wrong();
            AudioSys.encourage();
            later(() => btn.classList.remove('wrong'), 500);
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
