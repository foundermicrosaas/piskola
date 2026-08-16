/* Game 1 — Tebak Huruf / Tebak Suku Kata:
   Anak mendengar nama huruf / suku kata (pelan), lalu mengetuk yang benar
   di antara 4 pilihan. Benar → pujian dinamis + confetti. 8 ronde, bintang
   dari akurasi. `display`: 'upper' | 'lower' | 'raw' untuk tampilan kartu. */
window.GameTebak = (() => {
  let active = false;
  let timers = [];
  let round, correct, attempts, streak, busy;
  let current = null;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function later(fn, ms) { const t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  function start({ pool, profile, onDone }) {
    active = true;
    timers = [];
    round = 0; correct = 0; attempts = 0; streak = 0; busy = false;
    
    const area = document.getElementById('game-area');
    const progressEl = document.getElementById('game-progress');
    const ROUNDS = 8;

    function renderRound() {
      if (!active) return;
      const prev = current ? current.target : null;
      let targetObj = pool[(Math.random() * pool.length) | 0];
      let guard = 0;
      while (targetObj.word === (prev && prev.word) && guard++ < 6) {
        targetObj = pool[(Math.random() * pool.length) | 0];
      }
      // Ambil 3 kata lain secara acak
      const others = shuffle(pool.filter(w => w.word !== targetObj.word)).slice(0, 3);
      const choices = shuffle([targetObj, ...others]);
      current = { target: targetObj, choices };

      progressEl.textContent = (round + 1) + '/' + ROUNDS;
      area.innerHTML =
        '<div class="game-question">' +
          '<p>Tulisan mana yang dibaca...</p>' +
          '<button class="btn-speaker" id="btn-speaker" aria-label="Dengar lagi">🔊</button>' +
          '<button class="btn btn-secondary btn-replay">🔁 Dengar lagi</button>' +
        '</div>' +
        '<div class="letter-grid">' +
          choices.map((w, i) => {
            const fontClass = w.word.length > 5 ? 'long-word' : w.word.length > 8 ? 'very-long-word' : '';
            return '<button class="letter-tile tile-' + i + ' ' + fontClass + '" data-item="' + w.word + '">' + w.word + '</button>';
          }).join('') +
        '</div>';

      document.getElementById('btn-speaker').addEventListener('click', () => AudioSys.speakItem(current.target.word, { flush: true }));
      area.querySelector('.btn-replay').addEventListener('click', () => AudioSys.speakItem(current.target.word, { flush: true }));

      area.querySelectorAll('.letter-tile').forEach(tile => {
        tile.addEventListener('click', () => onTap(tile.dataset.item, tile));
      });

      later(() => AudioSys.speakItem(current.target.word), 350);
    }

    function onTap(item, tile) {
      if (busy || !active) return;
      attempts++;
      if (item === current.target.word) {
        busy = true;
        correct++; streak++;
        tile.classList.add('correct');
        AudioSys.sfx.correct();
        Confetti.burst(30, {
          x: tile.getBoundingClientRect().left + tile.offsetWidth / 2,
          y: tile.getBoundingClientRect().top + tile.offsetHeight / 2
        });
        later(() => {
          round++;
          busy = false;
          if (round >= ROUNDS) finish();
          else renderRound();
        }, 950);
      } else {
        streak = 0;
        tile.classList.add('wrong');
        AudioSys.sfx.wrong();
        AudioSys.encourage();
        later(() => tile.classList.remove('wrong'), 500);
      }
    }

    function finish() {
      const accuracy = Math.round((correct / attempts) * 100);
      const stars = accuracy >= 90 ? 3 : accuracy >= 75 ? 2 : 1;
      AudioSys.sfx.fanfare();
      later(() => {
        active = false;
        onDone({ stars, accuracy, plays: 1 });
      }, 400);
    }

    renderRound();
  }

  function cancel() {
    active = false;
    clearTimers();
  }

  return { start, cancel };
})();
