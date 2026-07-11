//============================================================//
// DIRECT BROWSER-TO-DRIVE UPLOAD — page connector            //
//                                                            //
// Dormant unless <body data-direct-upload="true">.           //
//                                                            //
// The heavy lifting runs in a SharedWorker (upload-worker.js) //
// so the transfer survives navigating around the admin area  //
// and page reloads — only closing the LAST tab/window stops   //
// it. This file is the thin page side:                       //
//   • on the activity form, hands the batch to the worker     //
//   • on any admin page, renders progress from worker state   //
//   • warns on genuine unload (close/reload/external nav),     //
//     but not when the admin clicks an internal admin link.   //
//                                                            //
// If SharedWorker is unavailable, it falls back to the        //
// original in-page upload (progress card + unload warning).   //
//============================================================//
(function () {
  "use strict";

  if (document.body.dataset.directUpload !== "true") return;

  var FILE_KINDS = { cover: "cover", gallery: "gallery", documents: "document" };
  var form = document.querySelector("#activityWizard form");

  //==========================================================//
  // SHARED HELPERS                                           //
  //==========================================================//
  function collectFiles() {
    var out = [];
    if (!form) return out;
    Object.keys(FILE_KINDS).forEach(function (inputName) {
      var input = form.querySelector('input[type=file][name="' + inputName + '"]');
      if (input && input.files) {
        Array.prototype.forEach.call(input.files, function (file) {
          out.push({ kind: FILE_KINDS[inputName], file: file });
        });
      }
    });
    return out;
  }

  // Parse the target slug from an edit form action; null means "create".
  function editSlug() {
    if (!form) return null;
    var m = form.getAttribute("action").match(/\/admin\/activities\/([^/]+)\/edit/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  // Collect all non-file fields into the same shape activityService expects.
  function buildPayload(submitter) {
    var params = new URLSearchParams();
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.disabled) return;
      if (el.type === "file" || el.type === "submit" || el.type === "button") return;
      params.append(el.name, el.value);
    });
    if (submitter && submitter.name) params.append(submitter.name, submitter.value);
    var payload = {};
    params.forEach(function (v, k) {
      if (payload[k] === undefined) payload[k] = v;
      else if (Array.isArray(payload[k])) payload[k].push(v);
      else payload[k] = [payload[k], v];
    });
    return payload;
  }

  //==========================================================//
  // PROGRESS UI — minimizable card <-> floating pill          //
  // startCollapsed=true renders the pill only (used when      //
  // arriving on a page while an upload is already running).   //
  //==========================================================//
  function overlay(startCollapsed) {
    var existing = document.getElementById("duRoot");
    if (existing) existing.remove();

    var root = document.createElement("div");
    root.id = "duRoot";

    var backdrop = document.createElement("div");
    backdrop.id = "duBackdrop";
    backdrop.style.cssText =
      "position:fixed;inset:0;z-index:3990;background:rgba(20,24,40,.55);" +
      "backdrop-filter:blur(4px);transition:opacity .2s ease;";

    var card = document.createElement("div");
    card.id = "duCard";
    card.style.cssText =
      "position:fixed;z-index:4000;top:50%;left:50%;transform:translate(-50%,-50%);" +
      "width:min(420px,90vw);background:#eef1f7;border-radius:20px;padding:26px 26px 30px;" +
      "box-shadow:9px 9px 18px #c8ccd6,-9px -9px 18px #ffffff;text-align:center;" +
      "font-family:inherit;color:#1f2540;";
    card.innerHTML =
      '<button type="button" id="duMin" aria-label="Minimize" ' +
      'style="position:absolute;top:14px;right:14px;width:30px;height:30px;border:none;' +
      'border-radius:9px;background:#eef1f7;color:#3155E7;font-size:18px;line-height:1;' +
      'cursor:pointer;box-shadow:3px 3px 6px #c8ccd6,-3px -3px 6px #ffffff;">&#8211;</button>' +
      '<div id="duTitle" style="font-size:17px;font-weight:700;margin-bottom:16px;">Uploading&#8230;</div>' +
      '<div style="background:#e2e6ef;border-radius:99px;height:12px;overflow:hidden;' +
      'box-shadow:inset 2px 2px 4px #c8ccd6,inset -2px -2px 4px #ffffff;">' +
      '<div id="duBar" style="height:100%;width:0;border-radius:99px;background:#3155E7;' +
      'transition:width .2s ease;"></div></div>' +
      '<div id="duSub" style="margin-top:14px;font-size:13px;color:#5b6480;word-break:break-all;">&nbsp;</div>';

    var pill = document.createElement("button");
    pill.type = "button";
    pill.id = "duPill";
    pill.setAttribute("aria-label", "Show upload progress");
    pill.style.cssText =
      "position:fixed;z-index:4000;right:22px;bottom:22px;display:none;align-items:center;" +
      "gap:12px;padding:12px 18px;border:none;border-radius:16px;background:#eef1f7;" +
      "color:#1f2540;font-family:inherit;font-size:13px;font-weight:600;cursor:pointer;" +
      "box-shadow:6px 6px 14px #c8ccd6,-6px -6px 14px #ffffff;";
    pill.innerHTML =
      '<span style="position:relative;width:34px;height:34px;flex:0 0 auto;">' +
      '<svg width="34" height="34" viewBox="0 0 34 34" style="transform:rotate(-90deg);">' +
      '<circle cx="17" cy="17" r="14" fill="none" stroke="#d7dbe6" stroke-width="4"></circle>' +
      '<circle id="duRing" cx="17" cy="17" r="14" fill="none" stroke="#3155E7" ' +
      'stroke-width="4" stroke-linecap="round" stroke-dasharray="88" stroke-dashoffset="88" ' +
      'style="transition:stroke-dashoffset .2s ease;"></circle></svg></span>' +
      '<span id="duPillText" style="text-align:left;line-height:1.3;">Uploading&#8230;</span>';

    root.appendChild(backdrop);
    root.appendChild(card);
    root.appendChild(pill);
    document.body.appendChild(root);

    var RING = 88; // 2 * PI * r (r=14), matches stroke-dasharray above.

    function expand() {
      card.style.display = "block";
      backdrop.style.display = "block";
      pill.style.display = "none";
    }
    function collapse() {
      card.style.display = "none";
      backdrop.style.display = "none";
      pill.style.display = "flex";
    }

    card.querySelector("#duMin").addEventListener("click", collapse);
    pill.addEventListener("click", expand);

    if (startCollapsed) collapse();
    else expand();

    return {
      set: function (pct, label) {
        var bar = card.querySelector("#duBar");
        var sub = card.querySelector("#duSub");
        var ring = pill.querySelector("#duRing");
        if (typeof pct === "number") {
          if (bar) bar.style.width = pct + "%";
          if (ring) ring.setAttribute("stroke-dashoffset", String(RING - (RING * pct) / 100));
        }
        if (sub && label) sub.textContent = label;
      },
      title: function (t) {
        var n = card.querySelector("#duTitle");
        var p = pill.querySelector("#duPillText");
        if (n) n.textContent = t;
        if (p) p.textContent = t;
      },
      done: function () { root.remove(); },
    };
  }

  //==========================================================//
  // FALLBACK — original in-page upload (no SharedWorker)       //
  // Bytes are pushed by this page, so it cannot survive the   //
  // page unloading; an unconditional unload warning guards it.//
  //==========================================================//
  function legacyInPage() {
    if (!form) return;
    var uploadActive = false;
    function beforeUnload(e) {
      if (!uploadActive) return undefined;
      e.preventDefault();
      e.returnValue = "Upload masih berjalan. Menutup atau memuat ulang halaman akan menghentikannya.";
      return e.returnValue;
    }
    function putToDrive(sessionUrl, file, onProgress) {
      return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open("PUT", sessionUrl, true);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        xhr.upload.onprogress = function (e) {
          if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = function () {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText)); } catch (_) { reject(new Error("Bad Drive response")); }
          } else { reject(new Error("Drive upload failed (" + xhr.status + ")")); }
        };
        xhr.onerror = function () { reject(new Error("Network error during upload")); };
        xhr.send(file);
      });
    }
    function postJson(url, body) {
      return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, json: j }; }); });
    }
    form.addEventListener("submit", function (e) {
      var files = collectFiles();
      if (!files.length) return;
      e.preventDefault();
      var ui = overlay(false);
      uploadActive = true;
      window.addEventListener("beforeunload", beforeUnload);
      (async function () {
        try {
          ui.title("Saving activity\u2026");
          var slug = editSlug();
          var payload = buildPayload(e.submitter || null);
          var save = slug
            ? await fetch("/api/admin/activities/" + encodeURIComponent(slug), {
                method: "PUT",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify(payload),
              }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, json: j }; }); })
            : await postJson("/api/admin/activities", payload);
          if (!save.ok) throw new Error((save.json && save.json.message) || "Could not save the activity");
          slug = slug || (save.json && save.json.data && save.json.data.id);
          if (!slug) throw new Error("Missing activity reference after save");
          for (var i = 0; i < files.length; i++) {
            var item = files[i];
            ui.title("Uploading " + (i + 1) + " of " + files.length);
            ui.set(0, item.file.name);
            var init = await postJson("/api/admin/activities/" + encodeURIComponent(slug) + "/uploads/init", {
              kind: item.kind, name: item.file.name, mimeType: item.file.type || "application/octet-stream",
            });
            if (!init.ok || !init.json.data || !init.json.data.sessionUrl) throw new Error("Could not start upload for " + item.file.name);
            var driveFile = await putToDrive(init.json.data.sessionUrl, item.file, function (pct) { ui.set(pct, item.file.name); });
            await postJson("/api/admin/activities/" + encodeURIComponent(slug) + "/uploads/complete", { kind: item.kind, driveId: driveFile.id });
          }
          ui.title("Done");
          uploadActive = false;
          window.removeEventListener("beforeunload", beforeUnload);
          window.location.href = "/admin";
        } catch (err) {
          uploadActive = false;
          window.removeEventListener("beforeunload", beforeUnload);
          ui.done();
          alert("Upload failed: " + err.message);
        }
      })();
    });
  }

  //==========================================================//
  // PRIMARY — SharedWorker-backed upload                      //
  //==========================================================//
  if (typeof SharedWorker === "undefined") {
    legacyInPage();
    return;
  }

  var worker;
  try {
    worker = new SharedWorker("/js/upload-worker.js");
  } catch (_) {
    legacyInPage();
    return;
  }
  var port = worker.port;

  var ui = null;
  var uploadActive = false; // is a transfer currently running (per worker state)
  var initiatedHere = false; // did THIS page kick off the current batch
  var allowUnload = false; // suppress the warning for intentional internal nav

  function ensureUI(collapsed) {
    if (!ui) ui = overlay(collapsed);
    return ui;
  }

  function applyState(s) {
    if (!s || !s.active) {
      uploadActive = false;
      if (ui) { ui.done(); ui = null; }
      return;
    }
    uploadActive = true;
    // Arriving on a page mid-upload: show the compact pill. The page that
    // started the batch keeps the expanded card it already opened.
    ensureUI(!initiatedHere);
    if (s.phase === "saving") {
      ui.title("Saving activity\u2026");
      ui.set(0, "");
    } else if (s.phase === "uploading") {
      ui.title("Uploading " + s.index + " of " + s.total);
      ui.set(s.pct || 0, s.name);
    }
  }

  port.onmessage = function (ev) {
    var msg = ev.data || {};
    if (msg.type === "state") {
      applyState(msg.state);
    } else if (msg.type === "progress") {
      if (ui) ui.set(msg.pct);
    } else if (msg.type === "done") {
      uploadActive = false;
      allowUnload = true;
      if (ui) { ui.title("Done"); }
      // Only the initiating page redirects; other pages just clear the pill
      // so the admin isn't yanked away from what they're doing.
      if (initiatedHere) {
        window.location.href = "/admin";
      } else if (ui) {
        setTimeout(function () { if (ui) { ui.done(); ui = null; } }, 1200);
      }
    } else if (msg.type === "error") {
      uploadActive = false;
      if (ui) { ui.done(); ui = null; }
      alert("Upload failed: " + msg.message);
    }
  };
  port.start();
  // Sync current state on load (also delivered automatically on connect).
  port.postMessage({ type: "status" });

  // Hand the batch off to the worker on submit.
  if (form) {
    form.addEventListener("submit", function (e) {
      var files = collectFiles();
      if (!files.length) return; // text-only submit proceeds normally
      e.preventDefault();
      var payload = buildPayload(e.submitter || null);
      var slug = editSlug();
      var out = files.map(function (it) {
        return {
          kind: it.kind,
          name: it.file.name,
          mimeType: it.file.type || "application/octet-stream",
          file: it.file,
        };
      });
      initiatedHere = true;
      uploadActive = true;
      ui = overlay(false); // expanded card on the page that starts it
      ui.title("Saving activity\u2026");
      port.postMessage({ type: "start", slug: slug, payload: payload, files: out });
    });
  }

  //==========================================================//
  // UNLOAD GUARD                                             //
  // Clicking an internal admin link is safe roaming (upload  //
  // keeps running in the worker), so we suppress the warning //
  // for it. Closing the tab/window, reloading, or leaving to //
  // an external URL still warns while an upload is active.   //
  //==========================================================//
  document.addEventListener(
    "click",
    function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a) return;
      if (a.target === "_blank" || a.hasAttribute("download")) return;
      var href = a.getAttribute("href") || "";
      var internal = href.charAt(0) === "/" && href.charAt(1) !== "/";
      var logout = /\/logout(\/|\?|#|$)/.test(href); // logout would break in-flight API calls
      if (internal && !logout) {
        allowUnload = true;
        setTimeout(function () { allowUnload = false; }, 4000);
      }
    },
    true
  );

  window.addEventListener("beforeunload", function (e) {
    if (!uploadActive || allowUnload) return undefined;
    e.preventDefault();
    e.returnValue =
      "Upload masih berjalan. Menutup jendela/tab ini akan menghentikan proses upload.";
    return e.returnValue;
  });
})();
