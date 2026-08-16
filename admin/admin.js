/* Halaman Admin standalone (/admin):
   - 📊 Analitik: ringkasan + rincian per unit dan per pengguna
   - 👧 Pengguna: lihat, daftar, edit, hapus, pilih aktif
   - 🔊 Suara: konfigurasi ElevenLabs + tombol uji
   - ⚙️ Pengaturan: ganti password & logout
   Data dibaca langsung dari localStorage via Store (berbagi dengan aplikasi). */
(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  /* ==================== AUTH / LOGIN ==================== */

  const ADMIN_PW_KEY  = 'admin_password';
  const ADMIN_SESSION = 'admin_auth';
  const DEFAULT_PW    = 'piskola123';

  function getStoredPw() {
    return localStorage.getItem(ADMIN_PW_KEY) || DEFAULT_PW;
  }

  function isAuthenticated() {
    return sessionStorage.getItem(ADMIN_SESSION) === '1';
  }

  function doLogin(pw) {
    if (pw === getStoredPw()) {
      sessionStorage.setItem(ADMIN_SESSION, '1');
      $('#login-overlay').classList.add('hidden');
      init();
      return true;
    }
    return false;
  }

  function doLogout() {
    sessionStorage.removeItem(ADMIN_SESSION);
    location.reload();
  }

  /* Pasang event login */
  (function setupLogin() {
    const overlay  = $('#login-overlay');
    const pwInput  = $('#login-password');
    const errEl    = $('#login-error');
    const btnLogin = $('#btn-login');
    const btnToggle = $('#toggle-pw');

    /* Jika sudah auth di sesi ini, langsung masuk */
    if (isAuthenticated()) {
      overlay.classList.add('hidden');
      init();
      return;
    }

    btnToggle.addEventListener('click', () => {
      const show = pwInput.type === 'password';
      pwInput.type = show ? 'text' : 'password';
      btnToggle.textContent = show ? '🙈' : '👁️';
    });

    function tryLogin() {
      errEl.textContent = '';
      pwInput.classList.remove('shake');
      const ok = doLogin(pwInput.value);
      if (!ok) {
        pwInput.value = '';
        pwInput.classList.add('shake');
        errEl.textContent = '❌ Password salah, coba lagi.';
        setTimeout(() => pwInput.classList.remove('shake'), 450);
        pwInput.focus();
      }
    }

    btnLogin.addEventListener('click', tryLogin);
    pwInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryLogin(); });
  })();


  const UNIT_META = [
    { id: 'kapital-1', title: 'Unit 1 — Huruf Kapital A–I', emoji: '🔠' },
    { id: 'kapital-2', title: 'Unit 2 — Huruf Kapital J–R', emoji: '🔠' },
    { id: 'kapital-3', title: 'Unit 3 — Huruf Kapital S–Z', emoji: '🔠' },
    { id: 'kecil-1', title: 'Unit 4 — Huruf Kecil a–i', emoji: '🔡' },
    { id: 'kecil-2', title: 'Unit 5 — Huruf Kecil j–r', emoji: '🔡' },
    { id: 'kecil-3', title: 'Unit 6 — Huruf Kecil s–z', emoji: '🔡' },
    { id: 'suku-b', title: 'Unit 7 — Suku Kata b', emoji: '🧩' },
    { id: 'suku-m', title: 'Unit 8 — Suku Kata m', emoji: '🧩' },
    { id: 'suku-k', title: 'Unit 9 — Suku Kata k', emoji: '🧩' },
    /* Belajar Hitung */
    { id: 'h-angka', title: 'Hitung 1 — Mengenal Angka 0–10', emoji: '🔢' },
    { id: 'h-angka2', title: 'Hitung 2 — Angka 11–20', emoji: '🔟' },
    { id: 'h-tambah1', title: 'Hitung 3 — Penjumlahan s.d. 10', emoji: '➕' },
    { id: 'h-tambah2', title: 'Hitung 4 — Penjumlahan s.d. 20', emoji: '➕' },
    { id: 'h-kurang1', title: 'Hitung 5 — Pengurangan s.d. 10', emoji: '➖' },
    { id: 'h-kurang2', title: 'Hitung 6 — Pengurangan s.d. 20', emoji: '➖' },
    { id: 'h-kali1', title: 'Hitung 7 — Perkalian 1–5', emoji: '✖️' },
    { id: 'h-kali2', title: 'Hitung 8 — Perkalian 6–10', emoji: '✖️' },
    { id: 'h-bagi1', title: 'Hitung 9 — Pembagian 1–5', emoji: '➗' },
    { id: 'h-bagi2', title: 'Hitung 10 — Pembagian 6–10', emoji: '➗' }
  ];

  function panggilanLabel(p) { return p.panggilan === 'kakak' ? 'Kakak' : 'Adek'; }
  function fmtDate(ts) {
    if (!ts) return '—';
    return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function fmtDateShort(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    const now = Date.now();
    const diff = now - ts;
    if (diff < 60 * 60 * 1000) return 'baru saja';
    if (diff < 24 * 60 * 60 * 1000) return 'hari ini';
    if (diff < 7 * 24 * 60 * 60 * 1000) return Math.round(diff / (24 * 60 * 60 * 1000)) + ' hari lalu';
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }

  /* ==================== TAB ==================== */

  function switchTab(tab) {
    $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    $('#admin-analytics').classList.toggle('hidden', tab !== 'analytics');
    $('#admin-users').classList.toggle('hidden', tab !== 'users');
    $('#admin-voice').classList.toggle('hidden', tab !== 'voice');
    $('#admin-settings').classList.toggle('hidden', tab !== 'settings');
    if (tab === 'analytics') renderAnalytics();
    if (tab === 'users') renderUsers();
    if (tab === 'voice') renderVoice();
  }

  /* ==================== ANALITIK ==================== */

  function renderAnalytics() {
    const profiles = Store.getProfiles();
    const all = Store.allStats();
    const el = $('#admin-analytics');

    if (!profiles.length) {
      el.innerHTML = '<p class="empty">Belum ada pengguna. Daftarkan anak pertama di tab 👧 Pengguna.</p>';
      return;
    }

    // Kartu ringkasan
    const summary =
      '<div class="stat-cards">' +
        '<div class="stat-card"><span class="stat-num">' + profiles.length + '</span><span class="stat-lbl">Akun anak</span></div>' +
        '<div class="stat-card"><span class="stat-num">' + all.totalPlays + '</span><span class="stat-lbl">Game dimainkan</span></div>' +
        '<div class="stat-card"><span class="stat-num">' + all.totalStars + '</span><span class="stat-lbl">Total bintang</span></div>' +
      '</div>';

    // Per unit
    const unitRows = UNIT_META.map(u => {
      const st = all.byUnit[u.id] || { players: 0, stars: 0 };
      const pct = profiles.length ? Math.round((st.players / profiles.length) * 100) : 0;
      return (
        '<div class="unit-stat">' +
          '<span class="unit-stat-name">' + u.emoji + ' ' + u.title + '</span>' +
          '<span class="unit-stat-meta">' + st.players + '/' + profiles.length + ' anak • ⭐' + st.stars + '</span>' +
          '<div class="bar"><div class="bar-fill" style="width:' + pct + '%"></div></div>' +
        '</div>'
      );
    }).join('');

    // Per pengguna (dapat diperluas → rincian per unit)
    const userRows = profiles.map(pr => {
      const st = Store.profileStats(pr.id);
      const unitDetail = UNIT_META.map(u => {
        const pu = st.perUnit[u.id];
        if (!pu) return '';
        return '<div class="user-unit"><span>' + u.emoji + ' ' + u.title + '</span><span>⭐' + pu.stars + ' • ' + pu.done + ' game</span></div>';
      }).join('');
      return (
        '<div class="analytics-user">' +
          '<div class="analytics-user-head">' +
            '<span class="user-avatar">' + pr.avatar + '</span>' +
            '<div class="user-info">' +
              '<b>' + pr.nama + '</b>' +
              '<small>' + panggilanLabel(pr) + ' • terakhir aktif ' + fmtDateShort(pr.lastActiveAt) + '</small>' +
            '</div>' +
            '<button class="btn btn-secondary sm" data-toggle-unit="' + pr.id + '">📈</button>' +
          '</div>' +
          '<div class="analytics-metrics">' +
            '<span>⭐ ' + st.stars + ' bintang</span>' +
            '<span>🎮 ' + st.plays + ' game</span>' +
            '<span>🎯 ' + st.avgAccuracy + '% akurasi</span>' +
            '<span>✅ ' + st.done + ' game selesai</span>' +
            '<span>👶 Dibuat ' + fmtDate(pr.createdAt) + '</span>' +
          '</div>' +
          '<div class="user-unit-detail hidden" data-unit-detail="' + pr.id + '">' + (unitDetail || '<p class="empty">Belum ada progres.</p>') + '</div>' +
        '</div>'
      );
    }).join('');

    el.innerHTML =
      '<div class="admin-head"><h3>📊 Ringkasan</h3></div>' +
      summary +
      '<div class="admin-card"><h3>🗺️ Kemajuan per Unit</h3>' + unitRows + '</div>' +
      '<div class="admin-card"><h3>🧒 Rincian per Pengguna</h3>' + userRows + '</div>';

    $$('[data-toggle-unit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.toggleUnit;
        const d = document.querySelector('[data-unit-detail="' + id + '"]');
        if (d) d.classList.toggle('hidden');
      });
    });
  }

  /* ==================== PENGGUNA ==================== */

  let auDraft = { panggilan: 'kakak', avatar: '🐰' };

  function renderUsers() {
    const profiles = Store.getProfiles();
    const active = Store.getProfile();
    const list = $('#admin-users');

    list.innerHTML =
      '<div class="admin-head">' +
        '<h3>👧 Pengguna (Anak)</h3>' +
        '<button class="btn btn-primary sm" id="btn-add-user">➕ Daftarkan anak</button>' +
      '</div>' +
      '<div id="add-user-form" class="user-form hidden">' +
        '<input id="au-name" placeholder="Nama anak" maxlength="12">' +
        '<input id="au-pin" type="password" inputmode="numeric" maxlength="4" placeholder="PIN 4 angka (untuk login)" autocomplete="new-password">' +
        '<div class="panggilan-row small">' +
          '<button class="panggilan-btn sm" data-au-pg="kakak">👧 Kakak</button>' +
          '<button class="panggilan-btn sm" data-au-pg="adek">🧒 Adek</button>' +
        '</div>' +
        '<div class="avatar-grid small">' +
          Array.from('🐰🐱🐻🦊🐼').map(e => '<button class="avatar-btn" data-au-av="' + e + '">' + e + '</button>').join('') +
        '</div>' +
        '<div class="admin-actions">' +
          '<button class="btn btn-secondary sm" id="btn-au-cancel">Batal</button>' +
          '<button class="btn btn-primary sm" id="btn-au-save">Simpan</button>' +
        '</div>' +
      '</div>' +
      '<div class="user-list">' +
        (profiles.length
          ? profiles.map(pr => {
              const st = Store.profileStats(pr.id);
              return (
                '<div class="user-row' + (active && pr.id === active.id ? ' active' : '') + '" data-uid="' + pr.id + '">' +
                  '<span class="user-avatar">' + pr.avatar + '</span>' +
                  '<div class="user-info">' +
                    '<b>' + pr.nama + (pr.isPro ? ' <span class="pro-badge">⭐ PRO</span>' : '') + '</b>' +
                    '<small>' + panggilanLabel(pr) + ' • ⭐ ' + st.stars + ' • 🎮 ' + st.plays +
                    (active && pr.id === active.id ? ' • aktif' : '') + '</small>' +
                  '</div>' +
                  '<div class="user-actions">' +
                    '<button class="btn btn-secondary sm" data-act="pro" title="' + (pr.isPro ? 'Nonaktifkan PRO' : 'Aktifkan PRO') + '">' + (pr.isPro ? '⭐' : '☆') + '</button>' +
                    (active && pr.id === active.id ? '' : '<button class="btn btn-secondary sm" data-act="activate">Pilih</button>') +
                    '<button class="btn btn-secondary sm" data-act="edit">✏️</button>' +
                    '<button class="btn btn-secondary sm danger" data-act="del">🗑️</button>' +
                  '</div>' +
                '</div>'
              );
            }).join('')
          : '<p class="empty">Belum ada pengguna. Daftarkan anak pertama!</p>')
      + '</div>';

    $('#btn-add-user').addEventListener('click', () => {
      $('#add-user-form').classList.toggle('hidden');
      if (!$('#add-user-form').classList.contains('hidden')) {
        auDraft = { panggilan: 'kakak', avatar: '🐰' };
        $('#au-name').value = '';
        $('#au-pin').value = '';
        $$('[data-au-pg]').forEach(b => b.classList.toggle('selected', b.dataset.auPg === 'kakak'));
        $$('[data-au-av]').forEach(b => b.classList.toggle('selected', b.dataset.auAv === '🐰'));
        $('#au-name').focus();
      }
    });
    $('#btn-au-cancel').addEventListener('click', () => $('#add-user-form').classList.add('hidden'));

    $$('[data-au-pg]').forEach(b => b.addEventListener('click', () => {
      $$('[data-au-pg]').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      auDraft.panggilan = b.dataset.auPg;
    }));
    $$('[data-au-av]').forEach(b => b.addEventListener('click', () => {
      $$('[data-au-av]').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      auDraft.avatar = b.dataset.auAv;
    }));

    $('#btn-au-save').addEventListener('click', () => {
      const nama = $('#au-name').value.trim();
      const pin = $('#au-pin').value.trim();
      if (!nama) { $('#au-name').focus(); return; }
      if (pin && pin.length !== 4) { alert('PIN harus 4 angka.'); return; }
      Store.addProfile({ nama, panggilan: auDraft.panggilan, avatar: auDraft.avatar, pin: pin || '1234' });
      renderUsers();
      renderAnalytics();
    });

    $$('.user-row').forEach(row => {
      const id = row.dataset.uid;
      row.querySelectorAll('[data-act]').forEach(btn => {
        btn.addEventListener('click', () => {
          const act = btn.dataset.act;
          if (act === 'activate') {
            Store.setActive(id);
            renderUsers();
            renderAnalytics();
          } else if (act === 'pro') {
            const pr = Store.getProfiles().find(x => x.id === id);
            if (!pr) return;
            if (!pr.isPro && !confirm('Aktifkan PRO untuk ' + pr.nama + '? Semua game terbuka (4 game gratis pertama saja untuk akun lain).')) return;
            Store.setPro(id, !pr.isPro);
            renderUsers();
            renderAnalytics();
          } else if (act === 'edit') {
            editUser(id, row);
          } else if (act === 'del') {
            if (!confirm('Hapus pengguna ini beserta progresnya?')) return;
            Store.deleteProfile(id);
            renderUsers();
            renderAnalytics();
          }
        });
      });
    });
  }

  function editUser(id, row) {
    const p = Store.getProfiles().find(x => x.id === id);
    if (!p) return;
    row.innerHTML =
      '<div class="user-form inline">' +
        '<input id="eu-name" value="' + p.nama + '" maxlength="12">' +
        '<input id="eu-pin" type="password" inputmode="numeric" maxlength="4" value="' + p.pin + '" autocomplete="new-password" placeholder="PIN baru (4 angka)">' +
        '<div class="panggilan-row small">' +
          '<button class="panggilan-btn sm' + (p.panggilan === 'kakak' ? ' selected' : '') + '" data-eu-pg="kakak">👧 Kakak</button>' +
          '<button class="panggilan-btn sm' + (p.panggilan === 'adek' ? ' selected' : '') + '" data-eu-pg="adek">🧒 Adek</button>' +
        '</div>' +
        '<div class="avatar-grid small">' +
          Array.from('🐰🐱🐻🦊🐼').map(e =>
            '<button class="avatar-btn' + (p.avatar === e ? ' selected' : '') + '" data-eu-av="' + e + '">' + e + '</button>'
          ).join('') +
        '</div>' +
        '<div class="admin-actions">' +
          '<button class="btn btn-secondary sm" id="btn-eu-cancel">Batal</button>' +
          '<button class="btn btn-primary sm" id="btn-eu-save">Simpan</button>' +
        '</div>' +
      '</div>';

    const draft = { panggilan: p.panggilan, avatar: p.avatar };
    $$('[data-eu-pg]').forEach(b => b.addEventListener('click', () => {
      $$('[data-eu-pg]').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      draft.panggilan = b.dataset.euPg;
    }));
    $$('[data-eu-av]').forEach(b => b.addEventListener('click', () => {
      $$('[data-eu-av]').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      draft.avatar = b.dataset.euAv;
    }));
    $('#btn-eu-cancel').addEventListener('click', () => renderUsers());
    $('#btn-eu-save').addEventListener('click', () => {
      const pin = $('#eu-pin').value.trim();
      Store.updateProfile(id, {
        nama: $('#eu-name').value.trim() || p.nama,
        panggilan: draft.panggilan,
        avatar: draft.avatar,
        pin: pin.length === 4 ? pin : p.pin
      });
      renderUsers();
      renderAnalytics();
    });
  }

  /* ==================== SUARA ELEVENLABS ==================== */

  // Salinan mini sistem suara untuk tombol Uji (tanpa bergantung AudioSys/UI app)
  let lastTest = null;
  function testElVoice(text, cfg) {
    lastTest = null;
    return fetch('https://api.elevenlabs.io/v1/text-to-speech/' + encodeURIComponent(cfg.voiceId), {
      method: 'POST',
      headers: { 'xi-api-key': cfg.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.6, similarity_boost: 0.85, style: 0.35, use_speaker_boost: true }
      })
    }).then(async (res) => {
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        console.warn('[Admin·ElevenLabs] gagal (' + res.status + '):', detail.slice(0, 300));
        return { ok: false, msg: 'ElevenLabs ' + res.status + ': ' + detail.slice(0, 140) };
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = new Audio(url);
      lastTest = a;
      a.play().catch(() => { });
      return { ok: true, msg: 'ok' };
    }).catch(err => ({ ok: false, msg: 'Gagal terhubung: ' + err.message }));
  }

  function renderVoice() {
    const el = Store.getElevenLabs();
    $('#el-api-key').value = el.apiKey || '';
    $('#el-female-voice').value = el.femaleVoiceId || el.voiceId || '';
    $('#el-male-voice').value = el.maleVoiceId || '';
    $('#el-server-tts').checked = !!el.serverTts;
    $('#el-server-url').value = el.serverUrl || '/tts';
    $('#el-server-token').value = el.serverToken || '';
    const sp = Number(el.speed) || 0.75;
    $('#el-speed').value = sp;
    $('#el-speed-label').textContent = sp.toFixed(2);
    $('#el-status').textContent = '';
    const hasKey = !!el.apiKey;
    const hasServer = !!(el.serverTts && el.serverUrl);
    const hasVoice = !!(el.femaleVoiceId || el.maleVoiceId || el.voiceId);
    $('#el-state').textContent = (hasServer && hasVoice)
      ? '✅ Mode SERVER aktif — suara di-generate sekali di server, dipakai semua user (perempuan: ' + (el.femaleVoiceId || el.voiceId) + ', laki-laki: ' + (el.maleVoiceId || el.femaleVoiceId || el.voiceId) + ').'
      : (hasKey && hasVoice)
        ? '✅ Tersimpan — aplikasi memakai ElevenLabs langsung dari browser (perempuan: ' + (el.femaleVoiceId || el.voiceId) + ', laki-laki: ' + (el.maleVoiceId || el.femaleVoiceId || el.voiceId) + ', kecepatan ' + sp.toFixed(2) + ').'
        : 'ℹ️ Belum dikonfigurasi — aplikasi memakai suara bawaan browser.';
  }

  function wireVoice() {
    $('#el-speed').addEventListener('input', (e) => {
      $('#el-speed-label').textContent = Number(e.target.value).toFixed(2);
    });

    $('#btn-el-save').addEventListener('click', async () => {
      const el = Store.getElevenLabs();
      const female = $('#el-female-voice').value.trim();
      const male = $('#el-male-voice').value.trim();
      const serverTts = $('#el-server-tts').checked;
      const serverUrl = $('#el-server-url').value.trim() || '/tts';
      const serverToken = $('#el-server-token').value.trim();
      const speed = Number($('#el-speed').value) || 0.75;
      Store.setElevenLabs({
        apiKey: $('#el-api-key').value.trim(),
        femaleVoiceId: female,
        maleVoiceId: male,
        voiceId: female || male || el.voiceId || '', // kompatibilitas lama
        speed,
        serverTts,
        serverUrl,
        serverToken
      });
      renderVoice();

      // Kirim voice config ke server agar SEMUA perangkat user otomatis mendapatkannya
      // Gunakan /tts?action=set-config agar selalu lolos nginx proxy (tidak perlu ubah nginx)
      const configPayload = { femaleVoiceId: female, maleVoiceId: male, speed };
      const configUrl = new URL(serverUrl, location.href);
      if (!/\/tts$/i.test(configUrl.pathname)) configUrl.pathname = configUrl.pathname.replace(/\/+$/, '') + '/tts';
      configUrl.searchParams.set('action', 'set-config');
      if (serverToken) configUrl.searchParams.set('token', serverToken);
      const headers = { 'Content-Type': 'application/json' };
      if (serverToken) headers['x-tts-token'] = serverToken;
      try {
        const r = await fetch(configUrl.toString(), { method: 'POST', headers, body: JSON.stringify(configPayload) });
        if (r.ok) {
          $('#el-status').textContent = serverTts
            ? '✅ Tersimpan & dikirim ke server. Semua perangkat user akan otomatis memakai suara ini.'
            : '✅ Tersimpan & dikirim ke server. Tutor perempuan & laki-laki memakai suara masing-masing.';
        } else {
          $('#el-status').textContent = '✅ Tersimpan di perangkat ini. ⚠️ Gagal kirim ke server (' + r.status + ') — user di perangkat lain perlu buka admin untuk sinkronisasi.';
        }
      } catch (e) {
        $('#el-status').textContent = serverTts
          ? '✅ Tersimpan — mode SERVER aktif. Pastikan server proxy TTS berjalan (lihat DEPLOY.md) dan API key terisi di server.'
          : '✅ Tersimpan. Tutor perempuan & laki-laki memakai suara masing-masing.';
      }
    });

    $('#btn-el-test').addEventListener('click', async () => {
      const gender = $('#el-test-gender').value;
      const voiceId = gender === 'male'
        ? ($('#el-male-voice').value.trim() || $('#el-female-voice').value.trim())
        : ($('#el-female-voice').value.trim() || $('#el-male-voice').value.trim());
      const serverMode = $('#el-server-tts').checked && !!$('#el-server-url').value.trim();
      if (!voiceId) {
        $('#el-status').textContent = '⚠️ Isi Voice ID (' + (gender === 'male' ? 'laki-laki' : 'perempuan') + ') dulu.';
        return;
      }
      $('#el-status').textContent = '⏳ Membuat suara (' + (gender === 'male' ? 'laki-laki' : 'perempuan') + ')...';

      // Mode server: uji lewat proxy server (server memegang API key)
      if (serverMode) {
        const url = new URL($('#el-server-url').value.trim(), location.href);
        if (!/\/tts$/i.test(url.pathname)) url.pathname = url.pathname.replace(/\/+$/, '') + '/tts';
        url.searchParams.set('text', 'Halo! Ayo belajar membaca! Ini suara server, pelan dan ceria.');
        url.searchParams.set('voice', voiceId);
        url.searchParams.set('speed', String(Number($('#el-speed').value) || 0.75));
        const tk = $('#el-server-token').value.trim();
        if (tk) url.searchParams.set('token', tk);
        try {
          const res = await fetch(url);
          if (!res.ok) {
            const d = await res.text().catch(() => '');
            $('#el-status').textContent = '❌ Server TTS ' + res.status + ': ' + d.slice(0, 160);
            return;
          }
          const blob = await res.blob();
          const a = new Audio(URL.createObjectURL(blob));
          lastTest = a;
          a.play().catch(() => { });
          $('#el-status').textContent = '🔊 Berhasil lewat server! Dengarkan suaranya.';
        } catch (e) {
          $('#el-status').textContent = '❌ Server tidak merespons. Pastikan server proxy TTS berjalan (lihat DEPLOY.md).';
        }
        return;
      }

      const cfg = {
        apiKey: $('#el-api-key').value.trim(),
        voiceId,
        speed: Number($('#el-speed').value) || 0.75
      };
      if (!cfg.apiKey) {
        $('#el-status').textContent = '⚠️ Isi API Key dulu (atau centang Mode Server di atas).';
        return;
      }
      const r = await testElVoice('Halo! Ayo belajar membaca! Ini suara ElevenLabs, pelan dan ceria.', cfg);
      if (r.ok) {
        $('#el-status').textContent = '🔊 Berhasil! Dengarkan suaranya. Jika kurang bagus, coba voice lain.';
      } else {
        const hint = r.msg.includes('missing the permission text_to_speech')
          ? ' → key ini TIDAK punya izin text-to-speech. Buat API key baru dengan akses penuh di dashboard ElevenLabs.'
          : (r.msg.includes('invalid_uid') || r.msg.includes('not found'))
            ? ' → Voice ID tidak ditemukan. Gunakan tombol 📋 untuk memilih ID yang benar.'
            : '';
        $('#el-status').textContent = '❌ ' + r.msg + hint;
      }
    });

    // Ambil daftar voice asli dari akun; isi field yang sesuai tombol 📋 yang ditekan
    let voiceTarget = 'female';
    $$('[data-voices-for]').forEach(btn => {
      btn.addEventListener('click', () => {
        voiceTarget = btn.dataset.voicesFor;
        loadVoices();
      });
    });

    async function loadVoices() {
      const apiKey = $('#el-api-key').value.trim();
      const box = $('#el-voices');
      if (!apiKey) { $('#el-status').textContent = '⚠️ Isi API Key dulu, lalu klik 📋.'; return; }
      $('#el-status').textContent = '⏳ Mengambil daftar voice...';
      try {
        const res = await fetch('https://api.elevenlabs.io/v1/voices', {
          headers: { 'xi-api-key': apiKey, 'Accept': 'application/json' }
        });
        if (!res.ok) {
          const d = await res.text().catch(() => '');
          $('#el-status').textContent = '❌ Gagal mengambil voice (' + res.status + '): ' + d.slice(0, 140);
          return;
        }
        const data = await res.json();
        const voices = (data.voices || []).map(v => ({
          id: v.voice_id,
          name: v.name,
          lang: ((v.labels || {}).language || '').toLowerCase()
        }));
        box.classList.remove('hidden');
        const targetLbl = voiceTarget === 'male' ? 'tutor Laki-laki' : 'tutor Perempuan';
        box.innerHTML =
          '<p class="admin-note">Ditemukan ' + voices.length + ' voice — pilih untuk mengisi <b>' + targetLbl + '</b>:</p>' +
          '<div class="voice-pick">' +
            voices.map(v =>
              '<button class="voice-item' + (v.lang === 'id' ? ' id' : '') + '" data-vid="' + v.id + '">' +
                '<span class="vi-name">' + v.name + '</span>' +
                '<span class="vi-meta">' + (v.lang === 'id' ? '🇮🇩 Indonesia ' : '') + v.id + '</span>' +
              '</button>'
            ).join('') +
          '</div>';
        box.querySelectorAll('.voice-item').forEach(b => b.addEventListener('click', () => {
          if (voiceTarget === 'male') $('#el-male-voice').value = b.dataset.vid;
          else $('#el-female-voice').value = b.dataset.vid;
          box.querySelectorAll('.voice-item').forEach(x => x.classList.remove('picked'));
          b.classList.add('picked');
          $('#el-status').textContent = '✅ Voice ID ' + targetLbl + ' terisi: ' + b.dataset.vid + '. Klik 🔊 Uji Suara untuk mencoba.';
        }));
        $('#el-status').textContent = '✅ Berhasil memuat ' + voices.length + ' voice dari akunmu.';
      } catch (err) {
        $('#el-status').textContent = '❌ Gagal terhubung: ' + err.message;
      }
    }
  }

  /* ==================== PENGATURAN (GANTI PW + LOGOUT) ==================== */

  function wireSettings() {
    const statusEl = $('#settings-status');

    $('#btn-change-pw').addEventListener('click', () => {
      statusEl.textContent = '';
      const oldPw  = $('#settings-old-pw').value;
      const newPw  = $('#settings-new-pw').value;
      const newPw2 = $('#settings-new-pw2').value;

      if (oldPw !== getStoredPw()) {
        statusEl.textContent = '❌ Password lama salah.';
        return;
      }
      if (newPw.length < 6) {
        statusEl.textContent = '❌ Password baru minimal 6 karakter.';
        return;
      }
      if (newPw !== newPw2) {
        statusEl.textContent = '❌ Konfirmasi password tidak cocok.';
        return;
      }
      localStorage.setItem(ADMIN_PW_KEY, newPw);
      $('#settings-old-pw').value = '';
      $('#settings-new-pw').value = '';
      $('#settings-new-pw2').value = '';
      statusEl.textContent = '✅ Password berhasil diganti!';
    });

    $('#btn-logout').addEventListener('click', () => {
      if (confirm('Yakin ingin keluar dari sesi admin?')) doLogout();
    });
  }

  /* ==================== INIT ==================== */

  function init() {
    $$('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));
    wireVoice();
    wireSettings();
    switchTab('analytics');
  }

})();
