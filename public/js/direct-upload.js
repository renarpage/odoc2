//============================================================//
// DIRECT BROWSER-TO-DRIVE UPLOAD (progressive enhancement)   //
//                                                            //
// Dormant unless <body data-direct-upload="true"> (set on     //
// serverless). When active, it intercepts the activity form:  //
//   1. create/update the activity via the JSON API (text only)//
//   2. upload each file straight to Drive (resumable session) //
//   3. attach the file's metadata to the activity            //
// When dormant, the form submits normally as multipart and    //
// nothing here runs — identical to the original behavior.     //
//============================================================//
(function () {
  "use strict";

  if (document.body.dataset.directUpload !== "true") return;

  var form = document.querySelector("#activityWizard form");
  if (!form) return;

  var FILE_KINDS = { cover: "cover", gallery: "gallery", documents: "document" };

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

  // Simple full-screen progress overlay so the admin sees what's happening.
  function overlay() {
    var el = document.createElement("div");
    el.style.cssText =
      "position:fixed;inset:0;z-index:4000;background:rgba(20,24,40,.55);" +
      "backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;";
    el.innerHTML =
      '<div style="background:var(--odoc-bg,#f4f6fb);border-radius:16px;padding:28px 32px;min-width:280px;text-align:center;box-shadow:8px 8px 24px rgba(30,42,90,.35)">' +
      '<div style="font-weight:700;margin-bottom:12px" id="duTitle">Uploading\u2026</div>' +
      '<div class="progress-odoc" style="height:8px"><div class="bar" id="duBar" style="width:0%"></div></div>' +
      '<div class="text-muted" style="font-size:.82rem;margin-top:10px" id="duSub"></div></div>';
    document.body.appendChild(el);
    return {
      set: function (pct, label) {
        var bar = el.querySelector("#duBar");
        var sub = el.querySelector("#duSub");
        if (bar) bar.style.width = pct + "%";
        if (sub && label) sub.textContent = label;
      },
      title: function (t) { var n = el.querySelector("#duTitle"); if (n) n.textContent = t; },
      done: function () { el.remove(); },
    };
  }

  form.addEventListener("submit", function (e) {
    var files = collectFiles();
    // No files: let the normal (text-only) submit proceed untouched.
    if (!files.length) return;

    e.preventDefault();
    var submitter = e.submitter || null;
    var ui = overlay();

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
        window.location.href = "/admin";
      } catch (err) {
        ui.done();
        alert("Upload failed: " + err.message);
      }
    })();
  });
})();
