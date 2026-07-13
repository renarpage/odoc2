document.addEventListener("DOMContentLoaded", () => {
  // Mobile sidebar toggle
  const burger = document.getElementById("sidebarBurger");
  const sidebar = document.getElementById("adminSidebar");
  if (burger && sidebar) {
    burger.addEventListener("click", () => sidebar.classList.toggle("show"));
    document.addEventListener("click", (e) => {
      if (
        sidebar.classList.contains("show") &&
        !sidebar.contains(e.target) &&
        !burger.contains(e.target)
      ) {
        sidebar.classList.remove("show");
      }
    });
  }

  // ===== Multi-step Activity Wizard =====
  const wizard = document.getElementById("activityWizard");
  if (wizard) {
    const steps = Array.from(wizard.querySelectorAll(".wizard-step"));
    const panes = Array.from(wizard.querySelectorAll(".wizard-pane"));
    const nextBtns = wizard.querySelectorAll("[data-wizard-next]");
    const prevBtns = wizard.querySelectorAll("[data-wizard-prev]");
    let current = 0;

    function renderStep() {
      steps.forEach((s, i) => {
        s.classList.remove("active", "done");
        if (i < current) s.classList.add("done");
        if (i === current) s.classList.add("active");
      });
      panes.forEach((p, i) => p.classList.toggle("active", i === current));

      prevBtns.forEach((b) => (b.style.visibility = current === 0 ? "hidden" : "visible"));
      nextBtns.forEach((b) => (b.style.display = current === panes.length - 1 ? "none" : "inline-flex"));
    }

    nextBtns.forEach((btn) =>
      btn.addEventListener("click", () => {
        if (current < panes.length - 1) {
          current++;
          renderStep();
        }
      })
    );
    prevBtns.forEach((btn) =>
      btn.addEventListener("click", () => {
        if (current > 0) {
          current--;
          renderStep();
        }
      })
    );
    steps.forEach((step, i) => {
      step.addEventListener("click", () => {
        if (i <= current) {
          current = i;
          renderStep();
        }
      });
    });

    renderStep();
  }

  // Drag & drop upload visual feedback (cosmetic only, no real upload)
  document.querySelectorAll(".upload-drop").forEach((drop) => {
    const input = drop.querySelector("input[type=file]");
    drop.addEventListener("click", () => input && input.click());
    ["dragover", "dragleave", "drop"].forEach((evt) => {
      drop.addEventListener(evt, (e) => {
        e.preventDefault();
        drop.classList.toggle("is-dragover", evt === "dragover");
      });
    });
  });

  // Color swatch <-> text input sync (branding page)
  document.querySelectorAll("[data-color-pair]").forEach((wrap) => {
    const swatch = wrap.querySelector(".color-swatch-input");
    const text = wrap.querySelector(".color-text-input");
    if (swatch && text) {
      swatch.addEventListener("input", () => (text.value = swatch.value));
      text.addEventListener("input", () => {
        if (/^#[0-9A-Fa-f]{6}$/.test(text.value)) swatch.value = text.value;
      });
    }
  });
});
