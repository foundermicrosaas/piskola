/* ═══════════════════════════════════════════════════════════════════════
   Proxy TTS ElevenLabs — CACHE DI SERVER (hemat kredit API)
   ═══════════════════════════════════════════════════════════════════════
   - Satu teks di-generate SEKALI untuk SEMUA user & SEMUA perangkat,
     lalu disimpan sebagai file MP3 di folder `audio-cache/` dan dipanggil
     ulang tanpa menyentuh API lagi (0 kredit).
   - API key TIDAK perlu tersimpan di browser — cukup di server ini.
   - Node.js 18+ (menggunakan fetch bawaan). Tanpa npm install.

   Jalankan:
     node server.js            (default port 3000)

   Endpoint:
     GET /tts?text=...&voice=...&speed=...&token=...  → audio/mpeg (cache dulu)
     GET /voices?token=...                            → daftar voice akun

   Konfigurasi (variabel lingkungan atau file .env di folder yang sama):
     ELEVENLABS_API_KEY   (wajib)
     PORT                 (default 3000)
     TTS_TOKEN            (opsional — jika diisi, permintaan wajib &token=)
     ALLOWED_VOICES       (opsional, dipisah koma — daftar voice yang boleh)
     CACHE_DIR            (default ./audio-cache)
     MAX_RATE             (default 60 permintaan/menit per IP)
   ═══════════════════════════════════════════════════════════════════════ */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/* ---------- Konfigurasi ---------- */
function loadEnv() {
  const env = {};
  try {
    const txt = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
    txt.split('\n').forEach(l => {
      const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    });
  } catch (e) { /* tanpa .env */ }
  return env;
}
const ENV = Object.assign(loadEnv(), process.env);

const API_KEY = ENV.ELEVENLABS_API_KEY || '';
const PORT = Number(ENV.PORT) || 3000;
const TOKEN = ENV.TTS_TOKEN || '';
const ALLOWED = (ENV.ALLOWED_VOICES || '').split(',').map(v => v.trim()).filter(Boolean);
const CACHE_DIR = path.resolve(__dirname, ENV.CACHE_DIR || 'audio-cache');
const MAX_RATE = Number(ENV.MAX_RATE) || 60;
const MAX_TEXT = 300;
const EL_BASE = 'https://api.elevenlabs.io';

/* ---------- Cache di disk ---------- */
fs.mkdirSync(CACHE_DIR, { recursive: true });

function cacheFile(voice, speed, text) {
  const h = crypto.createHash('sha1').update(voice + '|' + speed + '|' + text).digest('hex');
  return path.join(CACHE_DIR, `${voice.slice(0, 8)}-${speed}-${h}.mp3`);
}

/* Generate (kalau belum ada) lalu kembalikan path file MP3.
   Dipakai oleh endpoint /tts DAN skrip warm.js (pra-generasi). */
async function ttsFile(text, voice, speed, log) {
  const sp = Math.max(0.7, Math.min(1.2, Number(speed) || 0.75));
  const file = cacheFile(voice, sp, text);
  if (fs.existsSync(file)) return { ok: true, file, cached: true };
  if (!API_KEY) return { ok: false, msg: 'ELEVENLABS_API_KEY belum diisi' };
  if (ALLOWED.length && !ALLOWED.includes(voice)) return { ok: false, msg: 'voice tidak diizinkan' };

  const res = await fetch(EL_BASE + '/v1/text-to-speech/' + encodeURIComponent(voice), {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.45, similarity_boost: 0.85, style: 0.55, use_speaker_boost: true }
    })
  });
  if (!res.ok) {
    const d = await res.text().catch(() => '');
    if (log) console.warn('[TTS] gagal (' + res.status + '):', d.slice(0, 300));
    return { ok: false, msg: 'ElevenLabs ' + res.status + ' ' + d.slice(0, 160) };
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(file, buf);
  if (log) console.log('[TTS] generate ' + voice + ' @' + sp + ' → ' + path.basename(file));
  return { ok: true, file, cached: false };
}

/* ---------- Config file (voice ID tersimpan di server, bukan hanya localStorage) ---------- */
const CONFIG_FILE = path.join(__dirname, 'app-config.json');

function readAppConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); }
  catch (e) { return {}; }
}
function writeAppConfig(cfg) {
  try { fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2)); } catch (e) { /* abaikan */ }
}

/* ---------- Pembatasan & keamanan ---------- */
const rateMap = new Map();
function allowed(ip) {
  const now = Date.now();
  const r = rateMap.get(ip);
  if (!r || now > r.resetAt) { rateMap.set(ip, { n: 1, resetAt: now + 60000 }); return true; }
  r.n++;
  if (rateMap.size > 5000) rateMap.clear();
  return r.n <= MAX_RATE;
}
function authorized(req) {
  if (!TOKEN) return true;
  const u = new URL(req.url, 'http://x');
  const hdr = req.headers['x-tts-token'] || '';
  return u.searchParams.get('token') === TOKEN || hdr === TOKEN;
}

/* ---------- Server ---------- */
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-tts-token');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const ip = req.socket.remoteAddress || '?';
  const u0 = new URL(req.url, 'http://x');
  const action = u0.searchParams.get('action') || '';

  /* GET /tts?action=get-config — kembalikan voice config (publik, aman — tidak ada API key)
     Menggunakan path /tts agar selalu lolos nginx proxy tanpa perlu konfigurasi tambahan. */
  if (req.method === 'GET' && (u0.pathname === '/tts' || u0.pathname === '/config') && action === 'get-config') {
    const cfg = readAppConfig();
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
    res.end(JSON.stringify({
      femaleVoiceId: cfg.femaleVoiceId || ENV.FEMALE_VOICE_ID || '',
      maleVoiceId:   cfg.maleVoiceId   || ENV.MALE_VOICE_ID   || '',
      speed:         cfg.speed         || 0.75,
      serverTts:     true,
      serverToken:   TOKEN // Berikan token ke PWA agar bisa memanggil /tts
    }));
    return;
  }

  /* POST /tts?action=set-config — simpan voice config dari Admin (token-protected)
     Menggunakan path /tts agar selalu lolos nginx proxy. */
  if (req.method === 'POST' && (u0.pathname === '/tts' || u0.pathname === '/config') && action === 'set-config') {
    if (!authorized(req)) { res.writeHead(401); res.end('token salah'); return; }
    let body = '';
    req.on('data', d => { body += d; if (body.length > 2048) req.destroy(); });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const current = readAppConfig();
        const updated = Object.assign(current, {
          femaleVoiceId: (data.femaleVoiceId || '').trim(),
          maleVoiceId:   (data.maleVoiceId   || '').trim(),
          speed:         Number(data.speed)   || 0.75
        });
        writeAppConfig(updated);
        console.log('[Config] disimpan:', JSON.stringify(updated));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400); res.end('JSON tidak valid');
      }
    });
    return;
  }

  if (req.method !== 'GET') { res.writeHead(405); res.end('method tidak diizinkan'); return; }

  if (!allowed(ip)) { res.writeHead(429); res.end('terlalu banyak permintaan — coba sebentar lagi'); return; }
  if (!authorized(req)) { res.writeHead(401); res.end('token salah'); return; }

  const u = new URL(req.url, 'http://x');
  const p = u.pathname;

  /* Daftar voice akun (untuk halaman admin) — cache 1 jam di memori */
  if (p === '/voices') {
    try {
      const r = await fetch(EL_BASE + '/v1/voices', { headers: { 'xi-api-key': API_KEY } });
      const j = await r.json();
      res.writeHead(r.ok ? 200 : r.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(j));
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: String(e.message || e) }));
    }
    return;
  }

  /* Sintesis suara dengan cache */
  if (p === '/tts') {
    const text = (u.searchParams.get('text') || '').trim();
    const voice = u.searchParams.get('voice') || '';
    const speed = Number(u.searchParams.get('speed')) || 0.75;
    if (!text) { res.writeHead(400); res.end('parameter text wajib diisi'); return; }
    if (text.length > MAX_TEXT) { res.writeHead(400); res.end('teks terlalu panjang (maks ' + MAX_TEXT + ' karakter)'); return; }
    if (!voice) { res.writeHead(400); res.end('parameter voice wajib diisi'); return; }

    const r = await ttsFile(text, voice, speed, true);
    if (!r.ok) { res.writeHead(502, { 'Content-Type': 'text/plain' }); res.end(r.msg); return; }
    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Content-Length': fs.statSync(r.file).size,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-TTS-Cache': r.cached ? 'hit' : 'miss'
    });
    fs.createReadStream(r.file).pipe(res);
    return;
  }

  res.writeHead(404);
  res.end('tidak ditemukan. Gunakan /tts atau /voices');
});

server.listen(PORT, () => {
  console.log('✔ Proxy TTS ElevenLabs aktif di port ' + PORT);
  console.log('  Cache: ' + CACHE_DIR);
  console.log('  API key: ' + (API_KEY ? 'terpasang ✓' : 'BELUM DIISI (set ELEVENLABS_API_KEY) ✗'));
  if (TOKEN) console.log('  Token: wajib (&token=...)');
  if (ALLOWED.length) console.log('  Voice yang diizinkan: ' + ALLOWED.join(', '));
});

module.exports = { ttsFile, cacheFile, CACHE_DIR, API_KEY };
