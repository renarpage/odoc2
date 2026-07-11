//============================================================//
// DIRECT BROWSER-TO-DRIVE UPLOAD (progressive enhancement) //
//                                                            //
// Dormant unless <body data-direct-upload="true">. When      //
// active, it intercepts the activity form:                   //
//   1. create/update the activity via the JSON API (text)    //
//   2. upload each file straight to Drive (resumable session) //
//   3. attach the file's metadata to the activity            //
//                                                            //
// The progress feedback is a MINIMIZABLE card: the admin can //
// collapse it to a floating pill and keep working while the  //
// upload runs. Because the bytes are pushed by the browser   //
// (xhr.send), the upload CANNOT survive the tab/window being //
// closed — so a beforeunload warning guards against it.      //
//============================================================//
(function () {
  "use strict";

  if (document.body.dataset.directUpload !== "true") return;

  var form = document.querySelector("#activityWizard form");
  if (!form) return;

  var FILE_KINDS = { cover: "cover", gallery: "gallery", documents: "document" };

  //==========================================================//
  // UNLOAD GUARD                                             //
  // While an upload is in flight, warn the user that closing //
  // the tab/window will abort it (browser shows its own      //
  // generic confirm dialog; custom text is ignored by spec). //
  //==========================================================//
  var uploadActive = false;

  function beforeUnload(e) {
    if (!uploadActive) return undefined;
    e.preventDefault();
    // Most browsers ignore the custom string and show a generic prompt,
    // but returnValue must be set for the dialog to appear.
    e.returnValue =
      "Upload masih berjalan. Jika Anda menutup atau memuat ulang halaman, " +
      "proses upload akan berhenti dan file yang belum selesai tidak tersimpan.";
    return e.returnValue;
  }

  function armUnloadGuard() {
    uploadActive = true;
    window.addEventListener("beforeunload", beforeUnload);
  }

  function disarmUnloadGuard() {
    uploadActive = false;
    window.removeEventListener("beforeunload", beforeUnload);
  }

  // Collect all non-file fields into URL-encoded params (same names the
  // server-rendered form uses, so activityService parses them identically).
  function textParams(submitter) {
    var params = new URLSearchParams();
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.disabled) return;
      if (el.type === "file" || el.type === "submit" || el.type === "button") return;
      params.append(el.name, el.value);
    });
    if (submitter && submitter.name) params.append(submitter.name, submitter.value);
    return params;
  }

  // Parse the target slug from an edit form action; null means "create".
  function editSlug() {
    var m = form.getAttribute("action").match(/\/admin\/activities\/([^/]+)\/edit/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function collectFiles() {
    var out = [];
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

  // PUT one file's bytes straight to the Drive resumable session URL.
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
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (_) {
            reject(new Error("Bad Drive response"));
          }
        } else {
          reject(new Error("Drive upload failed (" + xhr.status + ")"));
        }
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

  //==========================================================//
  // PROGRESS UI                                              //
  // A minimizable card. Collapsed, it becomes a floating     //
  // pill (bottom-right) that stays visible on the dashboard  //
  // so the admin always knows an upload is running.          //
  //==========================================================//
  function overlay() {
    var root = document.createElement("div");
    root.id = "duRoot";

    // Dimmed backdrop shown only when the card is expanded.
    var backdrop = document.createElement("div");
    backdrop.id = "duBackdrop";
    backdrop.style.cssText =
      "position:fixed;inset:0;z-index:3990;background:rgba(20,24,40,.55);" +
      "backdrop-filter:blur(4px);transition:opacity .2s ease;";

    // Expanded card.
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

    // Collapsed floating pill.
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

    return {
      set: function (pct, label) {
        var bar = card.querySelector("#duBar");
        var sub = card.querySelector("#duSub");
        var ring = pill.querySelector("#duRing");
        if (bar) bar.style.width = pct + "%";
        if (sub && label) sub.textContent = label;
        if (ring) ring.setAttribute("stroke-dashoffset", String(RING - (RING * pct) / 100));
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

  form.addEventListener("submit", function (e) {
    var files = collectFiles();
    // No files: let the normal (text-only) submit proceed untouched.
    if (!files.length) return;

    e.preventDefault();
    var submitter = e.submitter || null;
    var ui = overlay();
    armUnloadGuard();

    (async function () {
      try {
        // 1. Create or update the activity (text fields only) to get its slug.
        ui.title("Saving activity\u2026");
        var slug = editSlug();
        var params = textParams(submitter);
        var payload = {};
        params.forEach(function (v, k) {
          if (payload[k] === undefined) payload[k] = v;
          else if (Array.isArray(payload[k])) payload[k].push(v);
          else payload[k] = [payload[k], v];
        });

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

        // 2. Upload each file straight to Drive, then attach its metadata.
        for (var i = 0; i < files.length; i++) {
          var item = files[i];
          ui.title("Uploading " + (i + 1) + " of " + files.length);
          ui.set(0, item.file.name);

          var init = await postJson("/api/admin/activities/" + encodeURIComponent(slug) + "/uploads/init", {
            kind: item.kind,
            name: item.file.name,
            mimeType: item.file.type || "application/octet-stream",
          });
          if (!init.ok || !init.json.data || !init.json.data.sessionUrl) {
            throw new Error("Could not start upload for " + item.file.name);
          }

          var driveFile = await putToDrive(init.json.data.sessionUrl, item.file, function (pct) {
            ui.set(pct, item.file.name);
          });

          await postJson("/api/admin/activities/" + encodeURIComponent(slug) + "/uploads/complete", {
            kind: item.kind,
            driveId: driveFile.id,
          });
        }

        ui.title("Done");
        // Upload finished: release the guard before navigating away so the
        // redirect doesn't trip the beforeunload warning.
        disarmUnloadGuard();
        window.location.href = "/admin";
      } catch (err) {
        disarmUnloadGuard();
        ui.done();
        alert("Upload failed: " + err.message);
      }
    })();
  });
})();
