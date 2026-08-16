/* Game — Pasangan Huruf / Pasangkan Suku Kata:
   Hubungkan dua kolom dengan mengetuk satu item kiri lalu satu item kanan.
   - mode 'case': huruf besar ↔ huruf kecil
   - mode 'suku': suku kata ↔ gambar kata */
window.GamePasangan = (() => {
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
    if (params.mode === 'suku') {
      return params.syllables.map(sy => {
        const [word, emoji] = params.words[sy][0];
        return { key: sy, keyLabel: sy, target: word, targetLabel: emoji, emoji: true };
      });
    }
    if (params.mode === 'kata') {
      return params.pool.slice(0, 6).map(w => {
        return { key: w.word, keyLabel: w.word, target: w.word, targetLabel: w.emoji, emoji: true };
      });
    }
    // mode 'case': huruf unit ↔ huruf lawan kasus
    const upper = params.letterCase === 'upper';
    return params.letters.slice(0, 6).map(ch => ({
      key: upper ? ch : ch.toUpperCase(),
      keyLabel: upper ? ch : ch.toUpperCase(),
      target: upper ? ch.toLowerCase() : ch.toLowerCase(),
      targetLabel: upper ? ch.toLowerCase() : ch.toLowerCase(),
      emoji: false
    }));
  }

  function start(params) {
    active = true;
    timers = [];
    const pairs = shuffle(buildPairs(params));
    const keys = shuffle(pairs.map(p => p.key));
    const targets = shuffle(pairs.map(p => p.target));
    const byKey = {};
    pairs.forEach(p => { byKey[p.key] = p; });

    // Label tampilan untuk tiap target (emoji untuk suku, huruf untuk case)
    const labelFor = (t) => {
      const p = pairs.find(x => x.target === t);
      return p.emoji ? p.targetLabel : '<span class="trace-font">' + p.targetLabel + '</span>';
    };

    let mistakes = 0;
    let matched = 0;
    let selKey = null;

    const area = document.getElementById('game-area');
    const progressEl = document.getElementById('game-progress');
    progressEl.textContent = pairs.length + ' pasangan';

    area.innerHTML =
      '<p class="match-hint">' + (params.mode === 'suku'
        ? 'Hubungkan suku kata dengan gambarnya! 👇'
        : 'Hubungkan huruf besar dengan huruf kecilnya! 👇') + '</p>' +
      '<div class="match-grid">' +
        '<div class="match-col" id="match-left">' + keys.map(k =>
          '<button class="match-item key" data-k="' + k + '">' +
            (byKey[k].emoji ? byKey[k].keyLabel : '<span class="trace-font">' + byKey[k].keyLabel + '</span>') +
          '</button>'
        ).join('') + '</div>' +
        '<div class="match-col" id="match-right">' + targets.map(t =>
          '<button class="match-item target" data-t="' + t + '">' + labelFor(t) + '</button>'
        ).join('') + '</div>' +
      '</div>';

    const els = {
      left: document.querySelectorAll('#match-left .match-item'),
      right: document.querySelectorAll('#match-right .match-item')
    };

    function clearSel() {
      selKey = null;
      els.left.forEach(b => b.classList.remove('picked'));
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

    els.left.forEach(btn => btn.addEventListener('click', () => {
      if (!active || btn.classList.contains('matched')) return;
      AudioSys.sfx.tap();
      els.left.forEach(b => b.classList.remove('picked'));
      btn.classList.add('picked');
      selKey = btn.dataset.k;
    }));

    els.right.forEach(btn => btn.addEventListener('click', () => {
      if (!active || !selKey || btn.classList.contains('matched')) return;
      const p = byKey[selKey];
      const ok = p.target === btn.dataset.t;
      if (ok) {
        btn.classList.add('matched');
        els.left.forEach(b => { if (b.dataset.k === selKey) b.classList.add('matched'); });
        clearSel();
        matched++;
        AudioSys.sfx.correct();
        AudioSys.praiseCorrect(params.profile);
        const rect = btn.getBoundingClientRect();
        Confetti.burst(14, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
        if (matched === pairs.length) finish();
      } else {
        mistakes++;
        AudioSys.sfx.wrong();
        AudioSys.encourage();
        btn.classList.add('wrong');
        els.left.forEach(b => { if (b.dataset.k === selKey) b.classList.add('wrong'); });
        clearSel();
        later(() => {
          els.right.forEach(b => b.classList.remove('wrong'));
          els.left.forEach(b => b.classList.remove('wrong'));
        }, 500);
      }
    }));
  }

  function cancel() { active = false; clearTimers(); }

  return { start, cancel };
})();
