document.addEventListener("DOMContentLoaded", () => {
  // ===== Mobile sidebar toggle =====
  const burger = document.getElementById("sidebarBurger");
  const sidebar = document.getElementById("adminSidebar");
  if (burger && sidebar) {
    burger.addEventListener("click", () => sidebar.classList.toggle("show"));
    document.addEventListener("click", (e) => {
      if (sidebar.classList.contains("show") && !sidebar.contains(e.target) && !burger.contains(e.target)) {
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
    nextBtns.forEach((btn) => btn.addEventListener("click", () => { if (current < panes.length - 1) { current++; renderStep(); } }));
    prevBtns.forEach((btn) => btn.addEventListener("click", () => { if (current > 0) { current--; renderStep(); } }));
    steps.forEach((step, i) => step.addEventListener("click", () => { if (i <= current) { current = i; renderStep(); } }));
    renderStep();
  }

  // ===== File uploads: cover preview + selected-file chips =====
  function bytesLabel(n) {
    if (!n) return "0 KB";
    const u = ["B", "KB", "MB", "GB"];
    const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), u.length - 1);
    return (n / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + " " + u[i];
  }
  function esc(s) { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; }

  function onFiles(drop, input) {
    const kind = drop.getAttribute("data-upload");
    if (kind === "cover") {
      const f = input.files[0];
      if (!f) return;
      const wrap = document.getElementById("coverPreviewWrap");
      const img = document.getElementById("coverPreviewImg");
      if (img) img.src = URL.createObjectURL(f);
      if (wrap) wrap.style.display = "flex";
      return;
    }
    const chips = document.querySelector('[data-chips="' + kind + '"]');
    if (!chips) return;
    chips.innerHTML = "";
    Array.from(input.files).forEach((f) => {
      const isImg = f.type.startsWith("image/");
      const isVid = f.type.startsWith("video/");
      const icon = isImg ? "bi-image" : isVid ? "bi-camera-reels" : "bi-file-earmark-text";
      const row = document.createElement("div");
      row.className = "file-progress-row";
      row.innerHTML = '<i class="bi ' + icon + ' text-primary"></i><div class="flex-grow-1"><div class="small fw-semibold text-truncate">' + esc(f.name) + '</div></div><span class="tiny">' + bytesLabel(f.size) + '</span>';
      chips.appendChild(row);
    });
  }

  document.querySelectorAll(".upload-drop").forEach((drop) => {
    const input = drop.querySelector("input[type=file]");
    if (!input) return; // link-style dropzones (e.g. dashboard quick upload)
    drop.addEventListener("click", () => input.click());
    ["dragover", "dragleave", "drop"].forEach((evt) => drop.addEventListener(evt, (e) => {
      e.preventDefault();
      drop.style.borderColor = evt === "dragover" ? "#3155E7" : "";
    }));
    drop.addEventListener("drop", (e) => {
      if (e.dataTransfer && e.dataTransfer.files.length) {
        input.files = e.dataTransfer.files;
        input.dispatchEvent(new Event("change"));
      }
    });
    input.addEventListener("change", () => onFiles(drop, input));
  });

  // ===== Dynamic committee rows =====
  function committeeRow(name, role) {
    return '<div class="committee-row" data-row>' +
      '<div class="d-flex align-items-center gap-2">' +
      '<span class="committee-avatar d-inline-flex align-items-center justify-content-center" style="background:var(--odoc-primary);color:#fff;font-weight:700;">' + esc((name || "?").charAt(0).toUpperCase()) + '</span>' +
      '<div><div class="fw-semibold small">' + esc(name) + '</div><div class="text-muted tiny">' + esc(role) + '</div></div></div>' +
      '<i class="bi bi-x text-muted" data-remove-row style="cursor:pointer;"></i>' +
      '<input type="hidden" name="committeeName" value="' + esc(name) + '">' +
      '<input type="hidden" name="committeeRole" value="' + esc(role) + '"></div>';
  }
  const addCommittee = document.getElementById("addCommitteeBtn");
  if (addCommittee) {
    addCommittee.addEventListener("click", () => {
      const n = document.getElementById("committeeNameInput");
      const r = document.getElementById("committeeRoleInput");
      const name = (n.value || "").trim();
      if (!name) { n.focus(); return; }
      const role = (r.value || "").trim() || "Member";
      document.getElementById("committeeList").insertAdjacentHTML("beforeend", committeeRow(name, role));
      n.value = ""; r.value = ""; n.focus();
    });
  }

  // ===== Dynamic milestone rows =====
  function milestoneRow(title, date) {
    return '<div class="committee-row" data-row>' +
      '<div class="d-flex align-items-center gap-2">' +
      '<span class="committee-avatar d-inline-flex align-items-center justify-content-center" style="background:#E9EEFC;color:var(--odoc-primary);"><i class="bi bi-flag"></i></span>' +
      '<div><div class="fw-semibold small">' + esc(title) + '</div><div class="text-muted tiny">' + esc(date) + '</div></div></div>' +
      '<i class="bi bi-x text-muted" data-remove-row style="cursor:pointer;"></i>' +
      '<input type="hidden" name="milestoneTitle" value="' + esc(title) + '">' +
      '<input type="hidden" name="milestoneDate" value="' + esc(date) + '"></div>';
  }
  const addMilestone = document.getElementById("addMilestoneBtn");
  if (addMilestone) {
    addMilestone.addEventListener("click", () => {
      const t = document.getElementById("milestoneTitleInput");
      const d = document.getElementById("milestoneDateInput");
      const title = (t.value || "").trim();
      if (!title) { t.focus(); return; }
      document.getElementById("milestoneList").insertAdjacentHTML("beforeend", milestoneRow(title, (d.value || "").trim()));
      t.value = ""; d.value = ""; t.focus();
    });
  }

  // Remove any dynamic row (committee or milestone)
  document.addEventListener("click", (e) => {
    const x = e.target.closest("[data-remove-row]");
    if (x) { const row = x.closest("[data-row]"); if (row) row.remove(); }
  });

  // ===== Color swatch <-> text sync (branding page) =====
  document.querySelectorAll("[data-color-pair]").forEach((wrap) => {
    const swatch = wrap.querySelector(".color-swatch-input");
    const text = wrap.querySelector(".color-text-input");
    if (swatch && text) {
      swatch.addEventListener("input", () => (text.value = swatch.value));
      text.addEventListener("input", () => { if (/^#[0-9A-Fa-f]{6}$/.test(text.value)) swatch.value = text.value; });
    }
  });
});
