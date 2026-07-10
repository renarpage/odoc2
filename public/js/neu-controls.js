/**
 * Neumorphic control enhancers.
 * Native <select> option lists and the native date picker are rendered by the
 * OS/browser and cannot be themed with CSS. So we progressively enhance them:
 *   - <select class="form-select-odoc"> -> custom neumorphic dropdown
 *   - <input type="date" class="form-control-odoc"> -> flatpickr (neumorphic)
 * The underlying element is kept in the DOM so form submission and existing
 * change handlers (e.g. onchange="this.form.submit()") keep working.
 */
(function () {
  function closeAllSelects(except) {
    document.querySelectorAll(".neu-select.open").forEach(function (w) {
      if (w !== except) w.classList.remove("open");
    });
  }

  function enhanceSelect(sel) {
    if (sel.dataset.neu) return;
    sel.dataset.neu = "1";

    var wrap = document.createElement("div");
    wrap.className = "neu-select";
    if (sel.style.maxWidth) wrap.style.maxWidth = sel.style.maxWidth;
    if (sel.style.width) wrap.style.width = sel.style.width;
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    sel.classList.add("neu-native-hidden");

    var trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "neu-select-trigger form-control-odoc";
    var label = document.createElement("span");
    label.className = "neu-select-label";
    var caret = document.createElement("i");
    caret.className = "bi bi-chevron-down neu-select-caret";
    trigger.appendChild(label);
    trigger.appendChild(caret);
    wrap.appendChild(trigger);

    var menu = document.createElement("div");
    menu.className = "neu-select-menu";
    wrap.appendChild(menu);

    function syncLabel() {
      var o = sel.options[sel.selectedIndex];
      label.textContent = o ? o.textContent.trim() : "";
    }
    function build() {
      menu.innerHTML = "";
      Array.prototype.forEach.call(sel.options, function (opt, i) {
        var it = document.createElement("div");
        it.className = "neu-select-option" + (i === sel.selectedIndex ? " active" : "");
        it.textContent = opt.textContent.trim();
        it.addEventListener("click", function () {
          sel.selectedIndex = i;
          syncLabel();
          sel.dispatchEvent(new Event("change", { bubbles: true }));
          wrap.classList.remove("open");
        });
        menu.appendChild(it);
      });
    }
    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var willOpen = !wrap.classList.contains("open");
      closeAllSelects(wrap);
      if (willOpen) { build(); wrap.classList.add("open"); }
      else wrap.classList.remove("open");
    });
    sel.addEventListener("change", syncLabel);
    syncLabel();
  }

  function enhanceDates(root) {
    if (!window.flatpickr) return;
    root.querySelectorAll('input[type="date"].form-control-odoc').forEach(function (inp) {
      if (inp._flatpickr || inp.dataset.neu) return;
      inp.dataset.neu = "1";
      var val = inp.value;
      inp.type = "text"; // avoid the native picker layering on top
      inp.setAttribute("autocomplete", "off");
      window.flatpickr(inp, {
        dateFormat: "Y-m-d",
        allowInput: true,
        disableMobile: true,
        // Render month as plain text + arrows instead of a native <select>,
        // which cannot be themed and looked out of place.
        monthSelectorType: "static",
        defaultDate: val || null,
      });
    });
  }

  function run(root) {
    (root || document).querySelectorAll("select.form-select-odoc").forEach(enhanceSelect);
    enhanceDates(root || document);
  }

  document.addEventListener("click", function () { closeAllSelects(null); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeAllSelects(null); });
  document.addEventListener("DOMContentLoaded", function () { run(document); });
  window.NeuControls = { run: run };
})();
