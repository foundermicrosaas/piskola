/* Game 3 — Sambung Huruf (belajar mengeja):
   Anak MENARIK GARIS dari konsonan (mis. b) ke vokal (a) → suku kata "ba"
   terbentuk dengan animasi b + a = ba + audio pelan. Lalu pilih kata yang
   diawali suku kata itu (4 pilihan emoji + kata). 5 ronde → bintang. */
window.GameSambung = (() => {
  let active = false;
  let timers = [];
  let round, correct, attempts, streak, busy, connected;
  let current = null; // { sy, consonant, vowel, correctWord, choices }

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

  function start({ syllables, words, profile, onDone }) {
    active = true;
    timers = [];
    round = 0; correct = 0; attempts = 0; streak = 0; busy = false; connected = false;

    const area = document.getElementById('game-area');
    const progressEl = document.getElementById('game-progress');
    const ROUNDS = 5;

    function wordChoices(sy) {
      const all = Object.keys(words).reduce((acc, k) => acc.concat(words[k]), []);
      const correctPool = words[sy] || [['baju', '👕']];
      const correct = correctPool[(Math.random() * correctPool.length) | 0];
      const distractors = shuffle(all.filter(w => !correctPool.includes(w))).slice(0, 3);
      return { correct, choices: shuffle([correct, ...distractors]) };
    }

    function renderRound() {
      if (!active) return;
      const prev = current ? current.sy : null;
      let sy = syllables[(Math.random() * syllables.length) | 0];
      let guard = 0;
      while (sy === prev && guard++ < 6) sy = syllables[(Math.random() * syllables.length) | 0];

      const { correct: cw, choices } = wordChoices(sy);
      current = { sy, consonant: sy[0], vowel: sy[1], correctWord: cw, choices };
      connected = false;
      busy = false;

      progressEl.textContent = (round + 1) + '/' + ROUNDS;
      area.innerHTML =
        '<p class="trace-hint">Tarik garis dari <b>' + sy[0] + '</b> ke <b>' + sy[1] + '</b>!</p>' +
        '<div class="sambung-stage" id="sambung-stage">' +
          '<svg class="sambung-svg" viewBox="0 0 320 200">' +
            '<line id="drag-line" x1="70" y1="100" x2="70" y2="100" stroke="#FF8A3D" stroke-width="12" stroke-linecap="round" opacity="0"/>' +
          '</svg>' +
          '<div class="sambung-dot start" id="dot-start">' + sy[0] + '</div>' +
          '<div class="sambung-dot end" id="dot-end">' + sy[1] + '</div>' +
        '</div>' +
        '<div class="sambung-result hidden" id="sambung-result">' +
          '<span id="sambung-formula"></span>' +
        '</div>' +
        '<div class="sambung-q hidden" id="sambung-q">' +
          '<p>Kata apa yang diawali <b>' + sy + '</b>?</p>' +
          '<div class="sambung-options">' +
            choices.map((w, i) =>
              '<button class="sambung-opt" data-w="' + w[0] + '"><span class="so-emoji">' + w[1] + '</span><span class="so-word">' + w[0] + '</span></button>'
            ).join('') +
          '</div>' +
        '</div>';

      wireDrag();
      area.querySelectorAll('.sambung-opt').forEach(btn => {
        btn.addEventListener('click', () => onPick(btn.dataset.w, btn));
      });
    }

    /* ---- Drag: dari titik konsonan ke titik vokal ---- */
    function wireDrag() {
      const stage = document.getElementById('sambung-stage');
      const line = document.getElementById('drag-line');
      const startEl = document.getElementById('dot-start');
      const endEl = document.getElementById('dot-end');
      let dragging = false;

      function toSvg(e) {
        const r = stage.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 320;
        const y = ((e.clientY - r.top) / r.height) * 200;
        return { x, y };
      }
      function nearStart(p) {
        const r = startEl.getBoundingClientRect();
        const cx = ((r.left + r.width / 2 - stage.getBoundingClientRect().left) / stage.getBoundingClientRect().width) * 320;
        const cy = ((r.top + r.height / 2 - stage.getBoundingClientRect().top) / stage.getBoundingClientRect().height) * 200;
        return Math.hypot(p.x - cx, p.y - cy) < 48;
      }
      function nearEnd(p) {
        const r = endEl.getBoundingClientRect();
        const cx = ((r.left + r.width / 2 - stage.getBoundingClientRect().left) / stage.getBoundingClientRect().width) * 320;
        const cy = ((r.top + r.height / 2 - stage.getBoundingClientRect().top) / stage.getBoundingClientRect().height) * 200;
        return Math.hypot(p.x - cx, p.y - cy) < 52;
      }

      stage.addEventListener('pointerdown', (e) => {
        if (connected || busy || !active) return;
        const p = toSvg(e);
        if (!nearStart(p)) return;
        dragging = true;
        line.setAttribute('x2', p.x);
        line.setAttribute('y2', p.y);
        line.setAttribute('opacity', 1);
      });
      stage.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const p = toSvg(e);
        line.setAttribute('x2', p.x);
        line.setAttribute('y2', p.y);
        if (nearEnd(p)) {
          dragging = false;
          connected = true;
          line.setAttribute('x2', endSvg()[0]);
          line.setAttribute('y2', endSvg()[1]);
          onConnected();
        }
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev =>
        stage.addEventListener(ev, () => { dragging = false; })
      );

      function endSvg() {
        const r = endEl.getBoundingClientRect();
        const sr = stage.getBoundingClientRect();
        return [
          ((r.left + r.width / 2 - sr.left) / sr.width) * 320,
          ((r.top + r.height / 2 - sr.top) / sr.height) * 200
        ];
      }
    }

    function onConnected() {
      if (busy || !active) return;
      AudioSys.sfx.connect();
      const res = document.getElementById('sambung-result');
      res.classList.remove('hidden');
      document.getElementById('sambung-formula').textContent =
        current.consonant + ' + ' + current.vowel + ' = ' + current.sy;
      AudioSys.speakItem(current.sy, { rate: 0.7 });
      later(() => {
        document.getElementById('sambung-q').classList.remove('hidden');
      }, 800);
    }

    function onPick(word, btn) {
      if (busy || !connected || !active) return;
      attempts++;
      if (word === current.correctWord[0]) {
        busy = true;
        correct++; streak++;
        btn.classList.add('correct');
        AudioSys.sfx.correct();
        Confetti.burst(30, {
          x: btn.getBoundingClientRect().left + btn.offsetWidth / 2,
          y: btn.getBoundingClientRect().top + btn.offsetHeight / 2
        });
        if (streak >= 3) AudioSys.praiseStreak(profile);
        else AudioSys.praiseCorrect(profile);
        later(() => {
          round++;
          busy = false;
          if (round >= ROUNDS) finish();
          else renderRound();
        }, 1000);
      } else {
        streak = 0;
        btn.classList.add('wrong');
        AudioSys.sfx.wrong();
        AudioSys.encourage();
        later(() => btn.classList.remove('wrong'), 500);
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
