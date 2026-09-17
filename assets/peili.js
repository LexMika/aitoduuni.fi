/* Ilmoitusote: lista + yksityiskohtainen ote (?n=). */
(function () {
  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function row(label, value) {
    if (!value) return "";
    return (
      "<div><dt>" +
      esc(label) +
      "</dt><dd>" +
      esc(value) +
      "</dd></div>"
    );
  }

  function para(label, text) {
    if (!text) return "";
    return (
      '<div class="peili-block"><h3>' +
      esc(label) +
      "</h3><p>" +
      esc(text) +
      "</p></div>"
    );
  }

  function renderDetail(it) {
    var h = it.harvest || {};
    var national = h.national
      ? "Kansallinen hankintailmoitus (ei EU-julkaisua TED:ssä)"
      : "";
    return (
      '<article class="peili-detail" id="n-' +
      encodeURIComponent(it.notice || it.slug) +
      '">' +
      '<p class="peili-detail-kicker">Ilmoitusote · poiminta hankintailmoituksesta</p>' +
      "<h2>" +
      esc(it.title || h.title_raw || it.notice || "Ilmoitus") +
      "</h2>" +
      '<p class="peili-detail-lead">' +
      esc(
        "Tämä sivu näyttää sen tiedon, jonka AitoData poimi ilmoituksesta. " +
          "Se ei ole Hilman eikä TED:n virallinen ilmoitussivu."
      ) +
      "</p>" +
      '<section class="peili-detail-grid">' +
      '<div class="peili-detail-col">' +
      "<h3>Perustiedot</h3>" +
      '<dl class="peili-facts">' +
      row("Ilmoitusnumero", it.notice) +
      row("Ostaja", it.org || h.organisation) +
      row("Y-tunnus", h.ytunnus) +
      row("Osoite", h.address) +
      row("Julkaistu", h.publication_date || it.date) +
      row("Tarjoukset viimeistään", h.tenders_due) +
      row("Arvioitu arvo", h.estimated_value_label || it.value) +
      row("CPV", h.cpv_raw || it.cpv) +
      row("Alue (NUTS)", h.nuts) +
      row("Ilmoitustyyppi", h.main_type) +
      row("Luonne", national) +
      "</dl>" +
      "</div>" +
      '<div class="peili-detail-col">' +
      "<h3>Mistä tämä tieto tulee</h3>" +
      '<dl class="peili-facts">' +
      row("Aineisto", h.source_label || "Hankintailmoitukset (Hilma)") +
      row("Poimittu", h.fetched_at || "") +
      row(
        "Hilma-sivu",
        "Ei aukea selaimessa tälle ilmoitukselle (vanha ilmoitus)"
      ) +
      "</dl>" +
      '<p class="peili-note">' +
      esc(it.note || "") +
      "</p>" +
      "</div>" +
      "</section>" +
      para("Lyhyt kuvaus (poimittu)", h.short_description) +
      para("Kohteen kuvaus (poimittu)", h.object_descriptions) +
      '<p class="peili-actions">' +
      (it.card_url
        ? '<a href="' + esc(it.card_url) + '">Avaa Löydöt-kortti →</a>'
        : "") +
      ' <a class="peili-back" href="./">← Kaikki ilmoitusotteet</a>' +
      "</p>" +
      "</article>"
    );
  }

  function renderCompact(it) {
    var href = it.notice ? "./?n=" + encodeURIComponent(it.notice) : "#";
    return (
      '<article class="peili-card">' +
      '<div class="peili-card-top">' +
      '<span class="peili-badge">Ilmoitusote</span>' +
      (it.date ? '<span class="peili-date">' + esc(it.date) + "</span>" : "") +
      "</div>" +
      "<h2><a href=\"" +
      href +
      '">' +
      esc(it.title || it.notice || "Ilmoitus") +
      "</a></h2>" +
      (it.teaser
        ? '<p class="peili-teaser">' + esc(it.teaser) + "</p>"
        : "") +
      '<p class="peili-card-meta">' +
      esc([it.notice, it.org].filter(Boolean).join(" · ")) +
      "</p>" +
      '<p class="peili-actions"><a href="' +
      href +
      '">Avaa tarkempi ote →</a></p>' +
      "</article>"
    );
  }

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
      noticeFocus = (
        new URL(window.location.href).searchParams.get("n") || ""
      ).trim();
    } catch (e) {}

    function norm(s) {
      return String(s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
    }

    function render() {
      var q = qEl ? norm(qEl.value) : "";
      var matched = [];
      items.forEach(function (it) {
        var h = it.harvest || {};
        var blob = norm(
          [
            it.notice,
            it.title,
            it.org,
            it.cpv,
            it.teaser,
            h.short_description,
            h.object_descriptions,
          ].join(" ")
        );
        var matchQ = !q || blob.indexOf(q) !== -1;
        var matchN = !noticeFocus || String(it.notice) === noticeFocus;
        if (matchQ && matchN) matched.push(it);
      });

      var html = [];
      if (noticeFocus && matched.length === 1) {
        html.push(renderDetail(matched[0]));
      } else {
        matched.forEach(function (it) {
          html.push(renderCompact(it));
        });
      }

      list.innerHTML = html.join("") || "";
      countEl.innerHTML =
        "Näkyvissä <strong>" + matched.length + "</strong> / " + items.length;
      if (emptyEl) emptyEl.hidden = matched.length > 0;
      if (focusEl) {
        if (noticeFocus) {
          focusEl.hidden = false;
          focusEl.innerHTML =
            "Näytetään ilmoitus <strong>" +
            esc(noticeFocus) +
            "</strong>" +
            (matched.length === 0 ? ": ei osumaa." : ".");
        } else {
          focusEl.hidden = true;
        }
      }
      if (clearEl) clearEl.hidden = !noticeFocus && !(qEl && qEl.value);
    }

    if (qEl) qEl.addEventListener("input", render);
    if (clearEl) {
      clearEl.addEventListener("click", function () {
        noticeFocus = "";
        if (qEl) qEl.value = "";
        try {
          history.replaceState(null, "", window.location.pathname || "/");
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
