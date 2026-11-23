/* ============================================================
   NUTRIMENTAL · PÁGINA PÚBLICA
   ============================================================ */
(function () {
  /* ---------- Iconos ---------- */
  const P = {
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
    shield: '<path d="M12 3l8 3v6c0 4.500-3.200 8.200-8 9-4.800-.800-8-4.500-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>',
    apple: '<path d="M12 7.500c-1.500-1.500-4.200-1.500-5.700.200C4.300 9.900 4.900 14 7 17.200 8.200 19 9.700 20.500 12 20.500s3.800-1.500 5-3.300c2.100-3.200 2.700-7.300.7-9.500-1.500-1.700-4.200-1.700-5.700-.2z"/><path d="M12 7.500c0-2 1-3.600 3-4.500"/>',
    badge: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16.500c.5-1.500 1.600-2 3-2s2.500.5 3 2M14 10h4M14 13h3"/>',
    flask: '<path d="M9 3h6M10 3v6L4.500 19a1.500 1.500 0 001.300 2.200h12.400A1.500 1.500 0 0019.500 19L14 9V3"/><path d="M7.500 15h9"/>',
    ruler: '<rect x="2" y="8" width="20" height="8" rx="1.500"/><path d="M6 8v3M10 8v4M14 8v3M18 8v4"/>',
    heart: '<path d="M12 20s-7-4.500-7-10a4 4 0 017-2.500A4 4 0 0119 10c0 5.500-7 10-7 10z"/>',
    stetho: '<path d="M6 3v6a4 4 0 008 0V3M4 3h3M13 3h3"/><path d="M10 13v2a5 5 0 0010 0v-1.500"/><circle cx="20" cy="12" r="2"/>',
    run: '<circle cx="14" cy="4.500" r="2"/><path d="M8 21l3-6 3 2 1.500 4M11 15l-2-4 4-3 3 3 3 1M9 11l-3 1"/>',
    sign: '<path d="M4 20h16M5 16c3-8 5-9 6-8s-1 6 1 6 3-4 4-4 1 2 3 2"/>',
    check: '<path d="M5 12.500l4.500 4.500L19 7.500"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 012-2h9"/>',
    download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
    chat: '<path d="M4 5h16v11H9l-5 4V5z"/>',
    chart: '<path d="M4 20V4M4 20h16M8 15l3-4 3 2 5-7"/>',
    video: '<rect x="3" y="6" width="12" height="12" rx="2"/><path d="M15 10l6-3v10l-6-3"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
    camera: '<path d="M4 8h3l1.500-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.500"/>',
    alert: '<path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18v.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.500v.01"/>',
    ok: '<circle cx="12" cy="12" r="9"/><path d="M8 12.500l3 3 5-6"/>',
  };
  const icon = (n) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + (P[n] || "") + "</svg>";
  window.NM_ICON = icon;
  const hydrate = (root) => (root || document).querySelectorAll("[data-i]").forEach((el) => { if (!el.firstChild) el.innerHTML = icon(el.dataset.i); });

  /* ---------- Configuración ---------- */
  function getConfig() {
    let cfg = window.NUTRIMENTAL_CONFIG;
    try {
      if (new URLSearchParams(location.search).get("preview") === "1") {
        const draft = localStorage.getItem("nm_config_draft");
        if (draft) cfg = JSON.parse(draft);
      }
    } catch (e) {}
    return cfg;
  }
  const CFG = getConfig();
  window.NM_CFG = CFG;
  const $ = (s, r) => (r || document).querySelector(s);
  const money = (v) => "$" + Number(v).toLocaleString("es-MX", { maximumFractionDigits: 0 });
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  window.NM_UTIL = { money, esc, $, hydrate, icon };

  // Precio efectivo del paquete (considera promoción activa)
  function precioEfectivo(p) {
    if (p.tipoPrecio !== "fijo") return null;
    return p.promo && p.promo.activa && Number(p.promo.precio) > 0 ? Number(p.promo.precio) : Number(p.precio);
  }
  window.NM_PRECIO = precioEfectivo;

  /* ---------- Render ---------- */
  function renderPackages() {
    const grid = $("#pkgGrid");
    const list = CFG.paquetes.filter((p) => p.activo);
    grid.innerHTML = list.map((p) => {
      const promo = p.tipoPrecio === "fijo" && p.promo && p.promo.activa && Number(p.promo.precio) > 0;
      const ef = precioEfectivo(p);
      let priceHTML;
      if (p.tipoPrecio === "fijo") {
        priceHTML = (promo ? '<span class="was">' + money(p.precio) + "</span>" : "") + '<span class="amt">' + money(ef) + '</span><span class="cur">MXN</span>';
      } else priceHTML = '<span class="quote">Según evaluación</span>';
      const sub = p.tipoPrecio === "fijo" && Number(p.parcialidades) > 1 ? "o en " + p.parcialidades + " pagos de " + money(Math.ceil(ef / p.parcialidades)) : p.tipoPrecio === "fijo" ? "Pago único" : "Cotizamos tras revisar tu expediente";
      return '<article class="pkg' + (p.destacado ? " pkg-feat" : "") + '">' +
        (p.destacado ? '<span class="badge">Más solicitado</span>' : "") +
        '<div class="tag">' + esc(p.etiqueta) + "</div>" +
        "<h3>" + esc(p.nombre) + "</h3>" +
        '<div class="dur">' + esc(p.duracion) + "</div>" +
        '<p class="desc">' + esc(p.descripcion) + "</p>" +
        '<div class="price">' + priceHTML + "</div>" +
        (promo && p.promo.nota ? '<div class="price-note">' + esc(p.promo.nota) + "</div>" : "") +
        '<div class="price-sub">' + esc(sub) + "</div>" +
        "<ul>" + p.incluye.filter(Boolean).map((i) => "<li>" + icon("check") + "<span>" + esc(i) + "</span></li>").join("") + "</ul>" +
        '<button class="btn ' + (p.destacado ? "btn-primary" : "btn-ghost") + '" data-pkg="' + esc(p.id) + '">' + (p.tipoPrecio === "fijo" ? "Elegir este paquete" : "Solicitar evaluación") + " " + icon("arrow") + "</button>" +
        "</article>";
    }).join("");
  }

  function renderPromos() {
    const items = (CFG.promociones || []).filter((x) => x && x.imagen);
    const sec = $("#promos");
    if (!items.length) { sec.hidden = true; return; }
    sec.hidden = false;
    $("#promoGrid").innerHTML = items.map((x) => {
      const linked = x.paquete && CFG.paquetes.some((p) => p.id === x.paquete && p.activo);
      const tag = linked ? "button" : "div";
      return "<" + tag + ' class="promo' + (linked ? "" : " cursor-default") + '"' + (linked ? ' data-pkg="' + esc(x.paquete) + '"' : "") + ">" +
        '<img src="' + esc(x.imagen) + '" alt="' + esc(x.titulo || "Promoción Nutrimental") + '" loading="lazy">' +
        (x.titulo ? '<div class="promo-cap">' + esc(x.titulo) + "</div>" : "") + "</" + tag + ">";
    }).join("");
  }

  function renderBusiness() {
    const n = CFG.negocio;
    const set = (id, v) => { const el = $("#" + id); if (el) el.textContent = v; };
    set("trustCedula", n.cedula); set("fCedula", n.cedula); set("fProf", n.profesional);
    set("fTel", n.telefono ? "Tel. " + n.telefono : ""); set("fMail", n.correo); set("horarioChat", n.horarioChat);
    set("year", new Date().getFullYear());
  }

  renderBusiness(); renderPackages(); renderPromos(); hydrate();
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-pkg]");
    if (b && window.NM_WIZARD) { e.preventDefault(); window.NM_WIZARD.open(b.dataset.pkg); }
  });
})();
