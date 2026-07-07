/* Lenis smooth scroll + GSAP ScrollTrigger reveal wiring.
   Load after GSAP and Lenis CDN scripts. Degrades gracefully if either is absent. */
(function () {
  if (window.Lenis) {
    const lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', window.ScrollTrigger.update);
    }
  }
  // Reveal animations (GSAP if present, else IntersectionObserver fallback).
  const els = document.querySelectorAll('.reveal');
  if (window.gsap && window.ScrollTrigger) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    els.forEach((el) => window.gsap.fromTo(el, { opacity: 0, y: 24 }, {
      opacity: 1, y: 0, duration: 0.6,
      scrollTrigger: { trigger: el, start: 'top 85%' },
    }));
  } else if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    els.forEach((el) => io.observe(el));
  }
})();
