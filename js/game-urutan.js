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
    const items = params.letters;   // array urut: huruf (mis. A..I) atau suku kata (ba, bi, bu, be, bo)
    const isSyl = !!(items[0] && String(items[0]).length === 2);
    const display = isSyl ? (l) => l : (l) => '<span class="trace-font">' + l + '</span>';
    const hint = isSyl ? 'Suku kata mana yang hilang?' : 'Huruf mana yang hilang?';

    let round = 0, correct = 0, attempts = 0, prevStart = -1;

    const area = document.getElementById('game-area');
    const progressEl = document.getElementById('game-progress');
    // Jendela 4-item berurutan; aman untuk kelompok kecil (mis. 5 suku kata).
    const maxStart = Math.max(0, items.length - 4);

    function renderRound() {
      if (!active) return;
      progressEl.textContent = (round + 1) + '/' + ROUNDS;
      // Pilih jendela acak tiap ronde (boleh sama, posisi hilangnya beda).
      // Menghindari jendela yang persis sama berturut-turut.
      let s = (Math.random() * (maxStart + 1)) | 0;
      let guard = 0;
      while (s === prevStart && guard++ < 8) s = (Math.random() * (maxStart + 1)) | 0;
      prevStart = s;
      const window = items.slice(s, s + 4);
      const hiddenIdx = (Math.random() * 4) | 0;
      const hidden = window[hiddenIdx];
      const others = items.filter(l => !window.includes(l));
      const options = shuffle([hidden, ...shuffle(others).slice(0, 3)]);

      const slots = window.map((l, i) =>
        i === hiddenIdx
          ? '<span class="seq-slot empty" data-slot="' + i + '">❓</span>'
          : '<span class="seq-slot">' + display(l) + '</span>'
      ).join('');

      area.innerHTML =
        '<p class="match-hint">' + hint + '</p>' +
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
