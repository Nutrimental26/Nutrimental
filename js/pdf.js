/* ============================================================
   NUTRIMENTAL · GENERADOR DE PDF (en el navegador, con jsPDF)
   ============================================================ */
(function () {
  const C = {
    green: [27, 107, 52], green2: [93, 177, 69], teal: [30, 136, 168],
    ink: [24, 38, 28], gray: [100, 112, 104], line: [214, 226, 214], bg: [243, 249, 241],
    verde: [46, 160, 67], amarillo: [217, 150, 12], rojo: [200, 48, 48],
  };

  function clean(s) {
    if (s === undefined || s === null) return "";
    return String(s)
      .replace(/≥/g, ">=").replace(/≤/g, "<=").replace(/→/g, "->")
      .replace(/[−]/g, "-").replace(/[ ]/g, " ").replace(/‑/g, "-")
      .replace(/[^\x09\x0A\x20-\x7E\xA0-\xFF–—‘’“”•…€]/g, "?");
  }

  function fmtMXN(v) {
    return "$" + Number(v).toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " MXN";
  }

  function build(o) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
    const W = 210, H = 297, M = 15, CW = W - 2 * M;
    let y = 0;
    const d = o.data, S = window.NM_SCHEMA;

    const setC = (c) => doc.setTextColor(c[0], c[1], c[2]);
    const fill = (c) => doc.setFillColor(c[0], c[1], c[2]);
    const draw = (c) => doc.setDrawColor(c[0], c[1], c[2]);

    function footer(page, total) {
      doc.setPage(page);
      draw(C.line); doc.setLineWidth(0.2); doc.line(M, H - 14, W - M, H - 14);
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); setC(C.gray);
      doc.text(clean("Nutrimental · Documento confidencial (NOM-004-SSA3-2012) · Folio " + o.folio), M, H - 9.5);
      doc.text("Página " + page + " de " + total, W - M, H - 9.5, { align: "right" });
    }

    function need(h) {
      if (y + h > H - 20) { doc.addPage(); y = M + 2; }
    }

    function sectionTitle(text) {
      need(16);
      y += 3;
      fill(C.green); doc.roundedRect(M, y, CW, 7.5, 1.5, 1.5, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(255, 255, 255);
      doc.text(clean(text.toUpperCase()), M + 3, y + 5.2);
      y += 10.5;
    }

    function subTitle(text) {
      need(10);
      y += 1.5;
      doc.setFont("helvetica", "bold"); doc.setFontSize(9); setC(C.teal);
      doc.text(clean(text), M, y + 3);
      draw(C.line); doc.setLineWidth(0.2); doc.line(M, y + 4.5, W - M, y + 4.5);
      y += 7;
    }

    function row(label, value) {
      if (value === undefined || value === null || value === "") return;
      const LW = 62, VW = CW - LW - 2;
      doc.setFont("helvetica", "bold"); doc.setFontSize(8.6);
      const l = doc.splitTextToSize(clean(label), LW - 2);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9);
      const v = doc.splitTextToSize(clean(value), VW);
      const lines = Math.max(l.length, v.length);
      const h = lines * 4.3 + 2.2;
      need(h);
      doc.setFont("helvetica", "bold"); doc.setFontSize(8.6); setC(C.gray);
      doc.text(l, M, y + 3.6);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); setC(C.ink);
      doc.text(v, M + LW, y + 3.6);
      draw(C.line); doc.setLineWidth(0.1); doc.line(M, y + h - 0.2, W - M, y + h - 0.2);
      y += h;
    }

    /* ---------- Encabezado ---------- */
    try { doc.addImage(window.NM_LOGO_PDF, "JPEG", M, 10, 34, 29.4); } catch (e) {}
    doc.setFont("helvetica", "bold"); doc.setFontSize(15); setC(C.green);
    doc.text("EXPEDIENTE CLÍNICO NUTRICIONAL", W - M, 19, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); setC(C.gray);
    doc.text("Solicitud de servicio en línea · App Nutrimind", W - M, 25, { align: "right" });
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); setC(C.ink);
    doc.text("Folio: " + o.folio, W - M, 32, { align: "right" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); setC(C.gray);
    doc.text("Recibido: " + o.fechaTxt, W - M, 37, { align: "right" });
    y = 44;

    /* ---------- Semáforo ---------- */
    const t = o.triaje;
    const col = C[t.nivel];
    const titulos = { verde: "SEMÁFORO VERDE · Entra directo a consulta virtual", amarillo: "SEMÁFORO AMARILLO · Entra con condición", rojo: "SEMÁFORO ROJO · Derivar con tacto a valoración presencial" };
    const motivos = [...t.rojos, ...t.amarillos];
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.8);
    const mLines = motivos.flatMap((m) => doc.splitTextToSize("• " + clean(m), CW - 10));
    const bh = 10 + mLines.length * 4.1 + (motivos.length ? 2 : 0);
    fill(col); doc.roundedRect(M, y, CW, bh, 2, 2, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.setTextColor(255, 255, 255);
    doc.text(clean(titulos[t.nivel]), M + 4, y + 6.4);
    if (mLines.length) {
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.8);
      doc.text(mLines, M + 4, y + 11.4);
    }
    y += bh + 3;

    /* ---------- Resumen ---------- */
    sectionTitle("Resumen de la solicitud");
    row("Paciente", d.nombre);
    row("Edad / sexo", (d.edad ? d.edad + " años" : "") + (d.sexo ? " · " + (d.sexo === "mujer" ? "Mujer" : "Hombre") : ""));
    row("Contacto", [d.telefono, d.correo].filter(Boolean).join(" · "));
    row("Ciudad", d.ciudad);
    row("Paquete elegido", o.pkg.nombre + (o.pkg.etiqueta ? " (" + o.pkg.etiqueta + ")" : ""));
    const imc = S.imc(d);
    if (!isNaN(imc)) row("Peso / talla / IMC", d.peso + " kg · " + d.estatura + " cm · IMC " + imc.toFixed(1) + " (" + S.clasifIMC(imc) + ")");
    row("Estado del trámite", o.estado);

    /* ---------- Pago ---------- */
    if (o.pago) {
      sectionTitle("Pago");
      row("Monto del paquete", o.pago.montoTxt);
      row("Forma de pago", o.pago.formaTxt);
      row("Monto de este depósito", o.pago.deposito !== undefined ? fmtMXN(o.pago.deposito) : "");
      row("Fecha del depósito", o.pago.fecha);
      row("Banco de origen", o.pago.banco);
      row("Referencia / rastreo / folio", o.pago.ref);
      row("Estatus", "PAGO POR CONFIRMAR (verificar en banco)");
    } else if (o.pkg.tipoPrecio === "evaluacion" && !o.derivacion) {
      sectionTitle("Cotización");
      row("Precio", "Según evaluación del expediente (pendiente de cotizar)");
    }

    /* ---------- Secciones del expediente ---------- */
    o.steps.forEach((st) => {
      const rows = st.fields.filter((f) => f.id && f.type !== "calc" && (!f.show || f.show(d)));
      const printable = rows.filter((f) => S.valorLegible(f, d) !== "");
      if (!printable.length) return;
      sectionTitle(st.title);
      st.fields.forEach((f) => {
        if (f.type === "heading") { pendingHeading = f.text; return; }
        if (!f.id || f.type === "calc" || (f.show && !f.show(d))) return;
        const v = S.valorLegible(f, d);
        if (v === "") return;
        if (pendingHeading) { subTitle(pendingHeading); pendingHeading = null; }
        row(f.label, v);
      });
      pendingHeading = null;
    });
    var pendingHeading;

    /* ---------- Consentimiento ---------- */
    sectionTitle("Consentimiento informado");
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.4); setC(C.gray);
    const consent = o.steps[o.steps.length - 1].consentText || [];
    consent.forEach((p) => {
      const ls = doc.splitTextToSize("• " + clean(p), CW);
      need(ls.length * 3.8 + 1.5);
      doc.text(ls, M, y + 3);
      y += ls.length * 3.8 + 1.5;
    });
    y += 2;
    need(22);
    draw(C.line); doc.setLineWidth(0.3); doc.line(M, y + 12, M + 80, y + 12);
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); setC(C.ink);
    doc.text(clean(d.firma || ""), M, y + 10);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); setC(C.gray);
    doc.text("Firma electrónica (nombre escrito por el paciente) · " + clean(o.fechaTxt), M, y + 16);
    y += 20;

    /* ---------- Uso interno ---------- */
    need(30);
    fill(C.bg); doc.roundedRect(M, y, CW, 24, 2, 2, "F");
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); setC(C.green);
    doc.text("Para uso del profesional", M + 4, y + 6);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8.2); setC(C.gray);
    const nota = doc.splitTextToSize(clean("Dar de alta en Nutrimind solo tras revisar este expediente" + (o.pago ? " y confirmar el depósito" : "") + ". Notas SOAP de seguimiento en el expediente interno. " + o.negocio.profesional + " · Cédula Profesional " + o.negocio.cedula + "."), CW - 8);
    doc.text(nota, M + 4, y + 11);
    y += 28;

    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) footer(i, total);

    const safe = clean(d.nombre || "paciente").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "_").slice(0, 40);
    return { doc, blob: doc.output("blob"), filename: "Expediente_Nutrimental_" + safe + "_" + o.folio + ".pdf" };
  }

  window.NM_PDF = { build, fmtMXN };
})();
