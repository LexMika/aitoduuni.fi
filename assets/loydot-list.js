/* Löydöt-listan suodatin, haku ja järjestys (staattinen HTML).
   Osoiterivi: vain polku (ei ?q= / ?kind=). Suodatin muistissa; vanhat ?kind=/# luetaan kerran. */
(function () {
  function init() {
    var list = document.getElementById("find-list");
    var countEl = document.getElementById("find-count");
    var emptyEl = document.getElementById("find-empty");
    var qEl = document.getElementById("find-q");
    var chips = document.querySelectorAll(".find-chip:not(.find-sort-chip)");
    var sortChips = document.querySelectorAll(".find-sort-chip");
    if (!list || !countEl) return;

    var kind = "";
    var q = "";
    var sort = "newest";
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

    function numValue(el) {
      var raw = el.getAttribute("data-value");
      if (raw === null || raw === "") return null;
      var v = parseFloat(raw);
      return isNaN(v) ? null : v;
    }

    function titleKey(el) {
      return (el.getAttribute("data-title") || "").toLowerCase();
    }

    function dateKey(el) {
      return el.getAttribute("data-found-at") || "";
    }

    function compareNewest(a, b) {
      var da = dateKey(a);
      var db = dateKey(b);
      if (da !== db) return db.localeCompare(da);
      var va = numValue(a);
      var vb = numValue(b);
      if (va !== vb) return (vb === null ? -1 : vb) - (va === null ? -1 : va);
      return titleKey(a).localeCompare(titleKey(b), "fi");
    }

    function compareOldest(a, b) {
      var da = dateKey(a);
      var db = dateKey(b);
      if (da !== db) return da.localeCompare(db);
      return titleKey(a).localeCompare(titleKey(b), "fi");
    }

    function compareLargest(a, b) {
      var va = numValue(a);
      var vb = numValue(b);
      if (va !== vb) return (vb === null ? -1 : vb) - (va === null ? -1 : va);
      var da = dateKey(a);
      var db = dateKey(b);
      if (da !== db) return db.localeCompare(da);
      return titleKey(a).localeCompare(titleKey(b), "fi");
    }

    function compareSmallest(a, b) {
      var va = numValue(a);
      var vb = numValue(b);
      var aMissing = va === null;
      var bMissing = vb === null;
      if (aMissing !== bMissing) return aMissing ? 1 : -1;
      if (va !== vb) return va - vb;
      var da = dateKey(a);
      var db = dateKey(b);
      if (da !== db) return db.localeCompare(da);
      return titleKey(a).localeCompare(titleKey(b), "fi");
    }

    var comparators = {
      newest: compareNewest,
      oldest: compareOldest,
      largest: compareLargest,
      smallest: compareSmallest,
      az: function (a, b) {
        return titleKey(a).localeCompare(titleKey(b), "fi");
      },
      za: function (a, b) {
        return titleKey(b).localeCompare(titleKey(a), "fi");
      },
    };

    function reorderList() {
      var items = Array.prototype.slice.call(list.querySelectorAll(".find-item"));
      var cmp = comparators[sort] || compareNewest;
      items.sort(cmp);
      items.forEach(function (el) {
        list.appendChild(el);
      });
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

    function setSortActive() {
      sortChips.forEach(function (btn) {
        var s = (btn.getAttribute("data-sort") || "").toLowerCase();
        btn.classList.toggle("is-active", s === sort);
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

    sortChips.forEach(function (btn) {
      btn.addEventListener("click", function () {
        sort = (btn.getAttribute("data-sort") || "newest").toLowerCase();
        setSortActive();
        reorderList();
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
    setSortActive();
    reorderList();
    apply();
    cleanUrl();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
