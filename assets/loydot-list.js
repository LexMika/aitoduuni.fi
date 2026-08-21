/* Löydöt-listan suodatin + haku (staattinen HTML). */
(function () {
  function init() {
    var list = document.getElementById("find-list");
    var countEl = document.getElementById("find-count");
    var emptyEl = document.getElementById("find-empty");
    var qEl = document.getElementById("find-q");
    var chips = document.querySelectorAll(".find-chip");
    if (!list || !countEl) return;

    var kind = "";
    var q = "";

    function paramsFromUrl() {
      try {
        var u = new URL(window.location.href);
        return {
          kind: (u.searchParams.get("kind") || "").trim().toLowerCase(),
          q: (u.searchParams.get("q") || "").trim(),
        };
      } catch (e) {
        return { kind: "", q: "" };
      }
    }

    function writeUrl() {
      try {
        var u = new URL(window.location.href);
        if (kind) u.searchParams.set("kind", kind);
        else u.searchParams.delete("kind");
        if (q) u.searchParams.set("q", q);
        else u.searchParams.delete("q");
        history.replaceState(null, "", u.pathname + u.search + u.hash);
      } catch (e) {}
    }

    function apply() {
      var items = list.querySelectorAll(".find-item");
      var shown = 0;
      var qLower = q.toLowerCase();
      items.forEach(function (el) {
        var okKind = !kind || el.getAttribute("data-kind") === kind;
        var blob = (el.getAttribute("data-search") || "").toLowerCase();
        var okQ = !qLower || blob.indexOf(qLower) !== -1;
        var show = okKind && okQ;
        el.hidden = !show;
        if (show) shown += 1;
      });
      countEl.innerHTML = "<strong>" + shown + "</strong> löytöä";
      if (emptyEl) emptyEl.hidden = shown !== 0;
      writeUrl();
    }

    function setChipActive() {
      chips.forEach(function (btn) {
        var k = (btn.getAttribute("data-kind") || "").toLowerCase();
        btn.classList.toggle("is-active", k === kind);
      });
    }

    chips.forEach(function (btn) {
      btn.addEventListener("click", function () {
        kind = (btn.getAttribute("data-kind") || "").toLowerCase();
        setChipActive();
        apply();
      });
    });

    if (qEl) {
      qEl.addEventListener("input", function () {
        q = (qEl.value || "").trim();
        apply();
      });
    }

    var fromUrl = paramsFromUrl();
    var allowed = { raha: 1, hankinta: 1, ketju: 1, peitto: 1 };
    if (fromUrl.kind && allowed[fromUrl.kind]) kind = fromUrl.kind;
    if (fromUrl.q) {
      q = fromUrl.q;
      if (qEl) qEl.value = q;
    }
    setChipActive();
    apply();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
