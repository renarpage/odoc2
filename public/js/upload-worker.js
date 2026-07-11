//============================================================//
// SHARED WORKER — Direct browser-to-Drive upload engine      //
//                                                            //
// The upload pipeline lives here (outside any single page)   //
// so it survives full-page navigation and reloads inside the //
// admin area: as long as ANY admin tab is open, the transfer //
// keeps running. Each connected page (port) receives live    //
// state so the floating progress indicator is accurate       //
// everywhere the admin roams.                                //
//                                                            //
// Pipeline (unchanged from the in-page version):             //
//   1. create/update the activity via the JSON API           //
//   2. PUT each file straight to its Drive resumable session  //
//   3. attach the uploaded file's metadata to the activity    //
//============================================================//
"use strict";

var ports = [];

// Single source of truth for the current upload, mirrored to every page.
var state = {
  active: false,
  phase: "idle", // idle | saving | uploading | done | error
  index: 0, // 1-based file index currently uploading
  total: 0, // total files in the batch
  name: "", // current file name
  pct: 0, // current file progress (0..100)
  slug: null, // resolved activity slug
  error: null,
};

self.onconnect = function (e) {
  var port = e.ports[0];
  ports.push(port);
  port.start();
  port.onmessage = function (ev) {
    handle(ev.data || {}, port);
  };
  // Immediately hand the newcomer the current state so a freshly loaded
  // admin page can render the correct progress on arrival.
  send(port, { type: "state", state: state });
};

function send(port, msg) {
  try {
    port.postMessage(msg);
  } catch (_) {
    /* port gone */
  }
}

function broadcast(msg) {
  ports.forEach(function (p) {
    send(p, msg);
  });
}

function handle(msg, port) {
  if (msg.type === "status") {
    send(port, { type: "state", state: state });
    return;
  }
  if (msg.type === "start") {
    // Guard against double-start (e.g. a stray second submit).
    if (state.active) {
      send(port, { type: "state", state: state });
      return;
    }
    runPipeline(msg);
  }
}

// JSON API helper. Cookies ride along automatically (same-origin default),
// so the worker is authenticated exactly like the page.
function api(method, url, body) {
  return fetch(url, {
    method: method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  }).then(function (r) {
    return r
      .json()
      .catch(function () {
        return {};
      })
      .then(function (j) {
        return { ok: r.ok, json: j };
      });
  });
}

// PUT one file's bytes straight to the Drive resumable session URL.
// XHR (available in workers) is used for real upload progress events.
function putToDrive(sessionUrl, file, mimeType, onProgress) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", sessionUrl, true);
    xhr.setRequestHeader("Content-Type", mimeType || "application/octet-stream");
    xhr.upload.onprogress = function (ev) {
      if (ev.lengthComputable && onProgress) onProgress(Math.round((ev.loaded / ev.total) * 100));
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
    xhr.onerror = function () {
      reject(new Error("Network error during upload"));
    };
    xhr.send(file);
  });
}

function publish() {
  broadcast({ type: "state", state: state });
}

async function runPipeline(job) {
  state = {
    active: true,
    phase: "saving",
    index: 0,
    total: (job.files && job.files.length) || 0,
    name: "",
    pct: 0,
    slug: job.slug || null,
    error: null,
  };
  publish();

  try {
    // 1. Create or update the activity (text fields only) to resolve its slug.
    var slug = job.slug;
    var save = slug
      ? await api("PUT", "/api/admin/activities/" + encodeURIComponent(slug), job.payload)
      : await api("POST", "/api/admin/activities", job.payload);

    if (!save.ok) throw new Error((save.json && save.json.message) || "Could not save the activity");
    slug = slug || (save.json && save.json.data && save.json.data.id);
    if (!slug) throw new Error("Missing activity reference after save");
    state.slug = slug;
    publish();

    // 2. Upload each file straight to Drive, then attach its metadata.
    for (var i = 0; i < job.files.length; i++) {
      var item = job.files[i];
      state.phase = "uploading";
      state.index = i + 1;
      state.name = item.name;
      state.pct = 0;
      publish();

      var init = await api(
        "POST",
        "/api/admin/activities/" + encodeURIComponent(slug) + "/uploads/init",
        { kind: item.kind, name: item.name, mimeType: item.mimeType }
      );
      if (!init.ok || !init.json.data || !init.json.data.sessionUrl) {
        throw new Error("Could not start upload for " + item.name);
      }

      var driveFile = await putToDrive(init.json.data.sessionUrl, item.file, item.mimeType, function (pct) {
        state.pct = pct;
        broadcast({ type: "progress", pct: pct });
      });

      await api(
        "POST",
        "/api/admin/activities/" + encodeURIComponent(slug) + "/uploads/complete",
        { kind: item.kind, driveId: driveFile.id }
      );
    }

    state.phase = "done";
    state.active = false;
    state.pct = 100;
    publish();
    broadcast({ type: "done", slug: slug });
  } catch (err) {
    state.phase = "error";
    state.active = false;
    state.error = err.message;
    publish();
    broadcast({ type: "error", message: err.message });
  }
}
