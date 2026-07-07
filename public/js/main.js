document.addEventListener("DOMContentLoaded", () => {
  // Calendar
  const days = document.querySelectorAll(".day");
  const events = document.querySelectorAll(".event-item");

  days.forEach((day) => {
    day.addEventListener("click", () => {
      document.querySelectorAll(".day").forEach((d) => {
        d.classList.remove("active");
      });
      day.classList.add("active");

      const selectedDay = day.dataset.day;

      events.forEach((event) => {
        if (event.dataset.date === selectedDay) {
          event.style.display = "block";
        } else {
          event.style.display = "none";
        }
      });
    });
  });

  events.forEach((event) => {
    const day = event.dataset.date;
    const cell = document.querySelector(`.day[data-day="${day}"]`);
    if (cell) {
      cell.classList.add("has-event");
    }
  });

  let found = false;
  events.forEach((event) => {
    if (event.dataset.date === selectedDay) {
      found = true;
    }
  });

  document.getElementById("empty-event").classList.toggle("d-none", found);

  // GSAP reveal animations
  if (window.gsap) {
    if (window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
    }

    const heroTl = gsap.timeline();
    heroTl
      .from(".hero-eyebrow", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
      })
      .from(
        ".hero-title",
        { y: 30, opacity: 0, duration: 0.6, ease: "power2.out" },
        "-=0.3",
      )
      .from(
        ".hero-sub",
        { y: 20, opacity: 0, duration: 0.5, ease: "power2.out" },
        "-=0.3",
      )
      .from(
        ".hero-cta",
        { y: 20, opacity: 0, duration: 0.5, ease: "power2.out" },
        "-=0.3",
      );

    gsap.utils.toArray(".reveal-up").forEach((el, i) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        delay: (i % 6) * 0.06,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 90%",
        },
      });
    });

    gsap.utils.toArray(".detail-hero, .section-card").forEach((el) => {
      gsap.from(el, {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 90%" },
      });
    });
  }

  // Theme toggle (guest)
  const themeBtn = document.getElementById("themeToggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const html = document.documentElement;
      const isDark = html.getAttribute("data-bs-theme") === "dark";
      html.setAttribute("data-bs-theme", isDark ? "light" : "dark");
      themeBtn.innerHTML = isDark
        ? '<i class="bi bi-moon-stars"></i>'
        : '<i class="bi bi-sun"></i>';
    });
  }
});
