/* Game — Huruf Hilang / Suku Kata Hilang:
   Kata dengan satu bagian hilang (___); pilih huruf/suku kata yang tepat. */
window.GameHilang = (() => {
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
    const pool = params.pool.filter(w => w.word.length >= 3 && w.word.length <= 7);
    
    let round = 0, correct = 0, attempts = 0, busy = false;

    const area = document.getElementById('game-area');
    const progressEl = document.getElementById('game-progress');

    // Pilih soal: { word, emoji, missing, options, syllables? }
    function makeQuestion() {
      if (params.mode === 'suku') {
        // kata 2 suku kata dari unit (suku kata pertama = suku kata unit)
        const two = pool.filter(w => w.word.length >= 4);
        const w = two[(Math.random() * two.length) | 0] || pool[(Math.random() * pool.length) | 0];
        const syls = w.word.match(/.{1,2}/g) || [w.word]; // pecah per 2 huruf
        const hid = (Math.random() * syls.length) | 0;
        const missing = syls[hid];
        const options = shuffle([missing, ...params.syllables.filter(s => s !== missing).slice(0, 2)]);
        return { word: w.word, emoji: w.emoji, syls, hid, missing, options, isSyl: true };
      }
      // mode huruf: kata mengandung huruf dari unit
      const upper = params.letterCase === 'upper';
      const candidates = pool.filter(w => {
        const chars = w.word.split('');
        return chars.some(c => params.letters.includes(upper ? c.toUpperCase() : c.toLowerCase()));
      });
      const w = (candidates[(Math.random() * candidates.length) | 0]) || pool[(Math.random() * pool.length) | 0];
      const chars = w.word.split('');
      const hidIdx = chars.findIndex(c => params.letters.includes(upper ? c.toUpperCase() : c.toLowerCase()));
      const missing = upper ? chars[hidIdx].toUpperCase() : chars[hidIdx];
      const dists = shuffle(params.letters.filter(l => l !== missing)).slice(0, 2);
      const options = shuffle([missing, ...dists]);
      return { word: w.word, emoji: w.emoji, chars, hid: hidIdx, missing, options, isSyl: false };
    }

    function renderRound() {
      if (!active) return;
      progressEl.textContent = (round + 1) + '/' + ROUNDS;
      const q = makeQuestion();
      state = { q };

      let display;
      if (q.isSyl) {
        display = q.syls.map((s, i) =>
          i === q.hid ? '<span class="quiz-word missing">___</span>' : '<span class="quiz-word">' + s + '</span>'
        ).join(' ');
      } else {
        display = q.chars.map((c, i) =>
          i === q.hid ? '<span class="quiz-word missing">___</span>' : '<span class="quiz-word">' + c + '</span>'
        ).join('');
      }

      area.innerHTML =
        '<div class="quiz-prompt">' +
          '<span class="quiz-emoji big">' + q.emoji + '</span>' +
          '<div class="quiz-word-row trace-font">' + display + '</div>' +
        '</div>' +
        '<p class="match-hint">Bagian mana yang hilang?</p>' +
        '<div class="choice-grid three">' +
          q.options.map((o, i) =>
            '<button class="choice-btn tile-' + (i % 4) + '" data-o="' + o + '"><span class="quiz-word trace-font">' + o + '</span></button>'
          ).join('') +
        '</div>';

      busy = true;
      // Tombol 🔁 memakai flush (inisiatif anak — boleh memotong suara).
      const playPrompt = () => AudioSys.speakItem(q.word, { flush: true });
      window.lastGamePrompt = playPrompt;
      // Auto-play ronde berikutnya TANPA flush → pujian tidak dipotong.
      later(() => AudioSys.speakItem(q.word), 400);
      later(() => { busy = false; }, 900);

      area.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!active || busy || btn.classList.contains('done')) return;
          attempts++;
          if (btn.dataset.o === q.missing) {
            correct++;
            btn.classList.add('correct', 'done');
            // isi slot dengan huruf/suku kata asli di dalam kata (bukan huruf besar opsi)
            const fill = q.isSyl ? q.missing : q.chars[q.hid];
            area.querySelector('.quiz-word.missing').textContent = fill;
            area.querySelector('.quiz-word.missing').classList.remove('missing');
            AudioSys.sfx.correct();
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
