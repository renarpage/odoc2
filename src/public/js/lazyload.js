/* Lazy image loading + infinite scroll for the public activity archive. */
(function () {
  // Native lazy first; IntersectionObserver fallback for data-src images.
  const imgs = document.querySelectorAll('img[data-src]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const img = e.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        io.unobserve(img);
      });
    }, { rootMargin: '200px' });
    imgs.forEach((i) => io.observe(i));
  } else {
    imgs.forEach((i) => { i.src = i.dataset.src; });
  }

  // Infinite scroll: appends to [data-archive-grid] from /activities.json
  const grid = document.querySelector('[data-archive-grid]');
  if (!grid) return;
  let page = 1; let loading = false; let done = false;
  const sentinel = document.querySelector('[data-archive-sentinel]');
  if (!sentinel) return;
  const io2 = new IntersectionObserver(async (entries) => {
    if (!entries[0].isIntersecting || loading || done) return;
    loading = true;
    page += 1;
    try {
      const res = await fetch(`/activities.json?page=${page}`);
      const json = await res.json();
      const items = (json.data && json.data.items) || [];
      if (!items.length) { done = true; return; }
      items.forEach((a) => {
        const card = document.createElement('a');
        card.href = `/activity/${a.slug}`;
        card.className = 'neu-card reveal is-in activity-card';
        card.innerHTML = `<h3>${a.title}</h3><p>${a.summary || ''}</p><span class="badge">${a.status}</span>`;
        grid.appendChild(card);
      });
    } catch (_) { /* ignore */ } finally { loading = false; }
  }, { rootMargin: '400px' });
  io2.observe(sentinel);
})();
