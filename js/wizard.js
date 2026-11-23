/* ============================================================
   NUTRIMENTAL · ASISTENTE DE EXPEDIENTE (formulario por paquete)
   ============================================================ */
(function () {
  const CFG = window.NM_CFG, S = window.NM_SCHEMA, U = window.NM_UTIL, icon = window.NM_ICON;
  const { esc, money } = U;
  const $ = (s, r) => (r || document).querySelector(s);

  const W = {
    root: $("#wizard"), body: $("#wzBody"), foot: $("#wzFoot"), progress: $("#wzProgress"),
    stepName: $("#wzStepName"), next: $("#wzNext"), back: $("#wzBack"), pkgLbl: $("#wzPkg"), close: $("#wzClose"),
  };
  let st = null; // estado del asistente

  /* ---------- Utilidades ---------- */
  const bankReady = () => !!(CFG.pago && (CFG.pago.clabe || CFG.pago.tarjeta || CFG.pago.enlacePago));
  const draftKey = (id) => "nm_draft_" + id;
  const saveDraft = () => { try { localStorage.setItem(draftKey(st.pkg.id), JSON.stringify({ data: st.data, idx: st.idx })); } catch (e) {} };
  const clearDraft = () => { try { localStorage.removeItem(draftKey(st.pkg.id)); } catch (e) {} };
  function toast(msg) {
    const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t);
    setTimeout(() => t.remove(), 1800);
  }
  const makeFolio = () => {
    const d = new Date(), p = (n) => String(n).padStart(2, "0");
    const a = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; let r = "";
    for (let i = 0; i < 4; i++) r += a[Math.floor(Math.random() * a.length)];
    return "NM-" + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) + "-" + r;
  };

  /* ---------- Comprobante: reduce fotos grandes antes de adjuntarlas ---------- */
  function shrinkFile(file) {
    return new Promise((resolve, reject) => {
      if (!/^image\//.test(file.type)) { return file.size <= 5 * 1024 * 1024 ? resolve(file) : reject(new Error("PDF muy pesado")); }
      const img = new Image(), url = URL.createObjectURL(file);
      img.onload = () => {
        const max = 1600, k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob((b) => b ? resolve(new File([b], "comprobante-deposito.jpg", { type: "image/jpeg" })) : reject(new Error("no se pudo reducir")), "image/jpeg", 0.82);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("imagen inválida")); };
      img.src = url;
    });
  }

  /* ---------- Pseudo-paso final (pago / envío) ---------- */
  function finalStep() {
    const pkg = st.pkg, fixed = pkg.tipoPrecio === "fijo";
    const fields = [];
    if (fixed) {
      if (Number(pkg.parcialidades) > 1) {
        fields.push({ id: "pago_forma", label: "¿Cómo prefieres pagar?", type: "radio", req: true, stack: true, opts: [["unico", "Pago único"], ["parcial", "En " + pkg.parcialidades + " pagos: la mitad hoy y la otra mitad antes de tu segunda consulta"]] });
      }
      if (bankReady()) {
        fields.push({ id: "pago_estado", label: "Sobre tu depósito", type: "radio", req: true, stack: true, opts: [["depositado", "Ya realicé mi depósito"], ["pendiente", "Lo realizaré en las próximas 24 horas"]] });
        fields.push({ id: "pago_fecha", label: "Fecha del depósito", type: "date", req: true, half: true, show: (d) => d.pago_estado === "depositado" });
        fields.push({ id: "pago_banco", label: "Banco desde el que depositaste", type: "text", half: true, show: (d) => d.pago_estado === "depositado" });
        fields.push({ id: "pago_ref", label: "Referencia, número de rastreo o folio de tu comprobante", type: "text", req: true, show: (d) => d.pago_estado === "depositado" });
        fields.push({ id: "pago_comp", label: "Adjunta tu comprobante (foto, captura o PDF)", type: "file", hint: "Opcional, pero agiliza la confirmación de tu pago. Máximo 5 MB.", show: (d) => d.pago_estado === "depositado" });
      }
    }
    return { id: "pago", title: fixed ? "Pago y envío" : "Revisión y envío", icon: fixed ? "lock" : "check", intro: "", fields, final: true };
  }
  const totalSteps = () => st.steps.length + 1;
  const stepAt = (i) => (i < st.steps.length ? st.steps[i] : finalStep());

  /* ---------- HTML de campos ---------- */
  function fieldHTML(f) {
    if (f.type === "heading") return '<div class="heading"><h3>' + esc(f.text) + "</h3>" + (f.sub ? "<p>" + esc(f.sub) + "</p>" : "") + "</div>";
    const v = st.data[f.id];
    const req = f.req ? ' <span class="req" aria-hidden="true">*</span>' : "";
    const hint = f.hint ? '<div class="hint">' + esc(f.hint) + "</div>" : "";
    let inner = "";
    const wrapCls = "field" + (f.half ? " half" : "");
    const lbl = f.label ? "<label for=\"f_" + f.id + '">' + esc(f.label) + req + "</label>" : "";
    const lblDiv = '<div class="lbl" id="l_' + f.id + '">' + esc(f.label || "") + req + "</div>";

    switch (f.type) {
      case "text": case "email": case "tel": case "date": case "time":
        inner = lbl + '<input id="f_' + f.id + '" name="' + f.id + '" type="' + f.type + '" value="' + esc(v || "") + '"' + (f.ph ? ' placeholder="' + esc(f.ph) + '"' : "") + (f.autocomplete ? ' autocomplete="' + f.autocomplete + '"' : ' autocomplete="off"') + (f.type === "tel" ? ' inputmode="tel"' : "") + ">";
        break;
      case "number":
        inner = lbl + '<div class="inwrap' + (f.unit ? " has-unit" : "") + '"><input id="f_' + f.id + '" name="' + f.id + '" type="number" inputmode="decimal" step="' + (f.step || "any") + '" value="' + esc(v || "") + '"' + (f.min != null ? ' min="' + f.min + '"' : "") + (f.max != null ? ' max="' + f.max + '"' : "") + ' autocomplete="off">' + (f.unit ? '<span class="unit">' + esc(f.unit) + "</span>" : "") + "</div>";
        break;
      case "file":
        inner = lbl + '<input id="f_' + f.id + '" name="' + f.id + '" type="file" accept="image/*,application/pdf">' + (st.comp ? '<div class="hint">Archivo seleccionado: ' + esc(st.comp.name) + "</div>" : "");
        break;
      case "textarea":
        inner = lbl + '<textarea id="f_' + f.id + '" name="' + f.id + '" rows="' + (f.rows || 3) + '"' + (f.ph ? ' placeholder="' + esc(f.ph) + '"' : "") + ">" + esc(v || "") + "</textarea>";
        break;
      case "radio":
        inner = lblDiv + '<div class="chips' + (f.stack ? " stack" : "") + '" role="radiogroup" aria-labelledby="l_' + f.id + '">' + f.opts.map((o) =>
          '<label class="chip-opt"><input class="chip-in" type="radio" name="' + f.id + '" value="' + esc(o[0]) + '"' + (v === o[0] ? " checked" : "") + '><span class="chip-body">' + esc(o[1]) + "</span></label>").join("") + "</div>";
        break;
      case "yesno":
        inner = lblDiv + '<div class="yn" role="radiogroup" aria-labelledby="l_' + f.id + '">' +
          '<label class="chip-opt"><input class="chip-in" type="radio" name="' + f.id + '" value="si"' + (v === "si" ? " checked" : "") + '><span class="chip-body">Sí</span></label>' +
          '<label class="chip-opt no"><input class="chip-in" type="radio" name="' + f.id + '" value="no"' + (v === "no" ? " checked" : "") + '><span class="chip-body">No</span></label></div>';
        break;
      case "checks":
        inner = lblDiv + '<div class="chips multi' + (f.stack ? " stack" : "") + '" role="group" aria-labelledby="l_' + f.id + '">' + f.opts.map((o) =>
          '<label class="chip-opt"><input class="chip-in" type="checkbox" name="' + f.id + '" value="' + esc(o[0]) + '"' + (Array.isArray(v) && v.includes(o[0]) ? " checked" : "") + '><span class="chip-body">' + esc(o[1]) + "</span></label>").join("") + "</div>";
        break;
      case "agree":
        inner = '<label class="agree"><input type="checkbox" name="' + f.id + '"' + (v ? " checked" : "") + "><span>" + esc(f.label) + "</span></label>";
        break;
      case "calc":
        inner = '<div class="calc" id="calc_' + f.id + '"></div>';
        break;
    }
    return '<div class="' + wrapCls + '" data-id="' + f.id + '">' + inner + hint + '<div class="err" role="alert"></div></div>';
  }

  function preHTML(step) {
    if (step.consentText) return '<div class="field"><div class="lbl">Consentimiento informado</div><div class="consent-box">' + step.consentText.map((p) => "<p>" + esc(p) + "</p>").join("") + "</div></div>";
    if (!step.final) return "";
    const pkg = st.pkg, t = S.triaje(st.data, pkg.formulario);
    let h = "";
    if (t.nivel === "verde") h += '<div class="callout verde">' + icon("ok") + "<div><b>Todo en orden</b>Tus respuestas indican que puedes tomar la consulta virtual. Revisaremos tu expediente a detalle antes de iniciar.</div></div>";
    else h += '<div class="callout amarillo">' + icon("alert") + "<div><b>Entras con una condición</b>No hay contraindicación para la modalidad virtual, pero necesitamos tomar en cuenta lo siguiente:<ul>" + t.amarillos.map((a) => "<li>" + esc(a) + "</li>").join("") + "</ul></div></div>";

    const fixed = pkg.tipoPrecio === "fijo";
    h += '<div class="sumcard"><div class="row"><span>Paquete</span><b>' + esc(pkg.nombre) + "</b></div>";
    if (fixed) {
      const promo = pkg.promo && pkg.promo.activa && Number(pkg.promo.precio) > 0;
      if (promo) h += '<div class="row"><span>Precio regular</span><b style="text-decoration:line-through;color:var(--mute)">' + money(pkg.precio) + " MXN</b></div><div class=\"row\"><span>" + esc(pkg.promo.nota || "Precio promocional") + "</span><b>" + money(window.NM_PRECIO(pkg)) + " MXN</b></div>";
      h += '<div class="row"><span>Total del paquete</span><b id="sumTotal"></b></div>';
      h += '<div class="row total"><span id="sumDepLbl">Total a pagar</span><b id="sumDep"></b></div>';
      h += '<div class="row" id="sumRestRow" hidden><span>Restante</span><b id="sumRest"></b></div>';
    } else {
      h += '<div class="row total"><span>Precio</span><b style="font-size:1.1rem">Según evaluación</b></div>';
    }
    h += "</div>";

    if (!fixed) {
      h += '<div class="callout info">' + icon("info") + "<div><b>Así sigue</b>Revisamos tu expediente, te enviamos la cotización de tu plan y, si estás de acuerdo, coordinamos tu pago y tu alta en Nutrimind. No se te cobra nada ahora.</div></div>";
    } else if (bankReady()) {
      const p = CFG.pago;
      const line = (lbl, val) => val ? '<div class="line"><div><span>' + lbl + "</span><b>" + esc(val) + '</b></div><button type="button" class="copy" data-copy="' + esc(val) + '">' + icon("copy") + "Copiar</button></div>" : "";
      h += '<div class="field"><div class="lbl">Datos para tu depósito o transferencia</div><div class="bank">' + line("Banco", p.banco) + line("Titular", p.titular) + line("CLABE", p.clabe) + line("Tarjeta", p.tarjeta) + line("Concepto", p.concepto) +
        (p.enlacePago ? '<a class="btn btn-primary" target="_blank" rel="noopener" href="' + esc(p.enlacePago) + '">Pagar con enlace seguro ' + icon("arrow") + "</a>" : "") + "</div>" +
        (p.instrucciones ? '<div class="hint">' + esc(p.instrucciones) + "</div>" : "") + "</div>";
    } else {
      h += '<div class="callout info">' + icon("info") + "<div><b>Datos de depósito</b>Al revisar tu expediente te enviaremos por correo los datos para tu depósito. No necesitas hacer nada más por ahora.</div></div>";
    }
    return h;
  }

  function updateSummary() {
    const pkg = st.pkg; if (pkg.tipoPrecio !== "fijo" || !$("#sumTotal")) return;
    const total = window.NM_PRECIO(pkg), n = Number(pkg.parcialidades) || 1;
    const parcial = st.data.pago_forma === "parcial" && n > 1;
    const dep = parcial ? Math.ceil(total / n) : total;
    $("#sumTotal").textContent = money(total) + " MXN";
    $("#sumDep").textContent = money(dep) + " MXN";
    $("#sumDepLbl").textContent = parcial ? "Pagas hoy (1 de " + n + ")" : "Total a pagar";
    $("#sumRestRow").hidden = !parcial;
    if (parcial) $("#sumRest").textContent = money(total - dep) + " MXN";
  }

  /* ---------- Render de pasos ---------- */
  function renderProgress() {
    const n = totalSteps();
    W.progress.innerHTML = Array.from({ length: n }, (_, i) => '<i class="' + (i < st.idx ? "done" : i === st.idx ? "now" : "") + '"></i>').join("");
  }

  function renderStep() {
    st.mode = "form";
    const step = stepAt(st.idx), n = totalSteps();
    W.pkgLbl.textContent = st.pkg.nombre;
    renderProgress();
    W.stepName.textContent = "Paso " + (st.idx + 1) + " de " + n + " · " + step.title;
    const note = st.hadDraft && st.idx === 0 ? '<p class="draft-note">Retomamos tu avance guardado en este dispositivo. <button type="button" id="resetDraft">Empezar de nuevo</button></p>' : "";
    W.body.innerHTML = '<h2><span class="wz-ic">' + icon(step.icon) + "</span>" + esc(step.title) + "</h2>" +
      (step.intro ? '<p class="wz-intro">' + esc(step.intro) + "</p>" : "") + note +
      '<div class="fgrid">' + preHTML(step) +step.fields.map(fieldHTML).join("") + "</div>";
    W.foot.hidden = false;
    W.back.style.visibility = st.idx === 0 ? "hidden" : "visible";
    const last = !!step.final;
    W.next.innerHTML = last ? (st.pkg.tipoPrecio === "fijo" ? "Enviar expediente" : "Enviar solicitud") + " " + icon("check") : "Siguiente " + icon("arrow");
    applyDynamic();
    W.root.scrollTop = 0;
  }

  function applyDynamic() {
    const step = stepAt(st.idx);
    step.fields.forEach((f) => {
      if (!f.id) return;
      const wrap = W.body.querySelector('.field[data-id="' + f.id + '"]');
      if (!wrap) return;
      const vis = !f.show || f.show(st.data);
      wrap.hidden = !vis;
    });
    const c = $("#calc_imc");
    if (c) {
      const v = S.imc(st.data);
      c.innerHTML = isNaN(v) ? "<small>Se calcula con tu peso y estatura</small>" : "IMC " + v.toFixed(1) + " <small>· " + S.clasifIMC(v) + "</small>";
    }
    updateSummary();
  }

  /* ---------- Lectura y validación ---------- */
  function readField(f) {
    const els = [...W.body.querySelectorAll('[name="' + f.id + '"]')];
    if (!els.length) return st.data[f.id];
    if (f.type === "checks") return els.filter((x) => x.checked).map((x) => x.value);
    if (f.type === "radio" || f.type === "yesno") { const c = els.find((x) => x.checked); return c ? c.value : ""; }
    if (f.type === "agree") return !!els[0].checked;
    if (f.type === "file") return "";
    return els[0].value;
  }

  function onInput(e) {
    const t = e.target; if (!t.name) return;
    const step = stepAt(st.idx), f = step.fields.find((x) => x.id === t.name); if (!f) return;
    if (f.type === "checks" && f.exclusive && e.type === "change") {
      const els = [...W.body.querySelectorAll('[name="' + f.id + '"]')];
      if (t.value === f.exclusive && t.checked) els.forEach((x) => { if (x !== t) x.checked = false; });
      else if (t.checked) els.forEach((x) => { if (x.value === f.exclusive) x.checked = false; });
    }
    if (f.type === "file") {
      const fl = t.files && t.files[0];
      if (fl && fl.size > 5 * 1024 * 1024 && !/^image\//.test(fl.type)) { t.value = ""; st.comp = null; toast("El archivo supera 5 MB. Sube una foto o un PDF más ligero."); return; }
      st.comp = fl || null; return;
    }
    st.data[f.id] = readField(f);
    const wrap = t.closest(".field"); if (wrap) wrap.classList.remove("error");
    applyDynamic(); saveDraft();
  }

  function validate() {
    const step = stepAt(st.idx); let first = null;
    step.fields.forEach((f) => {
      if (!f.id) return;
      const wrap = W.body.querySelector('.field[data-id="' + f.id + '"]'); if (!wrap) return;
      wrap.classList.remove("error");
      if (f.show && !f.show(st.data)) return;
      const v = readField(f); st.data[f.id] = v;
      let msg = "";
      const empty = v === "" || v === undefined || v === false || (Array.isArray(v) && !v.length);
      if (f.req && empty) msg = f.type === "agree" ? "Necesitas aceptar para continuar" : "Este dato es necesario";
      else if (!empty && f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = "Escribe un correo válido";
      else if (!empty && f.type === "tel" && String(v).replace(/\D/g, "").length < 10) msg = "Escribe un teléfono de 10 dígitos";
      else if (!empty && f.type === "number") {
        const x = parseFloat(v);
        if (isNaN(x) || (f.min != null && x < f.min) || (f.max != null && x > f.max)) msg = "Revisa el valor" + (f.min != null && f.max != null ? " (entre " + f.min + " y " + f.max + ")" : "");
      } else if (!empty && f.type === "text" && f.id === "firma" && String(v).trim().length < 5) msg = "Escribe tu nombre completo";
      if (msg) { wrap.classList.add("error"); wrap.querySelector(".err").textContent = msg; if (!first) first = wrap; }
    });
    if (first) { first.scrollIntoView({ behavior: "smooth", block: "center" }); const inp = first.querySelector("input,textarea,select"); if (inp) setTimeout(() => inp.focus({ preventScroll: true }), 300); toast("Completa los campos marcados"); return false; }
    return true;
  }

  /* ---------- Navegación ---------- */
  function goNext() {
    if (!validate()) return;
    saveDraft();
    const step = stepAt(st.idx);
    if (step.final) return send("normal");
    const t = S.triaje(st.data, st.pkg.formulario);
    if (t.nivel === "rojo") return renderDerivacion(t);
    st.idx++; saveDraft(); renderStep();
  }
  function goBack() { if (st.idx > 0) { st.idx--; renderStep(); } }

  /* ---------- Derivación (semáforo rojo) ---------- */
  function renderDerivacion(t) {
    st.mode = "derivacion";
    const nombre = (st.data.nombre || "").split(" ")[0] || "";
    W.stepName.textContent = "Tu seguridad primero";
    W.progress.innerHTML = "";
    W.body.innerHTML = '<div class="callout rojo">' + icon("shield") + "<div><b>" + (nombre ? "Hola, " + esc(nombre) + ". " : "") + "Gracias por tu confianza</b>" +
      "Revisando tus respuestas, vemos una condición en la que la consulta en línea se queda corta. Por tu seguridad y para darte un seguimiento como debe ser, este tipo de casos conviene verlos de forma presencial o con un equipo médico que te revise de cerca, y no solo a distancia por app.</div></div>" +
      '<div class="sumcard"><div class="lbl" style="font-weight:700;margin-bottom:6px">Lo que detectamos</div><ul style="margin:0;padding-left:18px;color:var(--ink2)">' + t.rojos.map((r) => "<li>" + esc(r) + "</li>").join("") + "</ul></div>" +
      '<p style="color:var(--ink2)">No es por rechazarte: es justamente porque queremos que te cuides bien. <b>No se realiza ningún cobro.</b> Si lo deseas, puedes enviarnos tu información y el L.N. la revisará para orientarte sobre a dónde acudir. También puedes revisar tus respuestas por si hubo un error al capturar.</p>' +
      '<div class="row-btns"><button class="btn btn-ghost" id="dvBack">' + icon("back") + ' Revisar mis respuestas</button><button class="btn btn-primary" id="dvSend">Enviar mi información para orientación ' + icon("arrow") + "</button></div>";
    W.foot.hidden = true;
    st.triajeRojo = t;
    W.root.scrollTop = 0;
  }

  /* ---------- Envío ---------- */
  function setBusy() {
    W.foot.hidden = true; W.progress.innerHTML = ""; W.stepName.textContent = "Enviando";
    W.body.innerHTML = '<div class="done"><div class="spin"></div><h2 style="justify-content:center">Enviando tu expediente…</h2><p class="wz-intro">Estamos armando tu PDF y enviándolo. No cierres esta ventana.</p></div>';
  }

  async function send(kind) {
    const pkg = st.pkg, d = st.data, derivacion = kind === "derivacion";
    st.lastKind = kind; st.mode = "enviando";
    setBusy();
    const t = S.triaje(d, pkg.formulario);
    const folio = makeFolio(), now = new Date();
    const fechaTxt = now.toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short" });
    const fixed = pkg.tipoPrecio === "fijo";
    let pago = null, estado, montoCorreo = "—";
    if (derivacion) estado = "DERIVACIÓN: solicitud de orientación sin contratación (semáforo rojo). Sin cobro.";
    else if (fixed) {
      const total = window.NM_PRECIO(pkg), n = Number(pkg.parcialidades) || 1, parcial = d.pago_forma === "parcial" && n > 1;
      const dep = parcial ? Math.ceil(total / n) : total;
      const dep_ok = bankReady() && d.pago_estado === "depositado";
      pago = { montoTxt: money(total) + " MXN" + (pkg.promo && pkg.promo.activa ? " (" + (pkg.promo.nota || "precio promocional") + ")" : ""), formaTxt: parcial ? n + " pagos (50 % al iniciar y 50 % antes de la segunda consulta)" : "Pago único", deposito: dep, fecha: dep_ok ? d.pago_fecha : "", banco: dep_ok ? d.pago_banco : "", ref: dep_ok ? d.pago_ref : "" };
      estado = "Expediente completo · " + (dep_ok ? "Depósito reportado por el paciente (por confirmar)" : "Depósito pendiente (el paciente lo realizará en 24 h)");
      montoCorreo = money(dep) + " MXN" + (parcial ? " (1.º de " + n + " pagos)" : "");
    } else estado = "Expediente completo · Pendiente de cotización";

    let built;
    try {
      built = window.NM_PDF.build({ negocio: CFG.negocio, pkg, steps: st.steps, data: d, triaje: t, folio, fechaTxt, estado, pago, derivacion });
    } catch (err) { console.error(err); return renderError("No pudimos generar tu PDF. Intenta de nuevo.", null, folio); }
    st.last = { blob: built.blob, filename: built.filename, folio };

    const fd = new FormData();
    const dest = (CFG.envio && CFG.envio.correoDestino) || CFG.negocio.correo;
    fd.append("_subject", "Nutrimental · " + (derivacion ? "DERIVACIÓN" : pkg.nombre) + " · " + d.nombre + " · Semáforo " + t.nivel.toUpperCase() + " · " + folio);
    fd.append("_template", "table"); fd.append("_captcha", "false"); fd.append("_honey", "");
    fd.append("email", d.correo);
    fd.append("Folio", folio); fd.append("Paciente", d.nombre); fd.append("Teléfono", d.telefono);
    fd.append("Paquete", pkg.nombre); fd.append("Semáforo", t.nivel.toUpperCase()); fd.append("Estado", estado);
    if (fixed && !derivacion) { fd.append("Monto de este depósito", montoCorreo); if (pago.ref) fd.append("Referencia de depósito", pago.ref); }
    fd.append("Expediente (PDF)", "Adjunto en este correo");
    fd.append("expediente", built.blob, built.filename);
    if (fixed && !derivacion && st.comp) {
      try {
        const cf = await shrinkFile(st.comp);
        fd.append("Comprobante de depósito", "Adjunto en este correo");
        fd.append("comprobante", cf, cf.name);
      } catch (e) { console.warn("comprobante no adjuntado", e); }
    }

    const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 45000);
    try {
      await fetch("https://formsubmit.co/" + dest, { method: "POST", body: fd, mode: "no-cors", signal: ctl.signal });
      clearTimeout(to);
      clearDraft();
      renderDone(derivacion, t);
    } catch (err) {
      clearTimeout(to); console.error(err);
      renderError("No pudimos enviar tu expediente automáticamente (revisa tu conexión).", built, folio);
    }
  }

  function dlButton(label) { return '<button class="btn btn-ghost" id="dlPdf">' + icon("download") + " " + label + "</button>"; }

  function renderDone(derivacion, t) {
    st.mode = "listo"; W.foot.hidden = true; W.progress.innerHTML = ""; W.stepName.textContent = "¡Listo!";
    const nombre = (st.data.nombre || "").split(" ")[0];
    const fixed = st.pkg.tipoPrecio === "fijo";
    const steps = derivacion
      ? ["<b>Revisamos tu información</b> con cuidado.", "<b>Te contactamos por correo</b> para orientarte sobre dónde recibir valoración presencial.", "Si tu situación cambia o tus estudios se estabilizan, aquí estaremos."]
      : fixed
        ? ["<b>Revisamos tu expediente</b> (máximo 1 día hábil).", "<b>Confirmamos tu depósito</b>" + (CFG.pago && CFG.pago.clabe && st.data.pago_estado === "pendiente" ? ": recuerda realizarlo en las próximas 24 h." : "."), "<b>Te damos de alta en Nutrimind</b> y coordinamos tu primera videollamada."]
        : ["<b>Revisamos tu expediente</b> con detalle.", "<b>Te enviamos la cotización</b> de tu plan a tu correo.", "Al confirmar, <b>te damos de alta en Nutrimind</b> y agendamos tu videollamada."];
    W.body.innerHTML = '<div class="done"><div class="big">' + icon("check") + "</div><h2 style=\"justify-content:center\">" + (derivacion ? "Recibimos tu información" : "¡Listo, " + esc(nombre) + "!") + '</h2><div class="folio">Folio ' + esc(st.last.folio) + '</div><p class="wz-intro">' + (derivacion ? "Gracias por la confianza." : "Tu expediente llegó a Nutrimental.") + '</p><ol class="nextsteps">' + steps.map((s, i) => '<li><span class="n">' + (i + 1) + "</span><div>" + s + "</div></li>").join("") + '</ol><div class="row-btns">' + dlButton("Descargar copia de mi expediente (PDF)") + '<button class="btn btn-primary" id="doneClose">Volver al inicio</button></div><p class="hint" style="margin-top:16px">Si en 1 día hábil no recibes noticias, escríbenos a ' + esc(CFG.negocio.correo) + " con tu folio.</p></div>";
    W.root.scrollTop = 0;
  }

  function renderError(msg, built, folio) {
    st.mode = "error"; W.foot.hidden = true; W.progress.innerHTML = ""; W.stepName.textContent = "Algo falló";
    const mail = CFG.negocio.correo;
    const href = "mailto:" + encodeURIComponent(mail) + "?subject=" + encodeURIComponent("Expediente Nutrimental " + (folio || "") + " · " + (st.data.nombre || "")) + "&body=" + encodeURIComponent("Hola, adjunto mi expediente en PDF.\n\nPaquete: " + st.pkg.nombre);
    W.body.innerHTML = '<div class="callout amarillo">' + icon("alert") + "<div><b>" + esc(msg) + "</b>Tus respuestas siguen guardadas. Puedes reintentar, o descargar tu PDF y enviarlo por correo a <b>" + esc(mail) + "</b>.</div></div>" +
      '<div class="row-btns"><button class="btn btn-primary" id="retrySend">Reintentar envío</button>' + (built ? dlButton("Descargar mi PDF") : "") + (built ? '<a class="btn btn-ghost" href="' + href + '">' + icon("arrow") + " Abrir correo</a>" : "") + "</div>";
    st.last = built ? { blob: built.blob, filename: built.filename, folio } : st.last;
  }

  /* ---------- Apertura / cierre ---------- */
  function open(pkgId) {
    const pkg = CFG.paquetes.find((p) => p.id === pkgId); if (!pkg) return;
    st = { pkg, steps: S.buildSteps(pkg.formulario), data: {}, idx: 0, mode: "form", hadDraft: false };
    try {
      const raw = localStorage.getItem(draftKey(pkg.id));
      if (raw) { const o = JSON.parse(raw); if (o && o.data && Object.keys(o.data).length) { st.data = o.data; st.idx = Math.min(o.idx || 0, st.steps.length); st.hadDraft = true; } }
    } catch (e) {}
    if (!st.data.objetivo) st.data.objetivo = { apto: "examen", peso: "peso", cronica: "cronica" }[pkg.formulario] || "";
    W.root.hidden = false; document.body.classList.add("lock");
    W.root.scrollTop = 0; renderStep();
  }
  function close() { W.root.hidden = true; document.body.classList.remove("lock"); st = null; }

  /* ---------- Eventos ---------- */
  W.body.addEventListener("input", onInput);
  W.body.addEventListener("change", onInput);
  W.next.addEventListener("click", goNext);
  W.back.addEventListener("click", goBack);
  W.close.addEventListener("click", () => { if (st && st.mode === "enviando") return; close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !W.root.hidden) close(); });
  W.body.addEventListener("click", (e) => {
    const t = e.target.closest("button,a"); if (!t) return;
    if (t.id === "resetDraft") { clearDraft(); st.data = {}; st.hadDraft = false; st.idx = 0; st.data.objetivo = { apto: "examen", peso: "peso", cronica: "cronica" }[st.pkg.formulario] || ""; renderStep(); }
    else if (t.id === "dvBack") { renderStep(); }
    else if (t.id === "dvSend") { send("derivacion"); }
    else if (t.id === "dlPdf" && st.last) { const a = document.createElement("a"); a.href = URL.createObjectURL(st.last.blob); a.download = st.last.filename; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
    else if (t.id === "doneClose") { close(); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else if (t.id === "retrySend") { send(st.lastKind || "normal"); }
    else if (t.dataset.copy) { navigator.clipboard && navigator.clipboard.writeText(t.dataset.copy).then(() => toast("Copiado")).catch(() => toast("No se pudo copiar")); }
  });

  window.NM_WIZARD = { open, close };
})();
