/* ═══════════════════════════════════════════════════════════════════════
   PRA-GENERASI MATERI AUDIO (warm-up) — hemat kredit jangka panjang
   ═══════════════════════════════════════════════════════════════════════
   Men-generate SEKALI seluruh materi inti ke cache server (folder
   audio-cache/), sehingga saat anak bermain suara langsung tersedia
   (0 kredit). Materi nama anak (sapaan/pujian) tetap di-cache otomatis
   oleh server saat pertama kali dipakai — sekali untuk semua user.

   Penggunaan:
     node warm.js --voice <voiceId> [--speed 0.7] [--key sk_xxx] [--dry-run]

   Materi yang di-generate (~220 suara, sekali seumur hidup):
     - 26 nama huruf            (a, be, ce, de, ... zet)
     - 70 kata bank belajar     (baju, balon, buku, ...)
     - 15 suku kata             (ba, bi, bu, be, bo, ma, ...)
     - 101 angka 0–100          (nol, satu, dua, ... seratus)
     -  8 penyemangat           (Ayo coba lagi, pasti bisa! ...)
   ═══════════════════════════════════════════════════════════════════════ */
'use strict';

const { ttsFile, CACHE_DIR } = require('./server.js');
const path = require('path');

const LETTERS = {
  a: 'a', b: 'be', c: 'ce', d: 'de', e: 'e', f: 'ef', g: 'ge', h: 'ha', i: 'i',
  j: 'je', k: 'ka', l: 'el', m: 'em', n: 'en', o: 'o', p: 'pe', q: 'ki', r: 'er',
  s: 'es', t: 'te', u: 'u', v: 've', w: 'we', x: 'eks', y: 'ye', z: 'zet'
};

const WORDS = [
  'baju', 'balon', 'batu', 'bantal', 'bangku',
  'biru', 'bintang', 'bibir', 'biskuit', 'bibit',
  'buku', 'burung', 'buah', 'bus', 'bumi',
  'bebek', 'beras', 'bendera', 'benang', 'becak',
  'bola', 'boneka', 'botol', 'bolu', 'bohlam',
  'mama', 'mata', 'mangga', 'masjid', 'macan',
  'minum', 'mic', 'mie', 'mimpi',
  'mutiara', 'mulut', 'murid', 'museum',
  'melon', 'merah', 'mentega', 'melati', 'mentimun',
  'mobil', 'motor', 'monyet', 'mop',
  'kambing', 'kapal', 'katak', 'kaca', 'kartu',
  'kipas', 'kijang', 'kiri', 'kiwi',
  'kucing', 'kursi', 'kue', 'kuda',
  'kereta', 'kertas', 'kelinci', 'kepiting', 'kemeja',
  'koki', 'kotak', 'kompor', 'kopi', 'koper'
];

const SYLLABLES = ['ba', 'bi', 'bu', 'be', 'bo', 'ma', 'mi', 'mu', 'me', 'mo', 'ka', 'ki', 'ku', 'ke', 'ko'];

const SATUAN = ['nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
const BELAS = ['sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas',
  'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas'];
function angka(n) {
  n = Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
  if (n <= 9) return SATUAN[n];
  if (n < 20) return BELAS[n - 10];
  if (n === 100) return 'seratus';
  const puluh = Math.floor(n / 10), satu = n % 10;
  const pk = SATUAN[puluh] + ' puluh';
  return satu ? pk + ' ' + SATUAN[satu] : pk;
}

const ENCOURAGE = [
  'Tidak apa-apa, ayo coba lagi ya!',
  'Ayo coba lagi, pasti bisa!',
  'Jangan menyerah, coba sekali lagi ya!',
  'Tidak apa-apa! Coba lagi, ya!',
  'Hampir benar! Ayo coba lagi!',
  'Ayo semangat, coba lagi ya!',
  'InsyaAllah, kamu pasti bisa! Coba lagi ya!',
  'InsyaAllah, pelan-pelan saja, ayo coba lagi!'
];

/* ---------- Argumen ---------- */
const args = process.argv.slice(2);
function flag(name, def) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
}
const voice = flag('--voice', '');
const speed = Number(flag('--speed', '0.7'));
const dry = args.includes('--dry-run');

if (!voice && !dry) {
  console.error('Gunakan: node warm.js --voice <voiceId> [--speed 0.7] [--key sk_xxx] [--dry-run]');
  process.exit(1);
}

/* ---------- Bangun daftar ---------- */
const items = [];
Object.keys(LETTERS).forEach(k => items.push({ t: LETTERS[k], s: speed, g: 'huruf' }));
WORDS.forEach(w => items.push({ t: w, s: speed, g: 'kata' }));
SYLLABLES.forEach(sy => items.push({ t: sy, s: speed, g: 'suku kata' }));
for (let n = 0; n <= 100; n++) items.push({ t: angka(n), s: speed, g: 'angka' });
ENCOURAGE.forEach(e => items.push({ t: e, s: 0.79, g: 'penyemangat' }));

const byGroup = {};
items.forEach(i => { byGroup[i.g] = (byGroup[i.g] || 0) + 1; });

console.log('════════════════════════════════════════════');
console.log('Pra-generasi materi audio ke: ' + CACHE_DIR);
console.log('  Voice: ' + (voice || '(dry-run)') + '   Kecepatan materi: ' + speed);
console.log('  Total: ' + items.length + ' suara');
Object.keys(byGroup).forEach(g => console.log('    • ' + byGroup[g] + ' ' + g));
console.log('════════════════════════════════════════════');

if (dry) { console.log('(dry-run — tidak ada yang di-generate)'); process.exit(0); }

(async () => {
  let ok = 0, cached = 0, fail = 0;
  const start = Date.now();
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const r = await ttsFile(it.t, voice, it.s, false);
    if (r.ok) { ok++; if (r.cached) cached++; }
    else { fail++; console.warn('  ✗ [' + it.g + '] "' + it.t + '": ' + r.msg); }
    if ((i + 1) % 50 === 0 || i === items.length - 1) {
      console.log('  ' + (i + 1) + '/' + items.length + ' (' + ok + ' ok, ' + cached + ' sudah ada, ' + fail + ' gagal)');
    }
  }
  const s = ((Date.now() - start) / 1000).toFixed(1);
  console.log('════════════════════════════════════════════');
  console.log('Selesai dalam ' + s + ' dtk.');
  console.log('  Berhasil: ' + ok + '   (baru: ' + (ok - cached) + ' kredit terpakai, sudah ada: ' + cached + ')');
  console.log('  Gagal: ' + fail);
  if (fail) console.log('  Cek API key & voice ID di atas.');
  console.log('Materi inti kini siap di-cache server — anak tinggal main, 0 kredit.');
})().catch(e => { console.error(e); process.exit(1); });
