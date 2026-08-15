/* Helper UI kecil: pemilih elemen + pemindah layar. */
window.UI = (() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function showScreen(id) {
    $$('.screen').forEach(s => s.classList.remove('active'));
    const el = $('#screen-' + id);
    if (el) el.classList.add('active');
    window.scrollTo(0, 0);
  }

  return { $, $$, showScreen };
})();
