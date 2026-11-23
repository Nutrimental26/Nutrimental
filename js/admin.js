/* ============================================================
   NUTRIMENTAL · PANEL PRIVADO
   Edita el contenido y genera un nuevo config.js para publicar.
   ============================================================ */
(function () {
  const PUB = window.NUTRIMENTAL_CONFIG;
  const KEY = "nm_config_draft", SESS = "nm_admin_ok";
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const FORM_LABEL = { consulta: "Consulta (alimentación general)", apto: "Apto Médico / Choferes (examen, laboratorios, ruta)", peso: "Control de peso (medidas e historia del peso)", cronica: "Patología crónica (expediente ABCD completo)" };

  /* ---------- SHA-256 (no depende de https) ---------- */
  function sha256(str) {
    const rotr = (v, a) => (v >>> a) | (v << (32 - a));
    const K = [], H = []; let pc = 0;
    for (let c = 2; pc < 64; c++) {
      let prime = true; for (let i = 2; i * i <= c; i++) if (c % i === 0) { prime = false; break; }
      if (prime) { if (pc < 8) H[pc] = (Math.pow(c, 1 / 2) * 4294967296) | 0; K[pc++] = (Math.pow(c, 1 / 3) * 4294967296) | 0; }
    }
    const bytes = new TextEncoder().encode(str), l = bytes.length;
    const buf = new Uint8Array(((l + 9 + 63) >> 6) << 6); buf.set(bytes); buf[l] = 0x80;
    const dv = new DataView(buf.buffer); dv.setUint32(buf.length - 4, (l * 8) >>> 0); dv.setUint32(buf.length - 8, Math.floor((l * 8) / 4294967296));
    const w = new Int32Array(64); let h = H.slice();
    for (let o = 0; o < buf.length; o += 64) {
      for (let j = 0; j < 16; j++) w[j] = dv.getInt32(o + j * 4);
      for (let j = 16; j < 64; j++) {
        const s0 = rotr(w[j - 15], 7) ^ rotr(w[j - 15], 18) ^ (w[j - 15] >>> 3), s1 = rotr(w[j - 2], 17) ^ rotr(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }
      let [a, b, c, d, e, f, g, hh] = h;
      for (let j = 0; j < 64; j++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25), ch = (e & f) ^ (~e & g), t1 = (hh + S1 + ch + K[j] + w[j]) | 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22), maj = (a & b) ^ (a & c) ^ (b & c), t2 = (S0 + maj) | 0;
        hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h = [h[0] + a, h[1] + b, h[2] + c, h[3] + d, h[4] + e, h[5] + f, h[6] + g, h[7] + hh].map((x) => x | 0);
    }
    return h.map((x) => (x >>> 0).toString(16).padStart(8, "0")).join("");
  }
  const hashPw = (pw) => sha256("nm|" + pw);

  /* ---------- Estado ---------- */
  let draft;
  try { const raw = localStorage.getItem(KEY); draft = raw ? JSON.parse(raw) : clone(PUB); } catch (e) { draft = clone(PUB); }
  let tab = "paquetes";

  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(draft)); } catch (e) { msg("No se pudo guardar el borrador en este navegador"); } updateDirty(); };
  const isDirty = () => JSON.stringify(draft) !== JSON.stringify(PUB);
  function updateDirty() { const d = $("#dirty"); const dirty = isDirty(); d.textContent = dirty ? "Cambios sin publicar" : "Sin cambios"; d.className = "dirty" + (dirty ? "" : " clean"); }
  function msg(t) { const m = document.createElement("div"); m.className = "adm-msg"; m.textContent = t; document.body.appendChild(m); setTimeout(() => m.remove(), 2400); }

  function setPath(path, val) {
    const parts = path.split("."); let o = draft;
    for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]];
    o[parts[parts.length - 1]] = val;
  }

  /* ---------- Acceso ---------- */
  // Contraseña inicial de fábrica: el panel obliga a cambiarla en el primer ingreso.
  const DEFAULT_HASH = "15552c788279c8a45eac811bcc8696da509bfd9181fa37afe147461377778251";
  function showSetup() {
    $("#login").hidden = false; $("#app").hidden = true;
    $("#login").querySelector(".login-card").innerHTML =
      '<img src="assets/logo.png" alt="Nutrimental"><h1>Crea tu contraseña</h1>' +
      '<p>Por seguridad, antes de editar elige una contraseña personal (mínimo 8 caracteres). Solo tú debes conocerla.</p>' +
      '<form id="setupForm"><input type="password" id="sp1" placeholder="Nueva contraseña" autocomplete="new-password" required>' +
      '<input type="password" id="sp2" placeholder="Repite la contraseña" autocomplete="new-password" required>' +
      '<div class="err" id="setupErr" style="display:none;text-align:center"></div><button class="btn btn-primary" type="submit">Guardar y entrar</button></form>';
    $("#setupForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const a = $("#sp1").value, b = $("#sp2").value, er = $("#setupErr");
      const fail = (t) => { er.textContent = t; er.style.display = "block"; };
      if (a.length < 8) return fail("Mínimo 8 caracteres");
      if (a !== b) return fail("Las contraseñas no coinciden");
      if (hashPw(a) === DEFAULT_HASH) return fail("Elige una contraseña distinta a la inicial");
      draft.adminHash = hashPw(a); persist(); showApp();
      msg("Contraseña creada. Al terminar, descarga config.js y súbelo a tu hosting para que aplique.");
    });
  }
  function showApp() { $("#login").hidden = true; $("#app").hidden = false; render(); updateDirty(); }
  $("#loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const h = hashPw($("#pw").value);
    if (h === PUB.adminHash || h === draft.adminHash) {
      try { sessionStorage.setItem(SESS, "1"); } catch (x) {}
      if (draft.adminHash === DEFAULT_HASH) showSetup(); else showApp();
    }
    else { $("#loginErr").style.display = "block"; $("#pw").select(); }
  });
  $("#btnLogout").addEventListener("click", () => { try { sessionStorage.removeItem(SESS); } catch (e) {} location.reload(); });
  try { if (sessionStorage.getItem(SESS) === "1") { if (draft.adminHash === DEFAULT_HASH) showSetup(); else showApp(); } } catch (e) {}

  /* ---------- Vistas ---------- */
  const inp = (path, label, o = {}) => {
    const val = path.split(".").reduce((a, k) => (a == null ? a : a[k]), draft);
    const type = o.type || "text";
    const common = 'data-path="' + path + '" data-kind="' + (o.kind || type) + '"';
    let field;
    if (type === "textarea") field = "<textarea " + common + ' rows="' + (o.rows || 3) + '">' + esc(o.lines ? (val || []).join("\n") : val) + "</textarea>";
    else if (type === "select") field = "<select " + common + ">" + o.opts.map((x) => '<option value="' + esc(x[0]) + '"' + (String(val) === String(x[0]) ? " selected" : "") + ">" + esc(x[1]) + "</option>").join("") + "</select>";
    else field = "<input " + common + ' type="' + type + '" value="' + esc(val) + '"' + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : "") + (type === "number" ? ' min="0" step="1" inputmode="numeric"' : "") + ">";
    return '<label class="fl' + (o.full ? " full" : "") + '"><span>' + esc(label) + "</span>" + field + (o.hint ? '<div class="hint">' + esc(o.hint) + "</div>" : "") + "</label>";
  };
  const chk = (path, label) => {
    const val = path.split(".").reduce((a, k) => a[k], draft);
    return '<label class="switch"><input type="checkbox" data-path="' + path + '" data-kind="bool"' + (val ? " checked" : "") + "> " + esc(label) + "</label>";
  };

  function vPaquetes() {
    return '<div class="panel"><h2>Paquetes y precios</h2><p class="sub">Cambia nombres, textos, precios y promociones. Los 4 paquetes conservan su formulario clínico propio.</p>' +
      draft.paquetes.map((p, i) => {
        const b = "paquetes." + i + ".";
        return '<div class="pk"><div class="pk-head"><div><b>Paquete ' + (i + 1) + "</b><small>Formulario: " + esc(FORM_LABEL[p.formulario] || p.formulario) + '</small></div><div style="display:flex;gap:18px;flex-wrap:wrap">' + chk(b + "activo", "Visible en la página") + chk(b + "destacado", "Marcar como «Más solicitado»") + "</div></div>" +
          '<div class="g2">' + inp(b + "nombre", "Nombre del paquete") + inp(b + "etiqueta", "Etiqueta corta", { ph: "Ej. Trimestral · 12 semanas" }) +
          inp(b + "duracion", "Duración / estructura", { full: true }) + inp(b + "descripcion", "Descripción", { type: "textarea", rows: 2, full: true }) +
          inp(b + "incluye", "Qué incluye (una línea por cada punto)", { type: "textarea", rows: 5, lines: true, kind: "lines", full: true }) +
          '<div class="sep"></div>' +
          inp(b + "tipoPrecio", "Tipo de precio", { type: "select", opts: [["fijo", "Precio fijo"], ["evaluacion", "Según evaluación (se cotiza después)"]] }) +
          inp(b + "precio", "Precio regular (MXN)", { type: "number", hint: "Se ignora si el tipo es «según evaluación»." }) +
          inp(b + "parcialidades", "Pagos disponibles", { type: "select", kind: "int", opts: [[1, "Solo pago único"], [2, "Pago único o 2 pagos (50 % / 50 %)"], [3, "Pago único o 3 pagos"]] }) +
          '<div class="sep"></div><div class="fl full">' + chk(b + "promo.activa", "Activar precio promocional (muestra el precio regular tachado)") + "</div>" +
          inp(b + "promo.precio", "Precio promocional (MXN)", { type: "number" }) + inp(b + "promo.nota", "Texto de la promoción", { ph: "Ej. Cupo fundador · primeros 6 lugares" }) +
          "</div></div>";
      }).join("") + "</div>";
  }

  function vPromos() {
    const opts = [["", "Sin vincular (solo imagen)"], ...draft.paquetes.map((p) => [p.id, p.nombre])];
    return '<div class="panel"><h2>Promociones en imagen</h2><p class="sub">Hasta 3 imágenes que aparecen arriba de los paquetes. Si no subes ninguna, la sección no se muestra. Cualquier formato funciona; el ideal es vertical 4:5 (por ejemplo 1080 × 1350 px).</p>' +
      draft.promociones.map((x, i) => '<div class="promo-slot"><div class="promo-prev">' + (x.imagen ? '<img src="' + esc(x.imagen) + '" alt="Promoción ' + (i + 1) + '">' : "Promoción " + (i + 1) + "<br>sin imagen") + "</div><div><b style=\"font-family:var(--display);font-size:1.15rem\">Promoción " + (i + 1) + "</b>" +
        '<div class="g2" style="margin-top:12px">' + inp("promociones." + i + ".titulo", "Texto sobre la imagen (opcional)") + inp("promociones." + i + ".paquete", "Al tocarla, abre el formulario de…", { type: "select", opts }) + "</div>" +
        '<div class="row-actions"><label class="btn btn-sm btn-primary" style="cursor:pointer">' + (x.imagen ? "Cambiar imagen" : "Subir imagen") + '<input type="file" accept="image/*" data-file="' + i + '" hidden></label>' + (x.imagen ? '<button class="btn btn-sm btn-ghost" data-rm="' + i + '">Quitar</button>' : "") + "</div></div></div>").join("") +
      '<div class="note">Las imágenes se reducen automáticamente (máx. 1200 px de ancho) para que la página cargue rápido.</div></div>';
  }

  function vPago() {
    return '<div class="panel"><h2>Datos de depósito</h2><p class="sub">Se muestran al cliente antes de enviar su expediente. Si dejas CLABE, tarjeta y enlace vacíos, la página le avisará que le enviarás los datos por correo.</p><div class="g2">' +
      inp("pago.banco", "Banco") + inp("pago.titular", "Titular de la cuenta") + inp("pago.clabe", "CLABE interbancaria", { ph: "18 dígitos" }) + inp("pago.tarjeta", "Número de tarjeta (opcional)") +
      inp("pago.concepto", "Concepto sugerido", { full: true }) + inp("pago.enlacePago", "Enlace de pago (Mercado Pago, PayPal, etc.) (opcional)", { full: true, type: "url", ph: "https://" }) +
      inp("pago.instrucciones", "Instrucciones", { type: "textarea", rows: 3, full: true }) + "</div></div>";
  }

  function vContacto() {
    return '<div class="panel"><h2>Contacto y envío</h2><p class="sub">Aquí defines a qué correo llega cada expediente en PDF.</p><div class="g2">' +
      inp("envio.correoDestino", "Correo donde recibes los expedientes (PDF)", { type: "email", full: true, hint: "Cuidado: si lo cambias, el nuevo correo debe activarse la primera vez (ver pestaña «Cómo publicar»)." }) +
      inp("negocio.profesional", "Nombre del profesional") + inp("negocio.cedula", "Cédula profesional") + inp("negocio.correo", "Correo visible en la página", { type: "email" }) + inp("negocio.telefono", "Teléfono visible en la página") +
      inp("negocio.horarioChat", "Horario de respuesta del chat de Nutrimind", { full: true }) + "</div></div>";
  }

  function vSeg() {
    return '<div class="panel"><h2>Cambiar contraseña</h2><p class="sub">Después de cambiarla, descarga el nuevo config.js y súbelo a tu hosting para que aplique.</p><div class="g2">' +
      '<label class="fl"><span>Nueva contraseña (mínimo 8 caracteres)</span><input type="password" id="np1" autocomplete="new-password"></label><label class="fl"><span>Repite la contraseña</span><input type="password" id="np2" autocomplete="new-password"></label></div>' +
      '<div class="row-actions"><button class="btn btn-primary" id="btnPw">Guardar contraseña</button></div>' +
      '<div class="note warn"><b>Importante:</b> este panel protege la <i>edición</i> con contraseña, pero tus cambios solo llegan al público cuando tú subes el archivo config.js a tu hosting, y eso solo puedes hacerlo tú. No compartas tu archivo ni tu acceso al hosting.</div></div>';
  }

  function vPublicar() {
    const kb = Math.round(configText().length / 1024);
    return '<div class="panel"><h2>Cómo publicar tus cambios</h2><p class="sub">Tu página es estática: no necesita servidor ni base de datos. Los cambios se publican reemplazando un solo archivo.</p>' +
      '<ol class="how"><li>Haz tus cambios en este panel. Se guardan como borrador en este navegador y puedes ver cómo quedan con <b>Vista previa</b>.</li><li>Pulsa <b>Descargar config.js</b> (arriba a la derecha). Pesa aprox. ' + kb + ' KB.</li><li>En tu hosting, <b>reemplaza el archivo config.js</b> de tu carpeta por el nuevo (en Netlify: Deploys → arrastra de nuevo la carpeta completa; en GitHub Pages: sube el archivo al repositorio).</li><li>Recarga tu página pública: ya verás paquetes, precios y promociones actualizados.</li></ol>' +
      '<div class="row-actions"><button class="btn btn-primary" id="btnDownload2">Descargar config.js</button><button class="btn btn-ghost" id="btnReset">Descartar borrador y volver a lo publicado</button></div></div>' +
      '<div class="panel"><h2>Recepción de expedientes por correo</h2><p class="sub">Sin servidor propio, el envío usa el servicio gratuito FormSubmit, que manda el PDF directo a tu correo.</p>' +
      '<ol class="how"><li>Publica tu página y llena <b>una vez</b> un formulario de prueba como si fueras cliente.</li><li>FormSubmit enviará un correo de <b>activación</b> a tu dirección. Ábrelo y confirma.</li><li>Haz otra prueba: ahora el correo llega con el PDF adjunto. A partir de ahí todo es automático.</li></ol>' +
      '<div class="note warn">Hasta confirmar la activación, los envíos no se entregan. Revisa también la carpeta de spam la primera vez.</div></div>';
  }

  const VIEWS = { paquetes: vPaquetes, promos: vPromos, pago: vPago, contacto: vContacto, seguridad: vSeg, publicar: vPublicar };
  function render() {
    $("#view").innerHTML = VIEWS[tab]();
    document.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.tab === tab)));
  }

  /* ---------- Eventos ---------- */
  document.addEventListener("input", (e) => {
    const t = e.target; if (!t.dataset || !t.dataset.path) return;
    let v = t.value;
    switch (t.dataset.kind) {
      case "bool": v = t.checked; break;
      case "number": v = v === "" ? 0 : Math.max(0, parseFloat(v)); break;
      case "int": v = parseInt(v, 10); break;
      case "lines": v = v.split("\n").map((s) => s.trim()).filter(Boolean); break;
    }
    setPath(t.dataset.path, v); persist();
  });
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset && t.dataset.file !== undefined && t.files && t.files[0]) handleImage(+t.dataset.file, t.files[0]);
  });
  document.addEventListener("click", (e) => {
    const t = e.target.closest("button"); if (!t) return;
    if (t.classList.contains("tab")) { tab = t.dataset.tab; render(); }
    else if (t.dataset.rm !== undefined) { draft.promociones[+t.dataset.rm].imagen = ""; persist(); render(); }
    else if (t.id === "btnPw") changePw();
    else if (t.id === "btnDownload" || t.id === "btnDownload2") download();
    else if (t.id === "btnPreview") { persist(); window.open("index.html?preview=1", "_blank"); }
    else if (t.id === "btnReset") { if (confirm("¿Descartar tus cambios y volver a lo que está publicado?")) { try { localStorage.removeItem(KEY); } catch (x) {} draft = clone(PUB); render(); updateDirty(); msg("Borrador descartado"); } }
  });

  function handleImage(i, file) {
    if (!/^image\//.test(file.type)) return msg("Elige un archivo de imagen");
    const rd = new FileReader();
    rd.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 1200, sc = Math.min(1, maxW / img.width), c = document.createElement("canvas");
        c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
        const ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
        draft.promociones[i].imagen = c.toDataURL("image/jpeg", 0.82); persist(); render(); msg("Imagen cargada");
      };
      img.onerror = () => msg("No se pudo leer la imagen");
      img.src = rd.result;
    };
    rd.readAsDataURL(file);
  }

  function changePw() {
    const a = $("#np1").value, b = $("#np2").value;
    if (a.length < 8) return msg("Mínimo 8 caracteres");
    if (a !== b) return msg("Las contraseñas no coinciden");
    draft.adminHash = hashPw(a); persist(); $("#np1").value = $("#np2").value = ""; msg("Contraseña guardada. Descarga config.js para publicarla.");
  }

  function configText() {
    return "/* ============================================================\n   NUTRIMENTAL · CONTENIDO EDITABLE (generado por el panel privado)\n   Reemplaza este archivo en tu hosting para publicar los cambios.\n   ============================================================ */\nwindow.NUTRIMENTAL_CONFIG = " + JSON.stringify(draft, null, 2) + ";\n";
  }
  function download() {
    const blob = new Blob([configText()], { type: "text/javascript" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "config.js"; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    msg("config.js descargado: reemplázalo en tu hosting");
  }

  window.NM_ADMIN_SHA = sha256; // para pruebas
})();
