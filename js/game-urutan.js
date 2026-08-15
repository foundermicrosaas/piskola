/* Game — Urutan Huruf:
   Urutan alfabet pendek dengan satu huruf hilang → pilih huruf yang tepat. */
window.GameUrutan = (() => {
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
    const letters = params.letters;   // sudah urut alfabet
    const display = (l) => '<span class="trace-font">' + l + '</span>';

    let round = 0, correct = 0, attempts = 0;

    const area = document.getElementById('game-area');
    const progressEl = document.getElementById('game-progress');

    // Buat 6 jendela 4-huruf berurutan (tanpa pengulangan posisi awal yang sama)
    const maxStart = letters.length - 4;
    const starts = shuffle(Array.from({ length: maxStart + 1 }, (_, i) => i)).slice(0, ROUNDS);

    function renderRound() {
      if (!active) return;
      progressEl.textContent = (round + 1) + '/' + ROUNDS;
      const s = starts[round];
      const window = letters.slice(s, s + 4);
      const hiddenIdx = (Math.random() * 4) | 0;
      const hidden = window[hiddenIdx];
      const others = letters.filter(l => !window.includes(l));
      const options = shuffle([hidden, ...shuffle(others).slice(0, 3)]);

      const slots = window.map((l, i) =>
        i === hiddenIdx
          ? '<span class="seq-slot empty" data-slot="' + i + '">❓</span>'
          : '<span class="seq-slot">' + display(l) + '</span>'
      ).join('');

      area.innerHTML =
        '<p class="match-hint">Huruf mana yang hilang?</p>' +
        '<div class="seq-row">' + slots + '</div>' +
        '<div class="choice-grid">' +
          options.map((l, i) =>
            '<button class="choice-btn tile-' + (i % 4) + '" data-l="' + l + '">' + display(l) + '</button>'
          ).join('') +
        '</div>';

      area.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!active || btn.classList.contains('done')) return;
          const pick = btn.dataset.l;
          attempts++;
          if (pick === hidden) {
            correct++;
            btn.classList.add('correct');
            area.querySelector('.seq-slot.empty').innerHTML = display(hidden);
            area.querySelector('.seq-slot.empty').classList.remove('empty');
            area.querySelectorAll('.choice-btn').forEach(b => b.classList.add('done'));
            AudioSys.sfx.correct();
            AudioSys.praiseCorrect(params.profile);
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
