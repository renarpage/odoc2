document.addEventListener("DOMContentLoaded", () => {
  // ===== Home cover image fallback (CSP-safe; no inline onerror) =====
  document.querySelectorAll("[data-fallback-img]").forEach((im) => {
    im.addEventListener("error", () => {
      im.remove();
      // parent .card-img-wrap shows its gradient + icon placeholder
    });
  });

  // ===== Calendar (guarded) =====
  const emptyEvent = document.getElementById("empty-event");
  const days = document.querySelectorAll(".day");
  const events = document.querySelectorAll(".event-item");
  if (days.length) {
    days.forEach((day) => {
      day.addEventListener("click", () => {
        days.forEach((d) => d.classList.remove("active"));
        day.classList.add("active");
        const selectedDay = day.dataset.day;
        let found = false;
        events.forEach((event) => {
          const match = event.dataset.date === selectedDay;
          event.style.display = match ? "block" : "none";
          if (match) found = true;
        });
        if (emptyEvent) emptyEvent.classList.toggle("d-none", found);
      });
    });
    events.forEach((event) => {
      const cell = document.querySelector(`.day[data-day="${event.dataset.date}"]`);
      if (cell) cell.classList.add("has-event");
    });
  }

  // ===== Archive: instant client-side filter + pagination =====
  const grid = document.getElementById("archiveGrid");
  if (grid) {
    const cards = Array.from(grid.querySelectorAll("[data-activity-card]"));
    const pills = Array.from(document.querySelectorAll("[data-filter]"));
    const pager = document.getElementById("archivePagination");
    const empty = document.getElementById("archiveEmpty");
    const PAGE_SIZE = 9;
    const activePill = document.querySelector("[data-filter].active");
    let filter = activePill ? activePill.dataset.filter : "all";
    let page = 1;

    const matches = (c) => filter === "all" || c.dataset.status === filter;

    function renderPager(pages) {
      if (!pager) return;
      if (pages <= 1) { pager.innerHTML = ""; return; }
      let html = "";
      html += `<a class="page-pill ${page === 1 ? "disabled" : ""}" data-page="${page - 1}"><i class="bi bi-chevron-left"></i></a>`;
      for (let p = 1; p <= pages; p++) {
        html += `<a class="page-pill ${p === page ? "active" : ""}" data-page="${p}">${p}</a>`;
      }
      html += `<a class="page-pill ${page === pages ? "disabled" : ""}" data-page="${page + 1}"><i class="bi bi-chevron-right"></i></a>`;
      pager.innerHTML = html;
    }

    function render() {
      const list = cards.filter(matches);
      const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
      if (page > pages) page = pages;
      cards.forEach((c) => { c.style.display = "none"; });
      list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).forEach((c) => { c.style.display = ""; });
      if (empty) empty.style.display = list.length ? "none" : "block";
      renderPager(pages);
    }

    pills.forEach((p) => p.addEventListener("click", (e) => {
      e.preventDefault();
      pills.forEach((x) => x.classList.remove("active"));
      p.classList.add("active");
      filter = p.dataset.filter;
      page = 1;
      render();
    }));

    if (pager) pager.addEventListener("click", (e) => {
      const a = e.target.closest("[data-page]");
      if (!a) return;
      e.preventDefault();
      const n = parseInt(a.dataset.page, 10);
      const pages = Math.max(1, Math.ceil(cards.filter(matches).length / PAGE_SIZE));
      if (!isNaN(n) && n >= 1 && n <= pages) { page = n; render(); }
    });

    render();
  }

  // ===== GSAP reveal animations =====
  if (window.gsap) {
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    if (document.querySelector(".hero-title")) {
      const heroTl = gsap.timeline();
      heroTl
        .from(".hero-eyebrow", { y: 20, opacity: 0, duration: 0.5, ease: "power2.out" })
        .from(".hero-title", { y: 30, opacity: 0, duration: 0.6, ease: "power2.out" }, "-=0.3")
        .from(".hero-sub", { y: 20, opacity: 0, duration: 0.5, ease: "power2.out" }, "-=0.3")
        .from(".hero-cta", { y: 20, opacity: 0, duration: 0.5, ease: "power2.out" }, "-=0.3");
    }
    gsap.utils.toArray(".detail-hero, .section-card").forEach((el) => {
      gsap.from(el, { opacity: 0, y: 20, duration: 0.6, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 90%" } });
    });
  }

  // ===== Theme toggle (guest) =====
  const themeBtn = document.getElementById("themeToggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const html = document.documentElement;
      const isDark = html.getAttribute("data-bs-theme") === "dark";
      html.setAttribute("data-bs-theme", isDark ? "light" : "dark");
      themeBtn.innerHTML = isDark ? '<i class="bi bi-moon-stars"></i>' : '<i class="bi bi-sun"></i>';
    });
  }
});
