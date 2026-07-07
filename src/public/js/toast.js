/* Minimal toast + theme toggle. window.odocToast(message, kind) and [data-theme-toggle]. */
(function () {
  window.odocToast = function (message, kind) {
    const host = document.getElementById('odoc-toast-host');
    if (!host) return;
    const el = document.createElement('div');
    el.className = 'odoc-toast ' + (kind || 'info');
    el.textContent = message;
    host.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3500);
  };

  // Persisted light/dark theme toggle.
  const saved = localStorage.getItem('odoc-theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', cur);
      localStorage.setItem('odoc-theme', cur);
    });
  });
})();
