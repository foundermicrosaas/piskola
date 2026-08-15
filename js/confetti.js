/* Confetti ringan tanpa library — partikel DOM + requestAnimationFrame. */
window.Confetti = (() => {
  const COLORS = ['#FFD23F', '#FF8A3D', '#2EC4B6', '#3A86FF', '#FF70A6', '#80ED99', '#F9F871'];
  let layer = null;

  function ensureLayer() {
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'confetti-layer';
      document.body.appendChild(layer);
    }
    return layer;
  }

  /* Hujan bintang dari atas (penutup game) */
  function rain(count = 60) {
    const L = ensureLayer();
    const W = window.innerWidth;
    const parts = [];
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      const size = 6 + Math.random() * 8;
      el.style.cssText =
        'position:absolute;left:0;top:0;width:' + size + 'px;height:' + (size * (Math.random() < 0.5 ? 0.6 : 1)) + 'px;' +
        'background:' + COLORS[(Math.random() * COLORS.length) | 0] + ';' +
        'border-radius:' + (Math.random() < 0.5 ? '50%' : '3px') + ';' +
        'transform:translate(' + Math.random() * W + 'px,-30px) rotate(' + Math.random() * 360 + 'deg);';
      L.appendChild(el);
      parts.push({ el, x: Math.random() * W, y: -30, vy: 120 + Math.random() * 200, rot: Math.random() * 360, rotV: (Math.random() - 0.5) * 400, sway: Math.random() * 60, swayPhase: Math.random() * Math.PI * 2 });
    }
    let last = performance.now();
    let raf;
    function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      let alive = false;
      for (const p of parts) {
        p.y += p.vy * dt;
        p.x += Math.sin(now / 400 + p.swayPhase) * p.sway * dt;
        p.rot += p.rotV * dt;
        p.el.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px) rotate(' + p.rot + 'deg)';
        if (p.y < window.innerHeight + 40) alive = true;
      }
      if (alive) raf = requestAnimationFrame(frame);
      else parts.forEach(p => p.el.remove());
    }
    raf = requestAnimationFrame(frame);
  }

  /* Ledakan dari satu titik (jawaban benar) */
  function burst(count = 40, origin) {
    const L = ensureLayer();
    const W = window.innerWidth, H = window.innerHeight;
    const cx = origin ? origin.x : W / 2;
    const cy = origin ? origin.y : H / 2;
    const parts = [];
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      const size = 6 + Math.random() * 8;
      el.style.cssText =
        'position:absolute;left:0;top:0;width:' + size + 'px;height:' + size + 'px;' +
        'background:' + COLORS[(Math.random() * COLORS.length) | 0] + ';' +
        'border-radius:' + (Math.random() < 0.5 ? '50%' : '3px') + ';' +
        'transform:translate(' + cx + 'px,' + cy + 'px);';
      L.appendChild(el);
      const angle = Math.random() * Math.PI * 2;
      const speed = 140 + Math.random() * 260;
      parts.push({
        el, x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 180,
        rot: Math.random() * 360, rotV: (Math.random() - 0.5) * 720
      });
    }
    let last = performance.now();
    let raf;
    function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      let alive = false;
      for (const p of parts) {
        p.vy += 800 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.rotV * dt;
        p.el.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px) rotate(' + p.rot + 'deg)';
        if (p.y < H + 60) alive = true;
      }
      if (alive) raf = requestAnimationFrame(frame);
      else parts.forEach(p => p.el.remove());
    }
    raf = requestAnimationFrame(frame);
  }

  return { rain, burst };
})();
