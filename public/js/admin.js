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

  const esc = (s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : s; return d.innerHTML; };
  function bytesLabel(n) {
    if (!n) return "0 KB";
    const u = ["B", "KB", "MB", "GB"];
    const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), u.length - 1);
    return (n / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + " " + u[i];
  }
  function friendlyDate(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return iso;
    return d.toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" });
  }

  // Allowed upload extensions (kept in sync with constants/index.js server-side).
  var ALLOWED_EXT = [
    "jpg", "jpeg", "png", "webp", "gif", "bmp", "svg", "heic", "heif",
    "mp4", "webm", "mov", "mkv", "avi",
    "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "rtf", "odt", "ods", "odp",
    "zip", "rar", "7z",
  ];
  var MAX_BYTES = 50 * 1024 * 1024;
  function extOf(name) { var m = String(name || "").toLowerCase().match(/\.([a-z0-9]+)$/); return m ? m[1] : ""; }
  function isAllowed(file) { return ALLOWED_EXT.indexOf(extOf(file.name)) !== -1; }

  //==========================================================//
  // DELEGATED BEHAVIORS (replace inline on* handlers)        //
  // Keeps the CSP clean: no `script-src-attr` inline handlers //
  // in the EJS. Views opt in via data-* hooks.               //
  //==========================================================//

  // Auto-submit a form when a marked <select> changes.
  document.querySelectorAll("select[data-autosubmit]").forEach((sel) => {
    sel.addEventListener("change", () => { if (sel.form) sel.form.submit(); });
  });

  // Confirm before submitting a form carrying data-confirm="message".
  document.addEventListener(
    "submit",
    (e) => {
      const f = e.target;
      if (f && f.matches && f.matches("[data-confirm]")) {
        if (!window.confirm(f.getAttribute("data-confirm"))) e.preventDefault();
      }
    },
    true
  );

  // Image fallbacks. data-img-fallback="sibling" hides the broken image and
  // reveals the next placeholder; "hide-wrap" hides the closest preview wrap.
  document.querySelectorAll("img[data-img-fallback]").forEach((img) => {
    img.addEventListener("error", function () {
      const mode = img.getAttribute("data-img-fallback");
      if (mode === "sibling") {
        img.style.display = "none";
        if (img.nextElementSibling) img.nextElementSibling.style.display = "inline-flex";
      } else if (mode === "hide-wrap") {
        const wrap = img.closest("#coverPreviewWrap");
        if (wrap) wrap.style.display = "none";
      }
    });
  });

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

  // ===== File fields with per-file unattach + instant validation =====
  document.querySelectorAll(".upload-drop").forEach((drop) => {
    const input = drop.querySelector("input[type=file]");
    if (!input) return; // link-style dropzones (dashboard quick upload)
    const kind = drop.getAttribute("data-upload");
    const multiple = input.multiple;
    const chips = kind ? document.querySelector('[data-chips="' + kind + '"]') : null;
    let store = [];

    // Inline error banner sits right after the dropzone.
    let errBox = drop.parentNode.querySelector('[data-upload-error="' + kind + '"]');
    if (!errBox) {
      errBox = document.createElement("div");
      errBox.setAttribute("data-upload-error", kind || "");
      errBox.className = "alert alert-danger py-2 px-3 mt-2 mb-0 upload-error-box d-none";
      drop.insertAdjacentElement("afterend", errBox);
    }
    function showError(msg) {
      errBox.innerHTML = '<i class="bi bi-exclamation-triangle me-2"></i>' + esc(msg);
      errBox.classList.remove("d-none");
    }
    function clearError() { errBox.classList.add("d-none"); errBox.textContent = ""; }

    // Split incoming files into accepted vs rejected, warn immediately.
    function accept(files) {
      var okList = [], bad = [], tooBig = [];
      files.forEach(function (f) {
        if (!isAllowed(f)) { bad.push(f.name); return; }
        if (f.size > MAX_BYTES) { tooBig.push(f.name); return; }
        okList.push(f);
      });
      var msgs = [];
      if (bad.length) msgs.push("Unsupported file" + (bad.length > 1 ? "s" : "") + ": " + bad.join(", ") + ". Allowed: images, video, PDF, Office docs, TXT/CSV, ZIP/RAR/7z.");
      if (tooBig.length) msgs.push("Too large (max 50MB): " + tooBig.join(", ") + ".");
      if (msgs.length) showError(msgs.join(" ")); else clearError();
      return okList;
    }

    function commit() {
      const dt = new DataTransfer();
      store.forEach((f) => dt.items.add(f));
      input.files = dt.files;
      render();
    }
    function render() {
      if (kind === "cover") {
        const wrap = document.getElementById("coverPreviewWrap");
        const img = document.getElementById("coverPreviewImg");
        if (store[0]) {
          if (img) img.src = URL.createObjectURL(store[0]);
          if (wrap) wrap.style.display = "flex";
        } else if (wrap) {
          wrap.style.display = "none";
        }
        return;
      }
      if (!chips) return;
      chips.innerHTML = "";
      store.forEach((f, idx) => {
        const isImg = f.type.startsWith("image/");
        const isVid = f.type.startsWith("video/");
        const icon = isImg ? "bi-image" : isVid ? "bi-camera-reels" : "bi-file-earmark-text";
        const row = document.createElement("div");
        row.className = "file-progress-row";
        row.innerHTML =
          '<i class="bi ' + icon + ' text-primary"></i>' +
          '<div class="flex-grow-1"><div class="small fw-semibold text-truncate">' + esc(f.name) + '</div></div>' +
          '<span class="tiny text-muted me-2">' + bytesLabel(f.size) + '</span>' +
          '<button type="button" class="icon-btn text-danger icon-btn--30" data-remove-file="' + idx + '" title="Remove"><i class="bi bi-x-lg"></i></button>';
        chips.appendChild(row);
      });
    }

    drop.addEventListener("click", (e) => { if (!e.target.closest("[data-remove-file]")) input.click(); });
    ["dragover", "dragleave", "drop"].forEach((evt) => drop.addEventListener(evt, (e) => {
      e.preventDefault();
      drop.style.borderColor = evt === "dragover" ? "var(--odoc-primary)" : "";
    }));
    drop.addEventListener("drop", (e) => {
      if (e.dataTransfer && e.dataTransfer.files.length) {
        const dropped = accept(Array.from(e.dataTransfer.files));
        store = multiple ? store.concat(dropped) : (dropped[0] ? [dropped[0]] : store);
        commit();
      }
    });
    input.addEventListener("change", () => {
      const picked = accept(Array.from(input.files));
      store = multiple ? store.concat(picked) : (picked[0] ? [picked[0]] : []);
      commit();
    });
    if (chips) {
      chips.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-remove-file]");
        if (!btn) return;
        store.splice(parseInt(btn.getAttribute("data-remove-file"), 10), 1);
        commit();
      });
    }
    const clearCover = document.querySelector("[data-clear-cover]");
    if (kind === "cover" && clearCover) {
      clearCover.addEventListener("click", () => { store = []; clearError(); commit(); });
    }
  });

  // ===== Dynamic committee rows =====
  function memberRow(name, role) {
    return '<div class="committee-row" data-row>' +
      '<div class="d-flex align-items-center gap-3">' +
      '<span class="member-avatar">' + esc((name || "?").charAt(0).toUpperCase()) + '</span>' +
      '<div><div class="fw-semibold small">' + esc(name) + '</div><div class="text-muted tiny">' + esc(role) + '</div></div></div>' +
      '<button type="button" class="icon-btn text-danger icon-btn--xs" data-remove-row title="Remove"><i class="bi bi-x-lg"></i></button>' +
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
      document.getElementById("committeeList").insertAdjacentHTML("beforeend", memberRow(name, role));
      const empty = document.getElementById("committeeEmpty"); if (empty) empty.style.display = "none";
      n.value = ""; r.value = ""; n.focus();
    });
  }

  // ===== Dynamic milestone rows (date picker -> friendly label) =====
  function milestoneRow(title, isoDate) {
    const label = friendlyDate(isoDate);
    return '<div class="committee-row" data-row>' +
      '<div class="d-flex align-items-center gap-3">' +
      '<span class="member-avatar member-avatar--flag"><i class="bi bi-flag"></i></span>' +
      '<div><div class="fw-semibold small">' + esc(title) + '</div><div class="text-muted tiny">' + esc(label) + '</div></div></div>' +
      '<button type="button" class="icon-btn text-danger icon-btn--xs" data-remove-row title="Remove"><i class="bi bi-x-lg"></i></button>' +
      '<input type="hidden" name="milestoneTitle" value="' + esc(title) + '">' +
      '<input type="hidden" name="milestoneDate" value="' + esc(label) + '"></div>';
  }
  const addMilestone = document.getElementById("addMilestoneBtn");
  if (addMilestone) {
    addMilestone.addEventListener("click", () => {
      const t = document.getElementById("milestoneTitleInput");
      const d = document.getElementById("milestoneDateInput");
      const title = (t.value || "").trim();
      if (!title) { t.focus(); return; }
      document.getElementById("milestoneList").insertAdjacentHTML("beforeend", milestoneRow(title, d.value));
      const empty = document.getElementById("milestoneEmpty"); if (empty) empty.style.display = "none";
      t.value = ""; d.value = ""; t.focus();
    });
  }

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

  // ===== Notification bell (fetches recent system logs) =====
  const bell = document.getElementById("notifBell");
  const notifList = document.getElementById("notifList");
  const notifDot = document.getElementById("notifDot");
  if (bell && notifList) {
    let loaded = false;
    const iconFor = (t) =>
      t === "warning" ? "bi-exclamation-triangle"
      : t === "error" ? "bi-x-octagon"
      : t === "user" ? "bi-person-plus"
      : t === "success" ? "bi-check-circle"
      : "bi-info-circle";
    const timeAgo = (iso) => {
      if (!iso) return "";
      const s = Math.floor((Date.now() - new Date(iso)) / 1000);
      if (s < 60) return "just now";
      const m = Math.floor(s / 60); if (m < 60) return m + "m ago";
      const h = Math.floor(m / 60); if (h < 24) return h + "h ago";
      return Math.floor(h / 24) + "d ago";
    };
    async function load() {
      try {
        const r = await fetch("/api/admin/notifications", { headers: { Accept: "application/json" } });
        const j = await r.json();
        const items = (j && j.data) || [];
        if (!items.length) {
          notifList.innerHTML = '<div class="notif-empty"><i class="bi bi-bell-slash d-block mb-2 notif-empty-icon"></i>No notifications yet.</div>';
        } else {
          notifList.innerHTML = items.map((l) =>
            '<div class="notif-item"><span class="notif-ico ' + (l.type || "info") + '"><i class="bi ' + iconFor(l.type) + '"></i></span>' +
            '<div class="flex-grow-1"><div class="fw-semibold small">' + esc(l.title) + '</div>' +
            '<div class="text-muted tiny">' + esc(l.detail || "") + '</div>' +
            '<div class="text-muted tiny mt-1">' + timeAgo(l.createdAt) + '</div></div></div>'
          ).join("");
        }
        if (notifDot) notifDot.style.display = "none";
        loaded = true;
      } catch (e) {
        notifList.innerHTML = '<div class="notif-empty">Could not load notifications.</div>';
      }
    }
    const dd = bell.closest(".dropdown");
    if (dd) dd.addEventListener("show.bs.dropdown", () => { if (!loaded) load(); });
    else bell.addEventListener("click", load);
  }
});
