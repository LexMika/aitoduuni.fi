/** Virheilmoitus: Formspree AJAX + oma kiitos-popup (ei Formspreen redirect). */
(function () {
  const ENDPOINT = "https://formspree.io/f/mjgpwgnw";
  const form = document.getElementById("virhe-form");
  if (!form) return;

  const btn = form.querySelector('button[type="submit"]');
  const status = document.getElementById("virhe-status");
  const overlay = document.getElementById("virhe-overlay");
  const summaryEl = document.getElementById("virhe-summary");
  const closeBtn = document.getElementById("virhe-close");

  function setStatus(msg, isErr) {
    if (!status) return;
    status.textContent = msg || "";
    status.classList.toggle("err", !!isErr);
  }

  function clip(s, n) {
    const t = String(s || "").trim();
    if (!t) return "";
    return t.length > n ? t.slice(0, n - 1) + "…" : t;
  }

  function openPopup(summary) {
    if (!overlay || !summaryEl) return;
    summaryEl.textContent = summary;
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    (closeBtn || overlay).focus?.();
  }

  function closePopup() {
    if (!overlay) return;
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
  }

  closeBtn?.addEventListener("click", closePopup);
  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) closePopup();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay?.classList.contains("open")) closePopup();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("");
    const viesti = String(form.viesti?.value || "").trim();
    const lahde = String(form.lahde_sanoi?.value || "").trim();
    const email = String(form.email?.value || "").trim();
    const kortti = String(form.kortti?.value || "").trim();
    if (!viesti) {
      setStatus("Kirjoita mitä on väärin.", true);
      return;
    }
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Lähetetään…";
    }
    try {
      const body = new FormData(form);
      const res = await fetch(ENDPOINT, {
        method: "POST",
        body,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        let detail = "Lähetys ei onnistunut. Kokeile hetken päästä.";
        try {
          const data = await res.json();
          if (data && data.error) detail = String(data.error);
        } catch (_) {}
        throw new Error(detail);
      }
      const lines = [
        "Kortti: " + (kortti || "(ei id:tä)"),
        "Mikä on väärin: " + clip(viesti, 400),
      ];
      if (lahde) lines.push("Lähteessä: " + clip(lahde, 240));
      if (email) lines.push("Vastausosoite: " + clip(email, 80));
      form.reset();
      openPopup(lines.join("\n\n"));
      setStatus("");
    } catch (err) {
      setStatus(err && err.message ? err.message : "Lähetys epäonnistui.", true);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Lähetä ilmoitus";
      }
    }
  });
})();
