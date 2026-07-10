/*==============================================================*/
/*  DASHBOARD                                                   */
/*  Poll /api/admin/upload-jobs and render the progress panel   */
/*==============================================================*/
(function () {
  "use strict";

  var panel = document.getElementById("uploadProgress");
  if (!panel) return;

  var list = document.getElementById("uploadProgressList");
  var countBadge = document.getElementById("uploadProgressCount");

  // Escape user-supplied text before inserting as HTML.
  function esc(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : s;
    return d.innerHTML;
  }

  function stateChip(job) {
    if (job.status === "uploading")
      return '<span class="up-state uploading"><span class="up-spin"></span> Uploading ' + job.done + "/" + job.total + "</span>";
    if (job.status === "done")
      return '<span class="up-state done"><i class="bi bi-check-circle-fill"></i> Completed</span>';
    if (job.status === "partial")
      return '<span class="up-state partial"><i class="bi bi-exclamation-triangle-fill"></i> ' + job.failed + " failed</span>";
    return '<span class="up-state error"><i class="bi bi-x-octagon-fill"></i> Failed</span>';
  }

  function render(jobs) {
    if (!jobs.length) {
      panel.style.display = "none";
      return;
    }
    panel.style.display = "";
    var activeCount = jobs.filter(function (j) { return j.status === "uploading"; }).length;
    countBadge.textContent = activeCount ? activeCount + " in progress" : "Done";
    list.innerHTML = jobs
      .map(function (j) {
        var sub =
          j.status === "uploading" && j.current
            ? "Current: " + esc(j.current)
            : j.total + " file" + (j.total > 1 ? "s" : "");
        return (
          '<div class="up-item">' +
          '<div class="up-top">' +
          '<div><div class="up-name">' + esc(j.title) + '</div><div class="up-sub">' + sub + "</div></div>" +
          stateChip(j) +
          "</div>" +
          '<div class="progress-odoc"><div class="bar" style="width:' + j.percent + '%"></div></div>' +
          "</div>"
        );
      })
      .join("");
  }

  // Poll faster while uploads are active, slower once idle.
  var timer = null;
  async function poll() {
    try {
      var r = await fetch("/api/admin/upload-jobs", { headers: { Accept: "application/json" } });
      var j = await r.json();
      var jobs = (j && j.data) || [];
      render(jobs);
      var active = jobs.some(function (x) { return x.status === "uploading"; });
      clearTimeout(timer);
      timer = setTimeout(poll, jobs.length ? (active ? 1500 : 5000) : 8000);
    } catch (e) {
      clearTimeout(timer);
      timer = setTimeout(poll, 8000);
    }
  }
  poll();
})();
