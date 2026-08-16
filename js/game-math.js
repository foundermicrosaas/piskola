/* Game — Belajar Hitung (engine matematika):
   Satu engine untuk 13 mode permainan berhitung:
   count   → hitung benda (mengenal angka)
   quiz    → pilih jawaban (kata→angka, angka→kata, soal operasi, campuran)
   order   → urutan angka dengan angka hilang
   balloon → pecahkan balon jawaban yang benar
   memory  → kartu pasangan (angka↔kata / soal↔jawaban)
   pair    → hubungkan dua kolom (angka↔kata / soal↔jawaban)
   missing → isi angka/operan yang hilang pada soal (3 + __ = 8)
   build   → susun angka jawaban dari keping digit
   listen  → dengar soal/kata, pilih jawaban
   table   → lengkapi tabel perkalian / pembagian
   skip    → lanjutkan hitungan maju / mundur / melompat
   compare → pilih angka yang lebih besar
   story   → soal cerita bergambar (penjumlahan, pengurangan, dst.)

   `params.unit`:
   { kind:'angka', range:[0,10] }  untuk mengenal angka
   { kind:'op', op:'+'|'-'|'×'|'÷', max, tableMax } untuk operasi hitung */
window.GameMath = (() => {
  let active = false;
  let timers = [];
  let state = null;

  const ROUNDS = 6;
  const EMOJI = ['🍎', '⭐', '🍓', '🐤', '🎈', '🌼', '🍪', '🦋', '🍌', '🐟', '🧸', '🍬', '🌞', '🚗', '⚽', '🐰', '🍇', '📚', '🍦', '🦆', '🐝', '🍉'];

  function rand(min, max) { return min + ((Math.random() * (max - min + 1)) | 0); }
  function shuffle(a) {
    const arr = a.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function later(fn, ms) { const t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function kata(n) { return AudioSys.angkaKeKata(n); }

  /* 3 pilihan angka yang berbeda di sekitar jawaban */
  function optionNumbers(ans, lo, hi) {
    const lo0 = (lo === undefined || lo === null) ? 0 : lo;
    const hi0 = (hi === undefined || hi === null) ? 100 : hi;
    const opts = new Set([ans]);
    for (const d of [1, -1, 2, -2, 3, -3]) {
      if (opts.size >= 3) break;
      const v = ans + d;
      if (v >= lo0 && v <= hi0) opts.add(v);
    }
    let v = ans + 1;
    while (opts.size < 3) { if (v <= hi0) opts.add(v); v++; }
    let w = ans - 1;
    while (opts.size < 3) { if (w >= lo0) opts.add(w); w--; }
    return shuffle([...opts]);
  }
  function numPool(unit) {
    const lo = unit.range[0], hi = unit.range[1];
    const arr = [];
    for (let i = lo; i <= hi; i++) arr.push(i);
    return arr;
  }
  function makeNum(unit) {
    const pool = numPool(unit);
    return pool[(Math.random() * pool.length) | 0];
  }

  /* Soal operasi sesuai unit */
  function makeProblem(unit) {
    const op = unit.op;
    if (op === '+') {
      const a = rand(1, Math.max(1, unit.max - 1));
      const b = rand(1, unit.max - a);
      return { a, b, op, answer: a + b, text: a + ' + ' + b, speak: kata(a) + ' tambah ' + kata(b) + ', berapa ya?' };
    }
    if (op === '-') {
      const a = rand(1, unit.max);
      const b = rand(0, a);
      return { a, b, op, answer: a - b, text: a + ' - ' + b, speak: kata(a) + ' kurang ' + kata(b) + ', berapa ya?' };
    }
    if (op === '×') {
      const a = rand(1, unit.tableMax);
      const b = rand(1, unit.tableMax);
      return { a, b, op, answer: a * b, text: a + ' × ' + b, speak: kata(a) + ' kali ' + kata(b) + ', berapa ya?' };
    }
    // pembagian: dibangun dari perkalian agar hasil selalu bulat
    const b = rand(1, unit.tableMax);
    const q = rand(1, unit.tableMax);
    const a = b * q;
    return { a, b, op, answer: q, text: a + ' ÷ ' + b, speak: kata(a) + ' bagi ' + kata(b) + ', berapa ya?' };
  }
  function makeMissing(unit) {
    const p = makeProblem(unit);
    // 3 + __ = 8 ; 8 - __ = 3 ; 3 × __ = 15 ; 12 ÷ __ = 4
    const text = p.a + ' ' + p.op + ' ___ = ' + p.answer;
    const speak = 'Berapa angka yang hilang? ' + kata(p.a) + (p.op === '+' ? ' tambah' : p.op === '-' ? ' kurang' : p.op === '×' ? ' kali' : ' bagi') + ' berapa sama dengan ' + kata(p.answer) + '?';
    return { text, answer: p.b, speak };
  }
  function answerHi(unit) {
    if (unit.kind === 'angka') return unit.range[1];
    if (unit.op === '+' || unit.op === '-') return unit.max;
    return unit.tableMax * unit.tableMax;
  }
  function answerLo(unit) {
    if (unit.kind === 'angka') return unit.range[0];
    if (unit.op === '-') return 0;
    if (unit.op === '÷') return 1;
    return 0;
  }

  /* ==================== PERENDER MODE ==================== */

  function promptBox(inner) {
    return '<div class="quiz-prompt">' + inner + '</div>';
  }
  function bigText(t, cls) {
    return '<div class="math-big' + (cls ? ' ' + cls : '') + '">' + t + '</div>';
  }
  function optionButtons(options, isWord) {
    return '<div class="choice-grid three">' +
      options.map((o, i) =>
        '<button class="choice-btn tile-' + (i % 4) + '" data-o="' + o + '"><span class="quiz-word">' + o + '</span></button>'
      ).join('') +
      '</div>';
  }
  function hint(t) { return '<p class="match-hint">' + t + '</p>'; }

  function start(params) {
    active = true;
    timers = [];
    const unit = params.unit;
    const mode = params.mode;
    let round = 0, correct = 0, attempts = 0, busy = false;

    const area = document.getElementById('game-area');
    const progressEl = document.getElementById('game-progress');

    function speakPrompt(text, after) {
      busy = true;
      const playPrompt = () => AudioSys.speak(text, { rate: 0.78, pitch: 1.15, flush: true });
      window.lastGamePrompt = playPrompt;
      later(playPrompt, after || 350);
      later(() => { busy = false; }, (after || 350) + 900);
    }

    function wireChoices(onPick) {
      area.querySelectorAll('.choice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!active || busy || btn.classList.contains('done')) return;
          onPick(btn.dataset.o, btn);
        });
      });
    }

    /* Pilih jawaban dari opsi; benar → lanjut, salah → goyang */
    function handleAnswer(given, btn, expected) {
      if (busy || !active) return;
      attempts++;
      if (String(given) === String(expected)) {
        correct++;
        btn.classList.add('correct', 'done');
        AudioSys.sfx.correct();
        AudioSys.praiseCorrect(params.profile);
        const rect = btn.getBoundingClientRect();
        Confetti.burst(14, { x: rect.left + rect.width / 2, y: rect.top + 10 });
        later(() => {
          round++;
          if (round >= ROUNDS) finish();
          else renderRound();
        }, 850);
      } else {
        btn.classList.add('wrong');
        AudioSys.sfx.wrong();
        AudioSys.encourage();
        later(() => btn.classList.remove('wrong'), 500);
      }
    }

    /* ---------------- Mode: hitung benda ---------------- */
    function qCount() {
      const n = makeNum(unit);
      const e = EMOJI[rand(0, EMOJI.length - 1)];
      const options = optionNumbers(n, unit.range[0], unit.range[1]);
      const many = n > 10;
      area.innerHTML =
        promptBox(
          '<div class="count-row' + (many ? ' many' : '') + '">' + new Array(n).fill(e).join('') + '</div>'
        ) +
        hint('Hitung ada berapa ' + e + ' ya?') +
        optionButtons(options);
      speakPrompt('Hitung ada berapa ' + e + ' ya?');
      wireChoices((o, b) => handleAnswer(o, b, n));
    }

    /* ---------------- Mode: kuis ---------------- */
    function qQuiz() {
      let promptTxt, answer, speakTxt, options, optionsWords = false;
      if (unit.kind === 'angka') {
        let qt = params.quizType || 'word2num';
        if (qt === 'mix') qt = Math.random() < 0.55 ? 'word2num' : 'num2word';
        const n = makeNum(unit);
        if (qt === 'num2word') {
          promptTxt = String(n);
          optionsWords = true;
          answer = kata(n);
          options = optionNumbers(n, unit.range[0], unit.range[1]).map(kata);
          speakTxt = 'Angka ' + n + '. Mana tulisan katanya?';
        } else {
          promptTxt = kata(n);
          answer = n;
          options = optionNumbers(n, unit.range[0], unit.range[1]);
          speakTxt = kata(n) + '. Angka mana yang benar?';
        }
      } else {
        const qt = params.quizType;
        let p;
        if (qt === 'op-rev' && Math.random() < 0.4) {
          const m = makeMissing(unit);
          promptTxt = m.text; answer = m.answer; speakTxt = m.speak;
        } else {
          p = makeProblem(unit);
          promptTxt = p.text; answer = p.answer; speakTxt = p.speak;
        }
        options = optionNumbers(answer, answerLo(unit), answerHi(unit));
      }
      area.innerHTML =
        promptBox(bigText(promptTxt, 'math-op')) +
        hint('Pilih jawaban yang benar!') +
        optionButtons(options, optionsWords);
      speakPrompt(speakTxt);
      wireChoices((o, b) => handleAnswer(o, b, answer));
    }

    /* ---------------- Mode: urutan angka ---------------- */
    function qOrder() {
      const lo = unit.range[0], hi = unit.range[1];
      const startN = rand(lo, Math.max(lo, hi - 4));
      const seq = [startN, startN + 1, startN + 2, startN + 3, startN + 4];
      const hid = rand(1, 3);
      const answer = seq[hid];
      const options = optionNumbers(answer, lo, hi);
      area.innerHTML =
        promptBox(
          '<div class="seq-row">' + seq.map((v, i) =>
            i === hid
              ? '<span class="seq-slot empty">?</span>'
              : '<span class="seq-slot">' + v + '</span>'
          ).join('') + '</div>'
        ) +
        hint('Angka mana yang hilang di urutan ini?') +
        optionButtons(options);
      speakPrompt('Urutan angka. Angka mana yang hilang?');
      wireChoices((o, b) => handleAnswer(o, b, answer));
    }

    /* ---------------- Mode: balon ---------------- */
    function qBalloon() {
      let target, speakTxt, label;
      if (unit.kind === 'angka') {
        target = makeNum(unit);
        label = String(target);
        speakTxt = kata(target) + '. Pecahkan balon yang angkanya benar!';
      } else {
        const p = makeProblem(unit);
        target = p.answer;
        label = String(p.answer);
        speakTxt = p.speak + ' Pecahkan balon yang jawabannya benar!';
      }
      const choices = shuffle([target, ...shuffle(optionNumbers(target, answerLo(unit), answerHi(unit))).slice(0, 4)]);
      area.innerHTML =
        hint('Dengarkan, lalu pecahkan balon yang benar! 🎈') +
        '<div class="balloon-stage" id="balloon-stage">' +
          choices.map((it, i) =>
            '<button class="balloon" data-it="' + it + '" style="left:' + (8 + i * 17) + '%;animation-delay:' + (i * 0.7) + 's">' +
              '<span class="balloon-fill"></span>' +
              '<span class="balloon-label">' + it + '</span>' +
              '<span class="balloon-string"></span>' +
            '</button>'
          ).join('') +
        '</div>';
      speakPrompt(speakTxt, 300);
      area.querySelectorAll('.balloon').forEach(b => {
        b.addEventListener('click', () => {
          if (!active || busy || b.classList.contains('done')) return;
          attempts++;
          if (String(b.dataset.it) === String(target)) {
            correct++;
            b.classList.add('pop', 'done');
            AudioSys.sfx.correct();
            AudioSys.praiseCorrect(params.profile);
            const rect = b.getBoundingClientRect();
            Confetti.burst(14, { x: rect.left + rect.width / 2, y: rect.top + 20 });
            later(() => {
              round++;
              if (round >= ROUNDS) finish();
              else renderRound();
            }, 800);
          } else {
            b.classList.add('wrong');
            AudioSys.sfx.wrong();
            AudioSys.encourage();
            later(() => b.classList.remove('wrong'), 500);
          }
        });
      });
    }

    /* ---------------- Mode: kartu pasangan (memory) ---------------- */
    function qMemory() {
      let pairs;
      if (unit.kind === 'angka') {
        const pool = shuffle(numPool(unit)).slice(0, 6);
        pairs = pool.map(n => ({ a: String(n), b: kata(n), bWord: true }));
      } else {
        const probs = [];
        for (let i = 0; i < 6; i++) probs.push(makeProblem(unit));
        pairs = probs.map(p => ({ a: p.text, b: String(p.answer), bWord: false }));
      }
      const cards = shuffle(pairs.flatMap((p, i) => [
        { pair: i, side: 'a', label: p.a, word: p.bWord },
        { pair: i, side: 'b', label: p.b, word: p.bWord }
      ]));
      let mistakes = 0, open = [], locked = false, matched = 0;

      progressEl.textContent = 'Cari ' + pairs.length + ' pasangan';
      area.innerHTML =
        hint('Buka kartu dan temukan pasangannya! 🃏') +
        '<div class="mem-grid cols-4">' +
          cards.map((c, i) =>
            '<button class="mem-card" data-i="' + i + '" data-pair="' + c.pair + '">' +
              '<span class="mem-back">?</span>' +
              '<span class="mem-front' + (c.word ? ' trace-font' : ' math-text') + '">' + c.label + '</span>' +
            '</button>'
          ).join('') +
        '</div>';

      const btns = area.querySelectorAll('.mem-card');
      btns.forEach(btn => btn.addEventListener('click', () => {
        if (!active || locked || btn.classList.contains('flipped') || btn.classList.contains('matched')) return;
        AudioSys.sfx.tap();
        btn.classList.add('flipped');
        open.push(btn);
        if (open.length === 2) {
          locked = true;
          const [b1, b2] = open;
          if (b1.dataset.pair === b2.dataset.pair) {
            matched++;
            b1.classList.add('matched'); b2.classList.add('matched');
            open = [];
            AudioSys.sfx.correct();
            AudioSys.praiseCorrect(params.profile);
            later(() => {
              locked = false;
              if (matched === pairs.length) finish();
            }, 350);
          } else {
            mistakes++;
            AudioSys.sfx.wrong();
            later(() => {
              b1.classList.remove('flipped'); b2.classList.remove('flipped');
              open = []; locked = false;
            }, 750);
          }
        }
      }));
    }

    /* ---------------- Mode: pasangkan dua kolom ---------------- */
    function qPair() {
      let pairs;
      if (unit.kind === 'angka') {
        const pool = shuffle(numPool(unit)).slice(0, 5);
        pairs = pool.map(n => ({ left: String(n), right: kata(n), rightWord: true }));
      } else {
        const probs = [];
        for (let i = 0; i < 5; i++) probs.push(makeProblem(unit));
        pairs = probs.map(p => ({ left: p.text, right: String(p.answer), rightWord: false }));
      }
      const rights = shuffle(pairs.map((p, i) => ({ i, label: p.right, word: p.rightWord })));
      let picked = null, matched = 0;

      progressEl.textContent = 'Pasangkan ' + pairs.length + ' pasangan';
      area.innerHTML =
        hint('Ketuk satu kiri, lalu pasangannya di kanan!') +
        '<div class="match-grid">' +
          '<div class="match-col left-col">' +
            pairs.map((p, i) =>
              '<button class="match-item" data-i="' + i + '">' + p.left + '</button>'
            ).join('') +
          '</div>' +
          '<div class="match-col right-col">' +
            rights.map(r =>
              '<button class="match-item' + (r.word ? ' word" ' : '" ') + 'data-match="' + r.i + '">' + r.label + '</button>'
            ).join('') +
          '</div>' +
        '</div>';

      const leftBtns = area.querySelectorAll('.left-col .match-item');
      const rightBtns = area.querySelectorAll('.right-col .match-item');

      leftBtns.forEach(b => b.addEventListener('click', () => {
        if (!active || b.classList.contains('matched')) return;
        leftBtns.forEach(x => x.classList.remove('picked'));
        b.classList.add('picked');
        picked = b;
        AudioSys.sfx.tap();
      }));
      rightBtns.forEach(b => b.addEventListener('click', () => {
        if (!active || !picked || b.classList.contains('matched')) return;
        if (b.dataset.match === picked.dataset.i) {
          b.classList.add('matched');
          picked.classList.add('matched');
          picked = null;
          matched++;
          AudioSys.sfx.correct();
          AudioSys.praiseCorrect(params.profile);
          if (matched === pairs.length) finish();
        } else {
          b.classList.add('wrong');
          AudioSys.sfx.wrong();
          AudioSys.encourage();
          later(() => b.classList.remove('wrong'), 450);
        }
      }));
    }

    /* ---------------- Mode: angka hilang (operasi) ---------------- */
    function qMissing() {
      const m = makeMissing(unit);
      const options = optionNumbers(m.answer, answerLo(unit), answerHi(unit));
      area.innerHTML =
        promptBox(bigText(m.text.replace('___', '<span class="math-blank">?</span>'), 'math-op')) +
        hint('Angka apa yang hilang?') +
        optionButtons(options);
      speakPrompt(m.speak);
      wireChoices((o, b) => handleAnswer(o, b, m.answer));
    }

    /* ---------------- Mode: susun angka jawaban ---------------- */
    function qBuild() {
      let target, promptTxt, speakTxt;
      if (unit.kind === 'angka') {
        target = makeNum(unit);
        promptTxt = kata(target);
        speakTxt = kata(target) + '. Susun angka yang benar!';
      } else {
        const p = makeProblem(unit);
        target = p.answer;
        promptTxt = p.text + ' = ?';
        speakTxt = p.speak + ' Susun angka jawabannya!';
      }
      const digits = String(target).length;
      state = { target, slots: [], digits };

      function slotsHtml() {
        return new Array(state.digits).fill(0).map((_, i) =>
          '<span class="build-slot' + (state.slots[i] !== undefined ? ' filled' : '') + '" data-slot="' + i + '">' +
            (state.slots[i] !== undefined ? state.slots[i] : '') +
          '</span>'
        ).join('');
      }
      function render() {
        area.innerHTML =
          promptBox(bigText(promptTxt, 'math-op')) +
          '<div class="build-slots">' + slotsHtml() + '</div>' +
          hint('Ketuk angka untuk menyusun jawaban!') +
          '<div class="build-tiles">' +
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(d =>
              '<button class="build-tile" data-d="' + d + '">' + d + '</button>'
            ).join('') +
          '</div>';
      }
      render();
      speakPrompt(speakTxt);

      area.querySelectorAll('.build-tile').forEach(t => {
        t.addEventListener('click', () => {
          if (!active || busy) return;
          if (state.slots.length >= state.digits) return;
          state.slots.push(Number(t.dataset.d));
          const slot = area.querySelector('.build-slot[data-slot="' + (state.slots.length - 1) + '"]');
          if (slot) { slot.textContent = state.slots[state.slots.length - 1]; slot.classList.add('filled'); AudioSys.sfx.tap(); }
          if (state.slots.length === state.digits) {
            const val = Number(state.slots.join(''));
            attempts++;
            if (val === state.target) {
              correct++;
              area.querySelectorAll('.build-slot').forEach(s => s.classList.add('ok'));
              AudioSys.sfx.correct();
              AudioSys.praiseCorrect(params.profile);
              later(() => {
                round++;
                if (round >= ROUNDS) finish();
                else renderRound();
              }, 850);
            } else {
              AudioSys.sfx.wrong();
              AudioSys.encourage();
              later(() => { render(); speakPrompt(speakTxt, 400); }, 600);
            }
          }
        });
      });
    }

    /* ---------------- Mode: dengar & pilih ---------------- */
    function qListen() {
      let speakTxt, answer, options;
      if (unit.kind === 'angka') {
        const n = makeNum(unit);
        answer = n;
        speakTxt = kata(n) + '. Angka mana yang benar?';
        options = optionNumbers(n, unit.range[0], unit.range[1]);
      } else {
        const p = makeProblem(unit);
        answer = p.answer;
        speakTxt = p.speak;
        options = optionNumbers(answer, answerLo(unit), answerHi(unit));
      }
      area.innerHTML =
        promptBox(
          '<button class="btn-speaker" id="btn-speaker" aria-label="Dengar lagi">🔊</button>' +
          '<p class="match-hint">Dengarkan baik-baik, lalu pilih jawabannya!</p>'
        ) +
        optionButtons(options);
      document.getElementById('btn-speaker').addEventListener('click', () => AudioSys.speak(speakTxt, { flush: true, rate: 0.78 }));
      speakPrompt(speakTxt, 300);
      wireChoices((o, b) => handleAnswer(o, b, answer));
    }

    /* ---------------- Mode: tabel perkalian / pembagian ---------------- */
    function qTable() {
      const op = unit.op;
      const isKali = op === '×';
      let rows, answer;
      const hid = rand(0, 5);
      if (isKali) {
        const n = rand(1, unit.tableMax);
        rows = [1, 2, 3, 4, 5, 6].map(m => ({ label: n + ' × ' + m, val: n * m }));
        answer = rows[hid].val; // jawaban = baris yang dikosongkan
      } else {
        const q = rand(1, unit.tableMax);
        rows = [1, 2, 3, 4, 5, 6].map(m => ({ label: (q * m) + ' ÷ ' + m, val: q }));
        answer = q;
      }
      const options = optionNumbers(answer, answerLo(unit), answerHi(unit));
      area.innerHTML =
        promptBox(
          '<div class="math-table">' +
            rows.map((r, i) =>
              '<div class="math-table-row">' +
                '<span class="mt-label">' + r.label + '</span>' +
                '<span class="mt-eq">=</span>' +
                (i === hid
                  ? '<span class="mt-val blank">?</span>'
                  : '<span class="mt-val">' + r.val + '</span>') +
              '</div>'
            ).join('') +
          '</div>'
        ) +
        hint(isKali ? 'Lengkapi tabel perkaliannya!' : 'Lengkapi tabel pembagiannya!') +
        optionButtons(options);
      speakPrompt(isKali
        ? 'Lengkapi tabel perkalian. ' + rows[hid].label + ' sama dengan berapa?'
        : 'Lengkapi tabel pembagian. ' + rows[hid].label + ' sama dengan berapa?');
      wireChoices((o, b) => handleAnswer(o, b, answer));
    }

    /* ---------------- Mode: lanjutkan hitungan ---------------- */
    function qSkip() {
      let seq, answer;
      const op = unit.op;
      if (op === '+') {
        const step = [1, 2, 5, 10][rand(0, 3)];
        const startN = rand(0, Math.max(0, 30 - 4 * step));
        seq = [0, 1, 2, 3, 4].map(i => startN + i * step);
      } else if (op === '-') {
        const step = [1, 2, 5, 10][rand(0, 3)];
        const top = rand(20, 40);
        seq = [0, 1, 2, 3, 4].map(i => top - i * step);
      } else {
        // perkalian & pembagian: loncat kelipatan (menguatkan tabel)
        const n = rand(2, Math.min(5, unit.tableMax || 5));
        seq = [1, 2, 3, 4, 5].map(i => n * i);
      }
      const hid = rand(1, 3);
      answer = seq[hid];
      const options = optionNumbers(answer, 0, 50);
      area.innerHTML =
        promptBox(
          '<div class="seq-row">' + seq.map((v, i) =>
            i === hid ? '<span class="seq-slot empty">?</span>' : '<span class="seq-slot">' + v + '</span>'
          ).join('') + '</div>'
        ) +
        hint('Lanjutkan hitungannya ya!') +
        optionButtons(options);
      speakPrompt('Lanjutkan hitungannya! Angka apa yang hilang?');
      wireChoices((o, b) => handleAnswer(o, b, answer));
    }

    /* ---------------- Mode: bandingkan angka ---------------- */
    function qCompare() {
      const pool = numPool(unit);
      let a = pool[(Math.random() * pool.length) | 0];
      let b = pool[(Math.random() * pool.length) | 0];
      let guard = 0;
      while (b === a && guard++ < 8) b = pool[(Math.random() * pool.length) | 0];
      const answer = Math.max(a, b);
      area.innerHTML =
        promptBox(
          '<div class="compare-row">' +
            '<button class="compare-btn" data-v="' + a + '">' + a + '</button>' +
            '<span class="compare-vs">vs</span>' +
            '<button class="compare-btn" data-v="' + b + '">' + b + '</button>' +
          '</div>'
        ) +
        hint('Mana angka yang lebih besar?');
      speakPrompt('Mana yang lebih besar? ' + kata(a) + ' atau ' + kata(b) + '?');
      area.querySelectorAll('.compare-btn').forEach(btn => {
        btn.addEventListener('click', () => handleAnswer(btn.dataset.v, btn, answer));
      });
    }

    /* ---------------- Mode: soal cerita ---------------- */
    function qStory() {
      const op = unit.op;
      const p = makeProblem(unit);
      const e = EMOJI[rand(0, EMOJI.length - 1)];
      let story, speakTxt;
      if (op === '+') {
        story = 'Ada ' + p.a + ' ' + e + ', lalu diberi ' + p.b + ' ' + e + ' lagi. Berapa semuanya?';
      } else if (op === '-') {
        story = 'Ada ' + p.a + ' ' + e + ', ' + p.b + ' ' + e + ' dimakan. Berapa sisanya?';
      } else if (op === '×') {
        story = 'Ada ' + p.a + ' keranjang, tiap keranjang berisi ' + p.b + ' ' + e + '. Berapa semuanya?';
      } else {
        story = 'Ada ' + p.a + ' ' + e + ', dibagi rata ke ' + p.b + ' anak. Berapa ' + e + ' tiap anak?';
      }
      speakTxt = story;
      const options = optionNumbers(p.answer, answerLo(unit), answerHi(unit));
      area.innerHTML =
        promptBox(
          '<span class="quiz-emoji big">' + e + '</span>' +
          '<p class="story-text">' + story.replace(new RegExp(e, 'g'), '<b>' + e + '</b>') + '</p>'
        ) +
        optionButtons(options);
      speakPrompt(speakTxt, 300);
      wireChoices((o, b) => handleAnswer(o, b, p.answer));
    }

    function renderRound() {
      if (!active) return;
      progressEl.textContent = (round + 1) + '/' + ROUNDS;
      switch (mode) {
        case 'count': qCount(); break;
        case 'quiz': qQuiz(); break;
        case 'order': qOrder(); break;
        case 'balloon': qBalloon(); break;
        case 'memory': qMemory(); break;
        case 'pair': qPair(); break;
        case 'missing': qMissing(); break;
        case 'build': qBuild(); break;
        case 'listen': qListen(); break;
        case 'table': qTable(); break;
        case 'skip': qSkip(); break;
        case 'compare': qCompare(); break;
        case 'story': qStory(); break;
        default: finish(); break;
      }
    }

    function finish() {
      clearTimers();
      const accuracy = attempts ? Math.round((correct / attempts) * 100) : 100;
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
