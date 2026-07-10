/**
 * Users page behavior.
 * Populates the Edit User modal from the clicked row's data-* attributes.
 */
(function () {
  "use strict";

  var editModal = document.getElementById("editUserModal");
  if (!editModal) return;

  editModal.addEventListener("show.bs.modal", function (event) {
    var trigger = event.relatedTarget;
    if (!trigger) return;

    var form = document.getElementById("editUserForm");
    form.action = "/admin/users/" + trigger.getAttribute("data-id") + "/update";
    document.getElementById("editName").value = trigger.getAttribute("data-name") || "";
    document.getElementById("editEmail").value = trigger.getAttribute("data-email") || "";
    document.getElementById("editRole").value = trigger.getAttribute("data-role") || "standard_admin";
  });
})();
