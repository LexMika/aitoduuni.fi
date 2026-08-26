/* Löydöt-listan suodatin, haku, järjestys ja sivutus (staattinen HTML).
   Osoiterivi: vain polku (ei ?q= / ?kind=). Suodatin muistissa; vanhat ?kind=/# luetaan kerran.
   Sivutus: 50 / sivu · nollautuu kun kind / haku / järjestys vaihtuu. */
(function () {
  var PAGE_SIZE = 50;

  function init() {
    var list = document.getElementById("find-list");
    var countEl = document.getElementById("find-count");
    var emptyEl = document.getElementById("find-empty");
    var qEl = document.getElementById("find-q");
    var chips = document.querySelectorAll(".find-chip:not(.find-sort-chip)");
    var sortChips = document.querySelectorAll(".find-sort-chip");
    if (!list || !countEl) return;

    var pagerEl = document.getElementById("find-pager");
    if (!pagerEl) {
      pagerEl = document.createElement("nav");
      pagerEl.id = "find-pager";
      pagerEl.className = "find-pager";
      pagerEl.setAttribute("aria-label", "Löytöjen sivutus");
      pagerEl.hidden = true;
      list.insertAdjacentElement("afterend", pagerEl);
    }

    var kind = "";
    var q = "";
    var sort = "newest";
    var page = 1;
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

    function matchingItems() {
      var items = Array.prototype.slice.call(list.querySelectorAll(".find-item"));
      var qLower = q.toLowerCase();
      return items.filter(function (el) {
        var okKind = !kind || el.getAttribute("data-kind") === kind;
        var blob = (el.getAttribute("data-search") || "").toLowerCase();
        var okQ = !qLower || blob.indexOf(qLower) !== -1;
        return okKind && okQ;
      });
    }

    function renderPager(totalPages) {
      pagerEl.innerHTML = "";
      if (totalPages <= 1) {
        pagerEl.hidden = true;
        return;
      }
      pagerEl.hidden = false;

      function addBtn(label, targetPage, opts) {
        opts = opts || {};
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "find-pager-btn" + (opts.active ? " is-active" : "");
        btn.textContent = label;
        if (opts.disabled) {
          btn.disabled = true;
        } else {
          btn.addEventListener("click", function () {
            page = targetPage;
            apply();
            try {
              document.getElementById("find-tools").scrollIntoView({ behavior: "smooth", block: "start" });
            } catch (e) {}
          });
        }
        if (opts.ariaLabel) btn.setAttribute("aria-label", opts.ariaLabel);
        if (opts.active) btn.setAttribute("aria-current", "page");
        pagerEl.appendChild(btn);
      }

      addBtn("Edellinen", page - 1, {
        disabled: page <= 1,
        ariaLabel: "Edellinen sivu",
      });

      // Ikkuna sivunumeroista (max ~7)
      var windowSize = 7;
      var start = Math.max(1, page - Math.floor(windowSize / 2));
      var end = Math.min(totalPages, start + windowSize - 1);
      start = Math.max(1, end - windowSize + 1);
      if (start > 1) {
        addBtn("1", 1);
        if (start > 2) {
          var dots = document.createElement("span");
          dots.className = "find-pager-gap";
          dots.textContent = "…";
          dots.setAttribute("aria-hidden", "true");
          pagerEl.appendChild(dots);
        }
      }
      for (var i = start; i <= end; i++) {
        addBtn(String(i), i, { active: i === page, ariaLabel: "Sivu " + i });
      }
      if (end < totalPages) {
        if (end < totalPages - 1) {
          var dots2 = document.createElement("span");
          dots2.className = "find-pager-gap";
          dots2.textContent = "…";
          dots2.setAttribute("aria-hidden", "true");
          pagerEl.appendChild(dots2);
        }
        addBtn(String(totalPages), totalPages);
      }

      addBtn("Seuraava", page + 1, {
        disabled: page >= totalPages,
        ariaLabel: "Seuraava sivu",
      });
    }

    function apply() {
      var matched = matchingItems();
      var total = matched.length;
      var totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1);
      if (page > totalPages) page = totalPages;
      if (page < 1) page = 1;

      var startIdx = (page - 1) * PAGE_SIZE;
      var endIdx = startIdx + PAGE_SIZE;

      var all = list.querySelectorAll(".find-item");
      all.forEach(function (el) {
        var idx = matched.indexOf(el);
        var onPage = idx !== -1 && idx >= startIdx && idx < endIdx;
        el.hidden = !onPage;
      });

      if (total === 0) {
        countEl.innerHTML = "<strong>0</strong> löytöä";
      } else if (totalPages <= 1) {
        countEl.innerHTML = "<strong>" + total + "</strong> löytöä";
      } else {
        var from = startIdx + 1;
        var to = Math.min(endIdx, total);
        countEl.innerHTML =
          "<strong>" +
          total +
          "</strong> löytöä · näytetään " +
          from +
          "–" +
          to +
          " · sivu " +
          page +
          "/" +
          totalPages;
      }
      if (emptyEl) emptyEl.hidden = total !== 0;
      renderPager(totalPages);
    }

    function resetPageAndApply() {
      page = 1;
      apply();
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
        resetPageAndApply();
        cleanUrl();
      });
    });

    sortChips.forEach(function (btn) {
      btn.addEventListener("click", function () {
        sort = (btn.getAttribute("data-sort") || "newest").toLowerCase();
        setSortActive();
        reorderList();
        resetPageAndApply();
        cleanUrl();
      });
    });

    if (qEl) {
      qEl.addEventListener("input", function () {
        q = (qEl.value || "").trim();
        resetPageAndApply();
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
