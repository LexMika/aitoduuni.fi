/* Löydöt-listan suodatin + haku (staattinen HTML).
   Osoiterivi: vain polku (ei ?q= / ?kind=). Suodatin muistissa; vanhat ?kind=/# luetaan kerran. */
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
    var allowed = { raha: 1, hankinta: 1, ketju: 1, peitto: 1 };
    var shortKind = { r: "raha", h: "hankinta", k: "ketju", p: "peitto" };

    function kindFromUrl() {
      try {
        var u = new URL(window.location.href);
        var k = (u.searchParams.get("kind") || u.searchParams.get("k") || "").trim().toLowerCase();
        if (shortKind[k]) k = shortKind[k];
        if (k && allowed[k]) return k;
        var hash = (u.hash || "").replace(/^#/, "").trim().toLowerCase();
        if (shortKind[hash]) hash = shortKind[hash];
        if (hash && allowed[hash]) return hash;
      } catch (e) {}
      return "";
    }

    /** Pidä osoiterivi lyhyenä: /sivut/loydot/ ilman queryä tai hashia. */
    function cleanUrl() {
      try {
        var path = window.location.pathname || "/";
        if (window.location.search || window.location.hash) {
          history.replaceState(null, "", path);
        }
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
        cleanUrl();
      });
    });

    if (qEl) {
      qEl.addEventListener("input", function () {
        q = (qEl.value || "").trim();
        apply();
        cleanUrl();
      });
    }

    kind = kindFromUrl();
    setChipActive();
    apply();
    cleanUrl();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
