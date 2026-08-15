/* Game 2 — Tebak Bentuk Huruf (tracing):
   Anak mengikuti garis putus-putus huruf dengan jari di canvas.
   Tiap guratan selesai → suara + lanjut guratan berikutnya.
   Semua huruf selesai → pujian + bintang. */
window.GameTracing = (() => {
  let active = false;
  let raf = 0;
  let timers = [];
  let animT = 0;
  let state = null;          // state huruf yang sedang ditelusuri
  let onResize = null;
  let PATH = Letters.UPPER;  // kumpulan bentuk huruf aktif (kapital/kecil)

  function later(fn, ms) { const t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  function sampleStroke(points, step) {
    const out = [];
    for (let i = 0; i < points.length - 1; i++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[i + 1];
      const len = Math.hypot(x2 - x1, y2 - y1);
      const n = Math.max(1, Math.floor(len / step));
      for (let j = 0; j < n; j++) out.push([x1 + ((x2 - x1) * j) / n, y1 + ((y2 - y1) * j) / n]);
    }
    out.push(points[points.length - 1]);
    return out;
  }

  function setupCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function initLetter(letter, ctx, canvas, callbacks) {
    const rect = canvas.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    const PAD = 22;
    const size = Math.min(w, h) - PAD * 2;
    const ox = (w - size) / 2, oy = (h - size) / 2;
    const strokes = (PATH[letter] || []).map(stroke =>
      stroke.map(([x, y]) => [ox + (x / 100) * size, oy + (y / 100) * size])
    );
    const samples = strokes.map(st => sampleStroke(st, 3));
    const st = {
      letter, ctx, w, h, strokes, samples,
      covered: samples.map(s => new Uint8Array(s.length)),
      counts: samples.map(s => s.length),
      strokeIdx: 0,
      strokeLock: false,   // mencegah strokeComplete terpicu berulang
      drawing: false,
      trail: [],
      complete: false,
      callbacks
    };
    st.reset = () => {
      st.covered = st.samples.map(s => new Uint8Array(s.length));
      st.strokeIdx = 0;
      st.strokeLock = false;
      st.trail = [];
      st.complete = false;
    };
    return st;
  }

  function handlePointer(st, x, y) {
    if (!st || st.complete) return;
    const smp = st.samples[st.strokeIdx];
    if (!smp) return;
    const R = 26;
    const cov = st.covered[st.strokeIdx];
    let newly = 0;
    for (let i = 0; i < smp.length; i++) {
      if (!cov[i]) {
        const dx = smp[i][0] - x, dy = smp[i][1] - y;
        if (dx * dx + dy * dy < R * R) { cov[i] = 1; newly++; }
      }
    }
    if (newly > 0) {
      st.trail.push([x, y]);
      if (st.trail.length > 40) st.trail.shift();
      let done = 0;
      for (let i = 0; i < cov.length; i++) done += cov[i];
      if (!st.strokeLock && done / st.counts[st.strokeIdx] >= 0.92) {
        st.strokeLock = true;
        strokeComplete(st);
      }
    }
  }

  function strokeComplete(st) {
    // st.strokeLock sudah diset oleh handlePointer sebelum memanggil fungsi ini
    if (st.complete) return;
    AudioSys.sfx.stroke();
    const endPt = st.samples[st.strokeIdx][st.samples[st.strokeIdx].length - 1];
    Confetti.burst(12, { x: endPt[0] + st.ctx.canvas.getBoundingClientRect().left, y: endPt[1] + st.ctx.canvas.getBoundingClientRect().top });
    const last = st.strokeIdx >= st.strokes.length - 1;
    later(() => {
      if (last) letterComplete(st);
      else {
        // Nama huruf hanya diucapkan SEKALI saat huruf muncul (buildLetter),
        // bukan di tiap guratan — dulu W (2 guratan) terdengar dua kali "we we".
        st.strokeIdx++;
        st.strokeLock = false;
        st.trail = [];
      }
    }, 450);
  }

  function letterComplete(st) {
    if (st.complete) return;
    st.complete = true;
    st.drawing = false;
    st.trail = [];
    AudioSys.sfx.letterDone();
    AudioSys.sfx.fanfare();
    Confetti.rain(40);
    st.callbacks.onLetterComplete();
  }

  function draw(st) {
    const ctx = st.ctx;
    ctx.clearRect(0, 0, st.w, st.h);

    // Panduan: semua guratan putus-putus (guratan aktif lebih tegas + berjalan)
    st.strokes.forEach((stroke, si) => {
      ctx.beginPath();
      stroke.forEach(([x, y], pi) => (pi === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.strokeStyle = si === st.strokeIdx ? '#FFD23F' : '#d9cde4';
      ctx.lineWidth = si === st.strokeIdx ? 5 : 3;
      ctx.lineCap = 'round';
      ctx.setLineDash([8, 8]);
      if (si === st.strokeIdx) ctx.lineDashOffset = -animT * 0.6;
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Tinta: bagian guratan yang sudah ditelusuri
    st.strokes.forEach((_, si) => drawInked(st, si));

    // Jejak jari
    for (let i = 0; i < st.trail.length; i++) {
      const a = (i / st.trail.length) * 0.35;
      ctx.beginPath();
      ctx.arc(st.trail[i][0], st.trail[i][1], 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(58,134,255,' + a + ')';
      ctx.fill();
    }

    if (!st.complete) {
      // Titik target: ujung guratan yang belum ditelusuri
      const smp = st.samples[st.strokeIdx];
      const cov = st.covered[st.strokeIdx];
      let target = null;
      for (let i = 0; i < smp.length; i++) if (!cov[i]) { target = smp[i]; break; }
      if (target) {
        const pulse = 7 + Math.sin(animT * 0.09) * 2.5;
        ctx.beginPath();
        ctx.arc(target[0], target[1], pulse, 0, Math.PI * 2);
        ctx.fillStyle = '#FF70A6';
        ctx.fill();
      }
    } else {
      // Huruf selesai: garis tebal menyala
      ctx.beginPath();
      st.strokes.forEach(stroke => stroke.forEach(([x, y], pi) => (pi === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y))));
      ctx.strokeStyle = '#2EC4B6';
      ctx.lineWidth = 13;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(46,196,182,0.8)';
      ctx.shadowBlur = 18;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  function drawInked(st, si) {
    const smp = st.samples[si];
    const cov = st.covered[si];
    const ctx = st.ctx;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#2EC4B6';
    let run = [];
    const flush = () => {
      if (run.length > 1) {
        ctx.beginPath();
        ctx.moveTo(run[0][0], run[0][1]);
        for (let i = 1; i < run.length; i++) ctx.lineTo(run[i][0], run[i][1]);
        ctx.stroke();
      }
      run = [];
    };
    for (let i = 0; i < smp.length; i++) {
      if (cov[i]) run.push(smp[i]);
      else flush();
    }
    flush();
  }

  function start({ letters, letterCase, profile, onDone }) {
    PATH = (letterCase === 'upper' ? Letters.UPPER : Letters.LOWER) || Letters.UPPER;
    active = true;
    timers = [];
    animT = 0;
    const area = document.getElementById('game-area');
    const progressEl = document.getElementById('game-progress');
    let letterIdx = 0;
    let totalResets = 0;

    // Bentuk huruf asli diambil dari font (marching squares). Tampilkan
    // status singkat sambil menunggu; hasilnya di-cache per huruf besar/kecil.
    progressEl.textContent = 'Menyiapkan huruf…';
    area.innerHTML = '<p class="trace-hint" style="text-align:center">Menyiapkan huruf… ✏️</p>';

    Letters.resolve(letterCase)
      .then((map) => { if (active) { PATH = map; buildLetter(0); } })
      .catch(() => { if (active) { buildLetter(0); } });

    function buildLetter(idx) {
      if (!active) return;
      const letter = letters[idx];
      let letterResets = 0;

      progressEl.textContent = 'Huruf ' + (idx + 1) + '/' + letters.length;
      area.innerHTML =
        '<div class="letter-dots">' +
          letters.map((l, i) =>
            '<span class="letter-dot' + (i < letterIdx ? ' done' : i === letterIdx ? ' now' : '') + '"></span>'
          ).join('') +
        '</div>' +
        '<div class="trace-top">' +
          '<span class="trace-letter" id="trace-letter">' + letter + '</span>' +
          '<button class="icon-btn" id="btn-speak-letter" aria-label="Dengar huruf">🔊</button>' +
        '</div>' +
        '<p class="trace-hint" id="trace-hint">' + (idx === 0 ? 'Ikuti garis putus-putus dengan jarimu! ✏️' : '') + '</p>' +
        '<div class="canvas-wrap"><canvas id="trace-canvas"></canvas></div>' +
        '<div class="trace-controls">' +
          '<button class="btn btn-secondary" id="btn-reset">🔄 Ulangi</button>' +
          '<button class="btn btn-primary" id="btn-next" hidden>Lanjut ➡️</button>' +
        '</div>';

      const canvas = document.getElementById('trace-canvas');
      const ctx = setupCanvas(canvas);
      state = initLetter(letter, ctx, canvas, {
        onLetterComplete() {
          totalResets += letterResets;
          const nextBtn = document.getElementById('btn-next');
          const resetBtn = document.getElementById('btn-reset');
          if (nextBtn) nextBtn.hidden = false;
          if (resetBtn) resetBtn.hidden = true;
          const hint = document.getElementById('trace-hint');
          if (hint) hint.textContent = 'Hebat! Huruf ' + letter + ' selesai! 🎉';
          AudioSys.praiseCorrect(profile);
        }
      });

      // event canvas
      canvas.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (state.complete) return;
        state.drawing = true;
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* event sintetis / tidak didukung */ }
        const [x, y] = pos(e);
        handlePointer(state, x, y);
      });
      canvas.addEventListener('pointermove', (e) => {
        if (!state.drawing) return;
        const [x, y] = pos(e);
        handlePointer(state, x, y);
      });
      ['pointerup', 'pointercancel'].forEach(ev =>
        canvas.addEventListener(ev, () => { if (state) state.drawing = false; })
      );

      document.getElementById('btn-speak-letter').addEventListener('click', () => AudioSys.speakLetter(letter, { flush: true }));
      document.getElementById('btn-reset').addEventListener('click', () => {
        letterResets++;
        state.reset();
        AudioSys.sfx.tap();
      });
      document.getElementById('btn-next').addEventListener('click', () => {
        AudioSys.sfx.tap();
        if (idx + 1 >= letters.length) finish();
        else { letterIdx++; buildLetter(idx + 1); }
      });

      later(() => AudioSys.speakLetter(letter), 350);
    }

    function finish() {
      const stars = totalResets === 0 ? 3 : totalResets <= 2 ? 2 : 1;
      const accuracy = totalResets === 0 ? 100 : totalResets <= 2 ? 85 : 70;
      AudioSys.sfx.fanfare();
      Confetti.rain(70);
      later(() => {
        active = false;
        cleanup();
        onDone({ stars, accuracy, plays: 1 });
      }, 600);
    }

    buildLetter(0);

    // loop gambar
    function loop() {
      if (!active) { raf = 0; return; }
      if (state) draw(state);
      animT++;
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    onResize = () => {
      if (!active) return;
      const canvas = document.getElementById('trace-canvas');
      if (!canvas) return;
      const idxNow = letterIdx;
      buildLetter(idxNow);
    };
    window.addEventListener('resize', onResize);
  }

  function pos(e) {
    const rect = e.target.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  }

  function cleanup() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    clearTimers();
    if (onResize) window.removeEventListener('resize', onResize);
    onResize = null;
    state = null;
  }

  function cancel() {
    active = false;
    cleanup();
  }

  return { start, cancel };
})();
