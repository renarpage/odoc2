/*==============================================================*/
/*  SYSTEM SETTINGS                                             */
/*  Maintenance-message toggle + SMTP connection test          */
/*==============================================================*/
(function () {
  "use strict";

  // Show/hide the maintenance message field with the toggle.
  var maintToggle = document.getElementById("maintenanceMode");
  var maintWrap = document.getElementById("maintenanceMessageWrap");
  if (maintToggle && maintWrap) {
    maintToggle.addEventListener("change", function () {
      maintWrap.style.display = this.checked ? "" : "none";
    });
  }

  // Verify SMTP connectivity without saving settings.
  var testBtn = document.getElementById("btnTestSmtp");
  var resultEl = document.getElementById("smtpTestResult");
  if (testBtn && resultEl) {
    testBtn.addEventListener("click", function () {
      resultEl.textContent = "Testing\u2026";
      resultEl.className = "ms-2 small text-muted";

      function val(name) {
        var el = document.querySelector("[name=" + name + "]");
        return el ? el.value : "";
      }

      fetch("/admin/settings/test-smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtpHost: val("smtpHost"),
          smtpPort: val("smtpPort"),
          smtpUser: val("smtpUser"),
          smtpPass: val("smtpPass"),
          systemEmail: val("systemEmail"),
        }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            resultEl.textContent = "Connection successful!";
            resultEl.className = "ms-2 small text-success";
          } else {
            resultEl.textContent = data.message || "Connection failed";
            resultEl.className = "ms-2 small text-danger";
          }
        })
        .catch(function () {
          resultEl.textContent = "Network error";
          resultEl.className = "ms-2 small text-danger";
        });
    });
  }
})();
