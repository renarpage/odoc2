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

  // ===== File fields with per-file unattach =====
  document.querySelectorAll(".upload-drop").forEach((drop) => {
    const input = drop.querySelector("input[type=file]");
    if (!input) return;
    const kind = drop.getAttribute("data-upload");
    const multiple = input.multiple;
    const chips = kind ? document.querySelector('[data-chips="' + kind + '"]') : null;
    let store = [];

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
          '<button type="button" class="icon-btn text-danger" data-remove-file="' + idx + '" title="Remove" style="width:30px;height:30px;"><i class="bi bi-x-lg"></i></button>';
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
        const dropped = Array.from(e.dataTransfer.files);
        store = multiple ? store.concat(dropped) : [dropped[0]];
        commit();
      }
    });
    input.addEventListener("change", () => {
      const picked = Array.from(input.files);
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
      clearCover.addEventListener("click", () => { store = []; commit(); });
    }
  });

  // ===== Dynamic committee rows =====
  function memberRow(name, role) {
    return '<div class="committee-row" data-row>' +
      '<div class="d-flex align-items-center gap-3">' +
      '<span class="member-avatar">' + esc((name || "?").charAt(0).toUpperCase()) + '</span>' +
      '<div><div class="fw-semibold small">' + esc(name) + '</div><div class="text-muted tiny">' + esc(role) + '</div></div></div>' +
      '<button type="button" class="icon-btn text-danger" data-remove-row title="Remove" style="width:32px;height:32px;"><i class="bi bi-x-lg"></i></button>' +
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
      '<span class="member-avatar" style="background:#E9EEFC;color:var(--odoc-primary);"><i class="bi bi-flag"></i></span>' +
      '<div><div class="fw-semibold small">' + esc(title) + '</div><div class="text-muted tiny">' + esc(label) + '</div></div></div>' +
      '<button type="button" class="icon-btn text-danger" data-remove-row title="Remove" style="width:32px;height:32px;"><i class="bi bi-x-lg"></i></button>' +
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
          notifList.innerHTML = '<div class="notif-empty"><i class="bi bi-bell-slash d-block mb-2" style="font-size:1.4rem;"></i>No notifications yet.</div>';
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
