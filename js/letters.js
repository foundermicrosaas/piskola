/* Data bentuk huruf untuk game tracing.
   - UPPER/LOWER: path gambar tangan (fallback — dipakai kalau font tak tersedia)
   - resolve(letterCase): mengambil bentuk huruf ASLI dari font handwriting
     ("TraceHand" — Patrick Hand, di-bundle lokal) dengan merender glyph ke
     canvas lalu mengekstrak kontur tepinya (marching squares). Kontur inilah
     yang dipakai sebagai panduan garis putus-putus, jadi bentuk huruf presisi
     sesuai font — tidak lagi perkiraan manual.
   Format tiap huruf: array guratan; tiap guratan = polyline titik
   [x, y] ternormalisasi 0..100 (sama dengan UPPER/LOWER). */

window.Letters = (() => {
  /* ==================== FALLBACK: PATH GAMBAR TANGAN ==================== */
  const D = Math.PI / 180;

  function arc(cx, cy, rx, ry, a0, a1, n) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = (a0 + (a1 - a0) * (i / n)) * D;
      pts.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]);
    }
    return pts;
  }
  function line(x1, y1, x2, y2) { return [[x1, y1], [x2, y2]]; }
  function poly(pts) { return pts; }

  /* ==================== HURUF KAPITAL A–Z ==================== */
  const UPPER = {
    A: [poly([[12, 88], [50, 8], [88, 88]]), line(30, 56, 70, 56)],
    B: [
      line(20, 8, 20, 92),
      poly([[20, 8], ...arc(20, 27, 42, 42, -25, 25, 12), [20, 46]]),
      poly([[20, 52], ...arc(20, 72, 42, 42, -25, 25, 12), [20, 92]])
    ],
    C: [arc(50, 50, 36, 42, 35, 325, 18)],
    D: [
      line(20, 8, 20, 92),
      poly([[20, 8], ...arc(20, 50, 62, 42, -22, 22, 14), [20, 92]])
    ],
    E: [line(20, 8, 20, 92), line(20, 8, 82, 8), line(20, 50, 70, 50), line(20, 92, 82, 92)],
    F: [line(20, 8, 20, 92), line(20, 8, 82, 8), line(20, 50, 66, 50)],
    G: [arc(50, 50, 36, 42, 35, 325, 18), line(80, 50, 52, 50)],
    H: [line(16, 8, 16, 92), line(84, 8, 84, 92), line(16, 50, 84, 50)],
    I: [line(32, 8, 68, 8), line(50, 8, 50, 92), line(32, 92, 68, 92)],
    J: [line(30, 8, 70, 8), poly([[70, 8], [70, 70], ...arc(50, 74, 20, 20, 0, 100, 10)])],
    K: [line(20, 8, 20, 92), line(20, 45, 72, 18), line(20, 55, 72, 82)],
    L: [poly([[20, 8], [20, 92], [82, 92]])],
    M: [poly([[10, 88], [10, 12], [50, 70], [90, 12], [90, 88]])],
    N: [poly([[18, 8], [18, 92], [84, 8], [84, 92]])],
    O: [arc(50, 50, 40, 44, 0, 360, 20)],
    P: [
      line(20, 8, 20, 92),
      poly([[20, 8], ...arc(20, 27, 42, 42, -25, 25, 12), [20, 46]])
    ],
    Q: [arc(50, 50, 38, 42, 0, 360, 20), line(64, 70, 80, 90)],
    R: [
      line(20, 8, 20, 92),
      poly([[20, 8], ...arc(20, 27, 42, 42, -25, 25, 12), [20, 46]]),
      line(22, 54, 78, 92)
    ],
    S: [poly([...arc(45, 35, 24, 22, 180, 360, 10), [67, 36], [31, 66], ...arc(55, 66, 24, 20, 0, 180, 10)])],
    T: [line(50, 8, 50, 92), line(20, 8, 80, 8)],
    U: [poly([[20, 8], [20, 58], ...arc(50, 68, 30, 18, 180, 360, 10), [80, 58], [80, 8]])],
    V: [poly([[12, 12], [50, 88], [88, 12]])],
    W: [poly([[12, 12], [30, 88], [50, 25], [70, 88], [88, 12]])],
    X: [line(15, 12, 85, 88), line(85, 12, 15, 88)],
    Y: [line(15, 12, 50, 50), line(85, 12, 50, 50), line(50, 50, 50, 90)],
    Z: [poly([[18, 12], [82, 12], [18, 88], [82, 88]])]
  };

  /* ==================== HURUF KECIL a–z ==================== */
  const LOWER = {
    a: [arc(38, 52, 20, 20, 0, 360, 14), line(52, 30, 52, 78)],
    b: [
      line(24, 15, 24, 85),
      poly([[24, 50], ...arc(24, 66, 42, 24, -35, 35, 12), [24, 88]])
    ],
    c: [arc(50, 52, 34, 38, 40, 320, 16)],
    d: [arc(40, 56, 22, 22, 0, 360, 14), line(56, 28, 56, 82)],
    e: [arc(50, 58, 33, 36, 45, 315, 14), line(24, 58, 74, 58)],
    f: [line(42, 85, 42, 15), line(26, 20, 58, 20), line(30, 46, 54, 46)],
    g: [arc(42, 44, 24, 24, 0, 360, 14), poly([[58, 56], [56, 82], [42, 90]])],
    h: [line(24, 15, 24, 85), poly([[24, 50], [24, 32], [32, 20], [46, 18], [58, 26], [62, 42], [62, 85]])],
    i: [line(48, 14, 52, 18), line(50, 40, 50, 85)],
    j: [line(48, 14, 52, 18), poly([[50, 40], [50, 74], [38, 86]])],
    k: [line(24, 15, 24, 85), line(24, 45, 70, 18), line(24, 55, 68, 80)],
    l: [line(40, 15, 40, 85)],
    m: [
      poly([[14, 85], [14, 30], [30, 20], [46, 30], [46, 85]]),
      poly([[46, 32], [62, 22], [78, 32], [78, 85]])
    ],
    n: [poly([[14, 85], [14, 30], [32, 20], [50, 30], [50, 85]])],
    o: [arc(48, 52, 28, 30, 0, 360, 16)],
    p: [
      line(24, 30, 24, 95),
      poly([[24, 50], ...arc(24, 68, 42, 26, -35, 35, 12), [24, 95]])
    ],
    q: [arc(42, 54, 24, 22, 0, 360, 14), poly([[58, 58], [58, 92]])],
    r: [line(16, 85, 16, 32), poly([[16, 35], [45, 35], [49, 45]])],
    s: [poly([...arc(45, 36, 22, 20, 180, 360, 10), [67, 36], [31, 66], ...arc(55, 66, 24, 20, 0, 180, 10)])],
    t: [line(42, 85, 42, 15), line(24, 20, 60, 20), line(28, 45, 56, 45)],
    u: [poly([[16, 85], [16, 36], [32, 22], [50, 28], [56, 46], [56, 85]])],
    v: [poly([[14, 20], [45, 85], [76, 20]])],
    w: [poly([[12, 20], [30, 85], [48, 32], [66, 85], [84, 20]])],
    x: [line(16, 18, 76, 86), line(76, 18, 16, 86)],
    y: [line(14, 20, 46, 72), poly([[80, 20], [46, 72], [40, 92]])],
    z: [poly([[18, 20], [74, 20], [18, 80], [74, 80]])]
  };

  /* ==================== EKSTRAKTOR OUTLINE FONT ASLI ==================== */
  const FONT = 'TraceHand';   // @font-face di style.css (Patrick Hand, lokal)
  const GRID = 320;           // ukuran em glyph saat dirender (px)
  const PAD = 64;             // ruang di sekeliling glyph
  const RESAMPLE = 2.2;       // jarak antar titik setelah normalisasi (0..100)
  const RDP_EPS = 0.4;        // toleransi penyederhanaan kontur (0..100)
  const MIN_PERIM = 10;       // abaikan kontur kecil/noise (0..100)

  const cache = { upper: null, lower: null };

  /* Render glyph font ke canvas, kembalikan grid biner alpha. */
  function renderGlyph(letter) {
    const S = GRID + PAD * 2;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = S;
    const ctx = canvas.getContext('2d');
    ctx.font = '400 ' + GRID + 'px "' + FONT + '"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.fillText(letter, S / 2, S / 2);
    const data = ctx.getImageData(0, 0, S, S).data;
    const grid = new Uint8Array(S * S);
    for (let i = 3, j = 0; i < data.length; i += 4, j++) grid[j] = data[i] > 100 ? 1 : 0;
    return { grid, size: S };
  }

  /* Marching squares: potongan segmen garis pada tepi tiap sel. */
  function segmentsFrom(grid, size) {
    const segs = [];
    for (let y = 0; y < size - 1; y++) {
      for (let x = 0; x < size - 1; x++) {
        const c00 = grid[y * size + x];
        const c10 = grid[y * size + x + 1];
        const c11 = grid[(y + 1) * size + x + 1];
        const c01 = grid[(y + 1) * size + x];
        const cr = [];
        if (c00 !== c10) cr.push([x + 0.5, y]);        // atas
        if (c10 !== c11) cr.push([x + 1, y + 0.5]);    // kanan
        if (c11 !== c01) cr.push([x + 0.5, y + 1]);    // bawah
        if (c01 !== c00) cr.push([x, y + 0.5]);        // kiri
        if (cr.length === 2) {
          segs.push([cr[0], cr[1]]);
        } else if (cr.length === 4) {
          segs.push([cr[0], cr[1]]);
          segs.push([cr[2], cr[3]]);
        }
      }
    }
    return segs;
  }

  /* Rangkai segmen jadi kontur tertutup. */
  function chainContours(segs) {
    const key = (p) => Math.round(p[0] * 10) / 10 + ',' + Math.round(p[1] * 10) / 10;
    const byPt = new Map();
    const push = (p, rec) => {
      const k = key(p);
      if (!byPt.has(k)) byPt.set(k, []);
      byPt.get(k).push(rec);
    };
    segs.forEach((s, i) => { push(s[0], [i, 0]); push(s[1], [i, 1]); });

    const used = new Uint8Array(segs.length);
    const contours = [];
    for (let start = 0; start < segs.length; start++) {
      if (used[start]) continue;
      const pts = [];
      let cur = start, at = 0;
      let guard = 0;
      while (!used[cur] && guard++ <= segs.length + 1) {
        used[cur] = 1;
        pts.push([segs[cur][at][0], segs[cur][at][1]]);
        const nxt = segs[cur][1 - at];
        const list = byPt.get(key(nxt)) || [];
        let nextRec = null;
        for (let j = 0; j < list.length; j++) {
          if (!used[list[j][0]] && list[j][0] !== cur) { nextRec = list[j]; break; }
        }
        if (!nextRec) break;
        cur = nextRec[0];
        at = nextRec[1];
      }
      contours.push(pts);
    }
    return contours;
  }

  function distToSeg(p, a, b) {
    const abx = b[0] - a[0], aby = b[1] - a[1];
    const len2 = abx * abx + aby * aby;
    let t = len2 ? ((p[0] - a[0]) * abx + (p[1] - a[1]) * aby) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p[0] - (a[0] + abx * t), p[1] - (a[1] + aby * t));
  }

  /* Ramer–Douglas–Peucker: buang titik yang hampir segaris. */
  function simplify(pts, eps) {
    if (pts.length < 3) return pts.slice();
    let dmax = 0, idx = 0;
    const a = pts[0], b = pts[pts.length - 1];
    for (let i = 1; i < pts.length - 1; i++) {
      const d = distToSeg(pts[i], a, b);
      if (d > dmax) { dmax = d; idx = i; }
    }
    if (dmax > eps) {
      const l = simplify(pts.slice(0, idx + 1), eps);
      const r = simplify(pts.slice(idx), eps);
      return l.slice(0, -1).concat(r);
    }
    return [pts[0], pts[pts.length - 1]];
  }

  /* Ambil sampel titik dengan jarak seragam. */
  function resample(pts, step) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[i + 1];
      const len = Math.hypot(x2 - x1, y2 - y1);
      const n = Math.max(1, Math.round(len / step));
      for (let j = 0; j < n; j++) out.push([x1 + ((x2 - x1) * j) / n, y1 + ((y2 - y1) * j) / n]);
    }
    return out;
  }

  function area2(pts) {
    let s = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[(i + 1) % pts.length];
      s += x1 * y2 - x2 * y1;
    }
    return s;
  }

  function perimeter(pts) {
    let s = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[(i + 1) % pts.length];
      s += Math.hypot(x2 - x1, y2 - y1);
    }
    return s;
  }

  /* Mulai dari titik teratas (mulai menulis biasanya dari atas). */
  function rotateTop(pts) {
    let best = 0;
    for (let i = 1; i < pts.length; i++) {
      if (pts[i][1] < pts[best][1] - 1e-9 ||
          (Math.abs(pts[i][1] - pts[best][1]) < 1e-9 && pts[i][0] < pts[best][0])) best = i;
    }
    return pts.slice(best).concat(pts.slice(0, best));
  }

  /* Skalakan kontur (piksel) ke ruang 0..100, rata tengah, dengan margin. */
  function normalize(contours) {
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    contours.forEach(c => c.forEach(p => {
      if (p[0] < minX) minX = p[0];
      if (p[0] > maxX) maxX = p[0];
      if (p[1] < minY) minY = p[1];
      if (p[1] > maxY) maxY = p[1];
    }));
    const M = 3; // margin (0..100)
    const w = maxX - minX || 1, h = maxY - minY || 1;
    const scale = (100 - M * 2) / Math.max(w, h);
    const ox = (100 - w * scale) / 2 - minX * scale;
    const oy = (100 - h * scale) / 2 - minY * scale;
    return contours.map(c => c.map(p => [p[0] * scale + ox, p[1] * scale + oy]));
  }

  /* Ekstrak kontur satu huruf → array guratan (0..100). */
  function extract(letter) {
    const { grid, size } = renderGlyph(letter);
    const segs = segmentsFrom(grid, size);
    let contours = chainContours(segs).filter(c => c.length > 4);
    contours = normalize(contours);
    contours = contours.map(c => simplify(c, RDP_EPS));
    contours = contours.map(rotateTop);
    contours = contours.map(c => resample(c, RESAMPLE));
    contours = contours.filter(c => perimeter(c) >= MIN_PERIM);
    contours.sort((a, b) => Math.abs(area2(b)) - Math.abs(area2(a)));
    return contours;
  }

  /* Pastikan font sudah dimuat (atau beri waktu — lalu fallback). */
  function ensureFont() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.race([
      document.fonts.load('400 96px "' + FONT + '"', 'A').catch(() => []),
      new Promise(res => setTimeout(res, 3500))
    ]);
  }

  /* Siapkan peta huruf→guratan dari font asli; fallback path gambar tangan. */
  async function resolve(letterCase) {
    const key = letterCase === 'lower' ? 'lower' : 'upper';
    if (cache[key]) return cache[key];
    const fallback = key === 'upper' ? UPPER : LOWER;
    try {
      await ensureFont();
      const avail = !document.fonts || !document.fonts.check ||
        document.fonts.check('400 96px "' + FONT + '"', 'A');
      if (!avail) { cache[key] = fallback; return fallback; }

      const map = {};
      const chars = Object.keys(fallback);
      chars.forEach(ch => {
        const c = extract(ch);
        map[ch] = c.length ? c : fallback[ch];
      });
      // Validasi: semua huruf harus punya kontur hasil ekstraksi.
      const missing = chars.filter(ch => !map[ch] || !map[ch].length);
      if (missing.length) { cache[key] = fallback; return fallback; }
      cache[key] = map;
      return map;
    } catch (err) {
      cache[key] = fallback;
      return fallback;
    }
  }

  return { UPPER, LOWER, resolve, FONT };
})();
