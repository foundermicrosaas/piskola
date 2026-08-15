/* Generator icon PNG — tanpa dependensi (Node stdlib saja).
   Menggambar ulang maskot kelinci (ikon aplikasi) secara prosedural
   dan menyimpannya sebagai PNG (RGBA, anti-aliasing via supersampling).
   Dipakai untuk: manifest PWA (192/512/maskable) + iOS apple-touch-icon. */
'use strict';
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

/* ---------- PNG encoder ---------- */
function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const body = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

/* ---------- Renderer (supersampling 4x, komposisi coverage) ---------- */
const BG = [255, 210, 63];     // #FFD23F
const WHITE = [255, 246, 233]; // #FFF6E9
const INK = [64, 50, 77];      // #40324D
const PINK = [255, 112, 166];  // #FF70A6
const C = 256; // pusat kanvas 512

function render(size, opts) {
  const ss = 4;
  const W = size * ss;
  const buf = new Float32Array(W * W * 4);
  const content = opts.content || 1; // skala konten terhadap pusat (maskable: < 1)
  const radius = opts.radius;        // sudut membulat latar; 0 = full-bleed (maskable)

  function K(v) { return (v - C) * content + C; } // skala koordinat konten

  function blend(x, y, cov, col) {
    if (cov <= 0) return;
    const i = (y * W + x) * 4;
    const a = cov;
    buf[i] = buf[i] * (1 - a) + col[0] * a;
    buf[i + 1] = buf[i + 1] * (1 - a) + col[1] * a;
    buf[i + 2] = buf[i + 2] * (1 - a) + col[2] * a;
    buf[i + 3] = 255;
  }
  function fillCircle(cxp, cyp, r, col) {
    const x0 = Math.max(0, Math.floor((cxp - r - 1) * ss));
    const x1 = Math.min(W - 1, Math.ceil((cxp + r + 1) * ss));
    const y0 = Math.max(0, Math.floor((cyp - r - 1) * ss));
    const y1 = Math.min(W - 1, Math.ceil((cyp + r + 1) * ss));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x / ss - cxp, dy = y / ss - cyp;
        if (dx * dx + dy * dy <= r * r) blend(x, y, 1, col);
      }
    }
  }
  function fillEllipse(cxp, cyp, rx, ry, col) {
    const x0 = Math.max(0, Math.floor((cxp - rx - 1) * ss));
    const x1 = Math.min(W - 1, Math.ceil((cxp + rx + 1) * ss));
    const y0 = Math.max(0, Math.floor((cyp - ry - 1) * ss));
    const y1 = Math.min(W - 1, Math.ceil((cyp + ry + 1) * ss));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = (x / ss - cxp) / rx, dy = (y / ss - cyp) / ry;
        if (dx * dx + dy * dy <= 1) blend(x, y, 1, col);
      }
    }
  }
  // kuadratik bezier digambar sebagai rangkaian titik tebal (capaian bulat)
  function strokeQuad(ax, ay, qx, qy, bx, by, w, col) {
    const N = 140;
    for (let i = 0; i <= N; i++) {
      const t = i / N, u = 1 - t;
      const x = u * u * ax + 2 * u * t * qx + t * t * bx;
      const y = u * u * ay + 2 * u * t * qy + t * t * by;
      fillCircle(K(x), K(y), w / 2, col);
    }
  }

  // 1) latar (rounded rect / full-bleed untuk maskable)
  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      const px = x / ss, py = y / ss;
      let ok = true;
      if (radius > 0) {
        const hw = 256 - radius;
        const dx = Math.max(Math.abs(px - 256) - hw, 0);
        const dy = Math.max(Math.abs(py - 256) - hw, 0);
        ok = dx * dx + dy * dy <= radius * radius;
      }
      if (ok) blend(x, y, 1, BG);
    }
  }

  // 2) kepala & badan (putih)
  fillCircle(K(256), K(236), 120 * content, WHITE);
  fillEllipse(K(256), K(250), 96 * content, 84 * content, WHITE);

  // 3) mata
  fillCircle(K(214), K(200), 12 * content, INK);
  fillCircle(K(298), K(200), 12 * content, INK);

  // 4) pipi
  fillEllipse(K(256), K(196), 10 * content, 7 * content, PINK);

  // 5) senyum wajah & senyum badan
  strokeQuad(226, 238, 256, 264, 286, 238, 10 * content, INK);
  strokeQuad(196, 300, 256, 346, 316, 300, 10 * content, INK);

  // ---------- downsampling 4x → RGBA akhir ----------
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let dy = 0; dy < ss; dy++) {
        for (let dx = 0; dx < ss; dx++) {
          const i = ((y * ss + dy) * W + (x * ss + dx)) * 4;
          r += buf[i]; g += buf[i + 1]; b += buf[i + 2]; a += buf[i + 3];
        }
      }
      const n = ss * ss;
      const o = (y * size + x) * 4;
      out[o] = Math.round(r / n);
      out[o + 1] = Math.round(g / n);
      out[o + 2] = Math.round(b / n);
      out[o + 3] = Math.round(a / n);
    }
  }
  return encodePNG(size, size, out);
}

/* ---------- output ---------- */
const outDir = path.join(__dirname, '..', 'icons');
const jobs = [
  ['icon-192.png', 192, { radius: 42, content: 1 }],
  ['icon-512.png', 512, { radius: 112, content: 1 }],
  ['icon-maskable-512.png', 512, { radius: 0, content: 0.72 }],
  ['icon-apple-180.png', 180, { radius: 40, content: 1 }]
];
jobs.forEach(([name, size, opts]) => {
  fs.writeFileSync(path.join(outDir, name), render(size, opts));
  console.log('wrote', name, size + 'px');
});
