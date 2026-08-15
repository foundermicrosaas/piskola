/* Penyimpanan lokal (localStorage):
   - profiles: daftar akun anak (multi-profil; login = pilih akun + PIN)
   - progress:  { [profileId]: { [unitId]: { [gameId]: {stars,best,plays} } } }
   - settings:  { muted, elevenlabs: { apiKey, voiceId, speed } } */
window.Store = (() => {
  const KEY = 'piskola_v1';
  const KEY_OLD = 'belajarbaca_v1'; // nama lama (sebelum rebrand) — untuk migrasi data
  let data = null;

  function uid() {
    return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
  function fresh() {
    return { profiles: [], activeId: null, progress: {}, settings: {} };
  }

  function normProfile(p) {
    // Migrasi: akun lama tanpa PIN → PIN default 1234; catat waktu dibuat/aktif.
    // Default baru: tutor suara perempuan, tutor muslim nonaktif, akun gratis.
    if (p && p.pin === undefined) p.pin = '1234';
    if (p && p.tutorGender === undefined) p.tutorGender = 'female';
    if (p && p.muslim === undefined) p.muslim = false;
    if (p && p.isPro === undefined) p.isPro = false;
    if (p && !p.createdAt) p.createdAt = Date.now();
    if (p && !p.lastActiveAt) p.lastActiveAt = p.createdAt;
    return p;
  }

  function load() {
    try {
      // Migrasi dari nama lama (rebrand ke Piskola): pindahkan data sekali,
      // supaya profil, progres, dan pengaturan di perangkat TIDAK hilang.
      let raw = localStorage.getItem(KEY);
      if (!raw) {
        const old = localStorage.getItem(KEY_OLD);
        if (old) {
          raw = old;
          try { localStorage.setItem(KEY, old); } catch (e) { /* abaikan */ }
        }
      }
      data = raw ? JSON.parse(raw) : fresh();
    } catch (e) {
      data = fresh();
    }
    if (!data) data = fresh();

    // Migrasi dari bentuk lama (profil tunggal) → multi-profil
    data.profiles = (data.profiles || []).map(normProfile);
    if (!Array.isArray(data.profiles)) {
      const oldP = data.profile || null;
      const oldProg = data.progress || {};
      const oldSet = data.settings || {};
      const id = uid();
      data.profiles = oldP
        ? [normProfile({ id, nama: oldP.nama, panggilan: oldP.panggilan || 'kakak', avatar: oldP.avatar || '🐰', createdAt: oldP.createdAt || Date.now() })]
        : [];
      data.activeId = data.profiles.length ? id : null;
      data.progress = data.profiles.length ? { [id]: oldProg } : {};
      data.settings = oldSet;
    }
    return data;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* kuota penuh */ }
  }

  /* ---- Profil ---- */
  function getProfiles() { return data.profiles; }
  function getProfile() {
    // null saat logout (activeId null) → kembali ke layar login, bukan fallback ke profil pertama
    if (!data.activeId) return null;
    return data.profiles.find(p => p.id === data.activeId) || null;
  }
  function setActive(id) {
    data.activeId = id;
    const p = data.profiles.find(x => x.id === id);
    if (p) { p.lastActiveAt = Date.now(); }
    save();
  }
  function addProfile(p) {
    const np = normProfile({
      id: uid(), createdAt: Date.now(), lastActiveAt: Date.now(),
      nama: p.nama, panggilan: p.panggilan || 'kakak', avatar: p.avatar || '🐰',
      pin: p.pin || '1234'
    });
    data.profiles.push(np);
    data.activeId = np.id;
    save();
    return np;
  }
  function updateProfile(id, patch) {
    const p = data.profiles.find(x => x.id === id);
    if (p) Object.assign(p, patch);
    save();
    return p;
  }
  function deleteProfile(id) {
    data.profiles = data.profiles.filter(x => x.id !== id);
    delete data.progress[id];
    if (data.activeId === id) data.activeId = data.profiles.length ? data.profiles[0].id : null;
    save();
  }

  /* Aktifkan/nonaktifkan paket PRO untuk sebuah akun (kelola dari /admin).
     Akun gratis: 4 game pertama per unit; PRO: semua game terbuka. */
  function setPro(id, on) {
    const p = data.profiles.find(x => x.id === id);
    if (p) { p.isPro = !!on; save(); }
    return p;
  }

  /* Hapus HANYA progres pencapaian anak ini (bintang & nilai).
     Akun, profil, dan pengaturan tetap aman — satu akun bisa berisi banyak anak. */
  function clearProgress(pid) {
    const id = pid || (getProfile() || {}).id;
    if (!id) return;
    delete data.progress[id];
    save();
  }

  /* ---- Progres ---- */
  function getProgress(pid) {
    const id = pid || (getProfile() || {}).id;
    return id ? data.progress[id] || {} : {};
  }
  function getGameProgress(unitId, gameId, pid) {
    return (getProgress(pid)[unitId] || {})[gameId] || null;
  }
  function setGameProgress(unitId, gameId, res, pid) {
    const id = pid || (getProfile() || {}).id;
    if (!id) return null;
    data.progress[id] = data.progress[id] || {};
    data.progress[id][unitId] = data.progress[id][unitId] || {};
    const prev = data.progress[id][unitId][gameId] || { stars: 0, best: 0, plays: 0 };
    data.progress[id][unitId][gameId] = {
      stars: Math.max(prev.stars, res.stars),
      best: Math.max(prev.best, res.accuracy),
      plays: prev.plays + 1
    };
    save();
    return data.progress[id][unitId][gameId];
  }
  function profileStars(pid) {
    const prog = getProgress(pid);
    let s = 0;
    Object.keys(prog).forEach(u => Object.keys(prog[u]).forEach(g => { s += prog[u][g].stars || 0; }));
    return s;
  }

  /* ---- Statistik untuk halaman Admin ---- */
  function profileStats(pid) {
    const prog = getProgress(pid);
    let stars = 0, plays = 0, done = 0, bestSum = 0, bestN = 0;
    const perUnit = {};
    Object.keys(prog).forEach(u => {
      Object.keys(prog[u]).forEach(g => {
        const r = prog[u][g];
        stars += r.stars || 0;
        plays += r.plays || 0;
        done += 1;
        if (r.best) { bestSum += r.best; bestN += 1; }
        perUnit[u] = perUnit[u] || { stars: 0, done: 0 };
        perUnit[u].stars += r.stars || 0;
        perUnit[u].done += 1;
      });
    });
    return {
      stars, plays, done,
      avgAccuracy: bestN ? Math.round(bestSum / bestN) : 0,
      perUnit
    };
  }

  /* Statistik gabungan untuk semua profil */
  function allStats() {
    const byUnit = {};   // unitId → { players, stars, plays }
    let totalPlays = 0, totalStars = 0;
    data.profiles.forEach(pr => {
      const st = profileStats(pr.id);
      totalPlays += st.plays;
      totalStars += st.stars;
      Object.keys(st.perUnit).forEach(u => {
        byUnit[u] = byUnit[u] || { players: 0, stars: 0, plays: 0 };
        byUnit[u].players += 1;
        byUnit[u].stars += st.perUnit[u].stars;
      });
    });
    return { totalProfiles: data.profiles.length, totalPlays, totalStars, byUnit };
  }

  /* ---- Settings ---- */
  function getSettings() { return data.settings; }
  function setMuted(m) { data.settings.muted = m; save(); }
  function setElevenLabs(cfg) { data.settings.elevenlabs = cfg; save(); }
  function getElevenLabs() { return data.settings.elevenlabs || {}; }

  function resetAll() {
    localStorage.removeItem(KEY);
    localStorage.removeItem(KEY_OLD);
    data = fresh();
  }

  load();
  return {
    getProfiles, getProfile, setActive, addProfile, updateProfile, deleteProfile, clearProgress, setPro,
    getProgress, getGameProgress, setGameProgress, profileStars, profileStats, allStats,
    getSettings, setMuted, setElevenLabs, getElevenLabs, resetAll
  };
})();
