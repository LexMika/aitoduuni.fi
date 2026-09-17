/* Peilihylly: harvest-ote kun Hilma/TED ei aukea. Suodatin ?n= + haku. */
(function () {
  function init() {
    var list = document.getElementById("peili-list");
    var countEl = document.getElementById("peili-count");
    var emptyEl = document.getElementById("peili-empty");
    var qEl = document.getElementById("peili-q");
    var focusEl = document.getElementById("peili-focus");
    var clearEl = document.getElementById("peili-clear");
    if (!list || !countEl) return;

    var items = [];
    try {
      var raw = document.getElementById("peili-data");
      if (raw) items = JSON.parse(raw.textContent || "[]");
    } catch (e) {
      items = [];
    }

    var noticeFocus = "";
    try {
      var u = new URL(window.location.href);
      noticeFocus = (u.searchParams.get("n") || "").trim();
    } catch (e) {}

    function norm(s) {
      return String(s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    }

    function render() {
      var q = qEl ? norm(qEl.value) : "";
      var shown = 0;
      var html = [];
      items.forEach(function (it) {
        var blob = norm(
          [it.notice, it.title, it.org, it.cpv, it.slug, it.value].join(" ")
        );
        var matchQ = !q || blob.indexOf(q) !== -1;
        var matchN = !noticeFocus || String(it.notice) === noticeFocus;
        if (!matchQ || !matchN) return;
        shown += 1;
        var isFocus = noticeFocus && String(it.notice) === noticeFocus;
        html.push(
          '<article class="peili-card' +
            (isFocus ? " is-focus" : "") +
            '" id="n-' +
            encodeURIComponent(it.notice || it.slug) +
            '" data-notice="' +
            String(it.notice || "").replace(/"/g, "") +
            '">' +
            '<div class="peili-card-top">' +
            '<span class="peili-badge">Ilmoitusote</span>' +
            (it.date
              ? '<span class="peili-date">' + it.date + "</span>"
              : "") +
            "</div>" +
            "<h2>" +
            (it.title || it.notice || "Ilmoitus") +
            "</h2>" +
            '<dl class="peili-facts">' +
            (it.notice
              ? "<div><dt>Ilmoitus</dt><dd>" + it.notice + "</dd></div>"
              : "") +
            (it.org
              ? "<div><dt>Organisaatio</dt><dd>" + it.org + "</dd></div>"
              : "") +
            (it.value
              ? "<div><dt>Arvioitu arvo</dt><dd>" + it.value + "</dd></div>"
              : "") +
            (it.cpv ? "<div><dt>CPV</dt><dd>" + it.cpv + "</dd></div>" : "") +
            "</dl>" +
            '<p class="peili-note">' +
            (it.note || "") +
            "</p>" +
            '<p class="peili-actions">' +
            (it.card_url
              ? '<a href="' + it.card_url + '">Avaa Löydöt-kortti →</a>'
              : "") +
            "</p>" +
            "</article>"
        );
      });
      list.innerHTML = html.join("") || "";
      countEl.innerHTML =
        "Näkyvissä <strong>" + shown + "</strong> / " + items.length;
      if (emptyEl) emptyEl.hidden = shown > 0;
      if (focusEl) {
        if (noticeFocus) {
          focusEl.hidden = false;
          focusEl.innerHTML =
            "Suodatus ilmoitusnumerolla <strong>" +
            noticeFocus +
            "</strong>" +
            (shown === 0 ? ": ei osumaa." : ".");
        } else {
          focusEl.hidden = true;
        }
      }
      if (clearEl) clearEl.hidden = !noticeFocus && !(qEl && qEl.value);
      if (noticeFocus && shown === 1) {
        var el = list.querySelector(".peili-card.is-focus");
        if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }

    if (qEl) qEl.addEventListener("input", render);
    if (clearEl) {
      clearEl.addEventListener("click", function () {
        noticeFocus = "";
        if (qEl) qEl.value = "";
        try {
          var path = window.location.pathname || "/";
          history.replaceState(null, "", path);
        } catch (e) {}
        render();
      });
    }
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
