/* ============================================================
   NUTRIMENTAL · ESQUEMA DEL EXPEDIENTE Y SEMÁFORO DE TRIAJE
   Basado en los protocolos de expediente clínico adjuntos
   (ABCD, candados de seguridad, banderas rojas, SOAP-ready).
   ============================================================ */
(function () {
  const SN = [["si", "Sí"], ["no", "No"]];
  const has = (d, k, v) => Array.isArray(d[k]) && d[k].includes(v);
  const isYes = (d, k) => d[k] === "si";

  /* ---------- Campos reutilizables ---------- */
  const F_DATOS = (objOpts) => ({
    id: "datos", title: "Tus datos", icon: "user",
    intro: "Lo básico para abrir tu expediente. Toma menos de 2 minutos.",
    fields: [
      { id: "nombre", label: "Nombre completo", type: "text", req: true, ph: "Como aparece en tu identificación", autocomplete: "name" },
      { id: "telefono", label: "WhatsApp o teléfono", type: "tel", req: true, ph: "10 dígitos", autocomplete: "tel" },
      { id: "correo", label: "Correo electrónico", type: "email", req: true, ph: "tucorreo@ejemplo.com", autocomplete: "email" },
      { id: "edad", label: "Edad", type: "number", req: true, min: 14, max: 100, unit: "años", half: true },
      { id: "sexo", label: "Sexo", type: "radio", req: true, opts: [["mujer", "Mujer"], ["hombre", "Hombre"]], half: true, hint: "Lo usamos para interpretar tus medidas y laboratorios." },
      { id: "ciudad", label: "Ciudad y estado donde vives", type: "text", req: true, ph: "Ej. Chihuahua, Chih.", hint: "Define tu horario y si algún día necesitas opción presencial." },
      { id: "ocupacion", label: "Ocupación o puesto", type: "text", ph: "Ej. Operador de tractocamión, oficina, enfermería…" },
      { id: "peso", label: "Peso actual", type: "number", req: true, min: 30, max: 300, step: "0.1", unit: "kg", half: true },
      { id: "estatura", label: "Estatura", type: "number", req: true, min: 120, max: 230, unit: "cm", half: true },
      { id: "imc", label: "Tu IMC", type: "calc" },
      { id: "objetivo", label: "¿Cuál es tu objetivo principal ahora?", type: "radio", req: true, stack: true, opts: objOpts },
      { id: "objetivo_otro", label: "Cuéntanos tu objetivo", type: "text", show: (d) => d.objetivo === "otro" },
    ],
  });

  const OBJ_ALL = [
    ["peso", "Control de peso (obesidad grado I o II, sin complicaciones graves)"],
    ["examen", "Bajar triglicéridos, colesterol o glucosa para examen médico o licencia (SICT / laboral)"],
    ["turnos", "Ordenar mi alimentación por turnos nocturnos o rol de turnos"],
    ["digestivo", "Salud digestiva (gastritis, colitis, estreñimiento)"],
    ["cronica", "Manejo nutricional de una enfermedad crónica"],
    ["otro", "Otro"],
  ];

  const F_SEGURIDAD = {
    id: "seguridad", title: "Tu seguridad primero", icon: "shield",
    intro: "Responde con total honestidad. La consulta nutricional virtual está diseñada para cuadros estables; si presentas alguna condición compleja, te orientaremos sobre el manejo presencial adecuado.",
    fields: [
      {
        id: "condiciones", label: "¿Tienes diagnóstico o tratamiento médico por alguna de estas condiciones?", type: "checks", req: true, stack: true, exclusive: "ninguna",
        hint: "Marca todas las que apliquen.",
        opts: [
          ["diabetes", "Diabetes mellitus"],
          ["renal", "Enfermedad renal (daño en riñones, insuficiencia renal o proteínas en orina)"],
          ["hta_nc", "Hipertensión no controlada, o infarto / evento vascular reciente"],
          ["hepatica", "Enfermedad hepática avanzada (cirrosis, hepatitis activa)"],
          ["embarazo", "Embarazo o lactancia"],
          ["tca_dx", "Trastorno de la conducta alimentaria diagnosticado o en tratamiento (anorexia, bulimia, atracón)"],
          ["bariatrica", "Cirugía bariátrica en los últimos 12 meses o con complicaciones"],
          ["cancer", "Cáncer activo o en tratamiento oncológico"],
          ["alarma_dig", "Sangre en heces o heces negras, pérdida de peso involuntaria (>5 % en 1 mes), dificultad para tragar o anemia sin explicar"],
          ["ninguna", "Ninguna de las anteriores"],
        ],
      },
      { id: "insulina", label: "Sobre tu diabetes: ¿usas insulina o has tenido descompensaciones recientes?", type: "yesno", req: true, show: (d) => has(d, "condiciones", "diabetes") },
      {
        id: "otros_dx", label: "¿Alguna de estas otras condiciones?", type: "checks", req: true, stack: true, exclusive: "ninguno",
        opts: [
          ["htac", "Hipertensión arterial controlada"],
          ["dislip", "Colesterol o triglicéridos altos"],
          ["prediab", "Prediabetes o glucosa alterada"],
          ["tiroides", "Problemas de tiroides"],
          ["digest", "Gastritis, colitis, reflujo o estreñimiento"],
          ["gota", "Ácido úrico alto o gota"],
          ["apnea", "Apnea del sueño diagnosticada"],
          ["ninguno", "Ninguna"],
        ],
      },
      { id: "apnea_ctrl", label: "¿Tu apnea del sueño está en tratamiento (por ejemplo CPAP) y controlada?", type: "yesno", req: true, show: (d) => has(d, "otros_dx", "apnea") },
      { id: "toma_meds", label: "¿Tomas algún medicamento de forma habitual?", type: "yesno", req: true, hint: "Incluye fármacos para bajar de peso, azúcar, lípidos, presión, tiroides o estómago." },
      { id: "meds_detalle", label: "¿Cuáles? Anota nombre, dosis y a qué hora los tomas", type: "textarea", req: true, show: (d) => isYes(d, "toma_meds"), ph: "Ej. Metformina 850 mg, 8:00 y 20:00" },
      { id: "alergias", label: "Alergias o intolerancias alimentarias", type: "textarea", req: true, ph: "Escribe «ninguna» si no tienes", rows: 2 },
      { type: "heading", text: "Tu relación con la comida", sub: "Preguntas de tamizaje. No hay respuestas buenas ni malas; nos ayudan a cuidarte." },
      { id: "tca1", label: "¿Te provocas el vómito o usas laxantes o diuréticos para controlar tu peso?", type: "yesno", req: true },
      { id: "tca2", label: "¿Sientes que pierdes el control sobre cuánto comes (atracones)?", type: "yesno", req: true },
      { id: "tca3", label: "¿Has restringido tu comida de forma extrema en el último mes o sientes miedo intenso a subir de peso?", type: "yesno", req: true },
      { id: "tca4", label: "¿Sientes que la comida domina tu vida o tus pensamientos?", type: "yesno", req: true },
    ],
  };

  const LABS_ESTADO = { id: "labs_estado", label: "¿Cuentas con estudios de laboratorio recientes (química sanguínea y/o perfil de lípidos, máximo 3 meses)?", type: "radio", req: true, stack: true, opts: [["listos", "Sí, los tengo listos para enviar"], ["viejos", "Tengo estudios de hace más de 3 meses"], ["no", "No me he hecho estudios recientemente"]] };

  const H_R24 = { type: "heading", text: "Tu alimentación de ayer", sub: "Recordatorio de 24 horas. Anota lo más honesto posible: porciones aproximadas, bebidas incluidas." };
  const R24 = [
    { id: "r24_desayuno", label: "Desayuno (hora y qué comiste)", type: "textarea", rows: 2, req: true },
    { id: "r24_colacion1", label: "Colación de media mañana", type: "textarea", rows: 2, ph: "Si no comiste, escribe «nada»" },
    { id: "r24_comida", label: "Comida", type: "textarea", rows: 2, req: true },
    { id: "r24_colacion2", label: "Colación de la tarde", type: "textarea", rows: 2, ph: "Si no comiste, escribe «nada»" },
    { id: "r24_cena", label: "Cena", type: "textarea", rows: 2, req: true },
    { id: "r24_bebidas", label: "Bebidas del día (agua, refresco, café, jugos, alcohol)", type: "textarea", rows: 2, req: true },
  ];
  const H_HAB = { type: "heading", text: "Hábitos y rutina" };
  const HABITOS = [
    { id: "hora_despierta", label: "Hora a la que despiertas", type: "time", half: true, req: true },
    { id: "hora_duerme", label: "Hora a la que te duermes", type: "time", half: true, req: true },
    { id: "ansiedad", label: "¿Comes por ansiedad, estrés o aburrimiento?", type: "radio", req: true, opts: [["casi_nunca", "Casi nunca"], ["a_veces", "A veces"], ["frecuente", "Con frecuencia"]] },
    { id: "alcohol", label: "Consumo de alcohol", type: "radio", req: true, opts: [["nunca", "Nunca"], ["ocasional", "Ocasional"], ["semanal", "1–2 veces por semana"], ["frecuente", "3 o más por semana"]] },
    { id: "tabaco", label: "Tabaco", type: "radio", req: true, opts: [["no", "No fumo"], ["si", "Fumo"], ["exfumador", "Exfumador"]] },
    { id: "suplementos", label: "Suplementos o productos naturistas que uses", type: "text", ph: "Escribe «ninguno» si no usas" },
  ];

  const LAB_FIELDS = (ext) => [
    { type: "heading", text: "Tus laboratorios", sub: "Captura solo los que tengas. Si no los tienes a la mano, déjalos en blanco; los pediremos antes de iniciar." },
    { id: "lab_fecha", label: "Fecha de tus estudios", type: "date", show: (d) => d.labs_estado && d.labs_estado !== "no" },
    { id: "glucosa", label: "Glucosa en ayuno", type: "number", unit: "mg/dL", half: true, min: 20, max: 700 },
    { id: "hba1c", label: "Hemoglobina glucosilada (HbA1c)", type: "number", unit: "%", step: "0.1", half: true, min: 3, max: 20 },
    { id: "col_total", label: "Colesterol total", type: "number", unit: "mg/dL", half: true },
    { id: "ldl", label: "Colesterol LDL", type: "number", unit: "mg/dL", half: true },
    { id: "hdl", label: "Colesterol HDL", type: "number", unit: "mg/dL", half: true },
    { id: "tg", label: "Triglicéridos", type: "number", unit: "mg/dL", half: true },
    { id: "acido_urico", label: "Ácido úrico", type: "number", unit: "mg/dL", step: "0.1", half: true },
    { id: "creatinina", label: "Creatinina", type: "number", unit: "mg/dL", step: "0.01", half: true },
    ...(ext ? [
      { id: "tfg", label: "Filtración glomerular (TFG)", type: "number", unit: "mL/min", half: true },
      { id: "urea", label: "Urea", type: "number", unit: "mg/dL", half: true },
      { id: "alt", label: "ALT (TGP)", type: "number", unit: "U/L", half: true },
      { id: "ast", label: "AST (TGO)", type: "number", unit: "U/L", half: true },
    ] : []),
  ];

  const MEDIDAS = (opts) => [
    { type: "heading", text: "Tus medidas" },
    { id: "cintura", label: "Circunferencia de cintura", type: "number", unit: "cm", half: true, req: !!opts.cinturaReq, hint: "Mide a la altura del ombligo, de pie y sin apretar." },
    { id: "cadera", label: "Circunferencia de cadera", type: "number", unit: "cm", half: true },
    { id: "gct", label: "% de grasa corporal (si lo conoces)", type: "number", unit: "%", step: "0.1", half: true, hint: "Por bioimpedancia, si te lo han medido." },
    { id: "pa_sis", label: "Presión arterial habitual: sistólica (alta)", type: "number", unit: "mmHg", half: true, min: 70, max: 260 },
    { id: "pa_dia", label: "Presión arterial habitual: diastólica (baja)", type: "number", unit: "mmHg", half: true, min: 40, max: 160 },
    ...(opts.extra || []),
  ];

  /* ---------- Módulos por paquete ---------- */
  const MOD = {
    consulta: [
      {
        id: "alimentacion", title: "Tu alimentación", icon: "apple",
        intro: "Con esto armamos tu plan base en Nutrimind.",
        fields: [
          { id: "antec_fam", label: "Antecedentes familiares (diabetes, hipertensión, infartos, cáncer…)", type: "textarea", rows: 2, ph: "Escribe «ninguno» si no los conoces" },
          LABS_ESTADO,
          H_R24, ...R24, H_HAB, ...HABITOS,
        ],
      },
    ],
    apto: [
      {
        id: "examen", title: "Tu examen o licencia", icon: "badge",
        intro: "Este paquete es para quienes tienen una fecha límite real. Con estos datos planeamos las semanas.",
        fields: [
          { id: "puesto", label: "Puesto de trabajo", type: "text", req: true, ph: "Ej. Operador de tractocamión doble remolque" },
          { id: "tipo_eval", label: "Tipo de evaluación", type: "radio", req: true, stack: true, opts: [["sict", "Licencia Federal de Conductor (SICT): renovación o refrendo"], ["ocupacional", "Examen médico ocupacional de mi empresa"], ["checkup", "Check-up laboral o ejecutivo"], ["otro", "Otro"]] },
          { id: "semanas_examen", label: "¿En cuántas semanas es tu cita o evaluación?", type: "radio", req: true, opts: [["lt2", "Menos de 2 semanas"], ["2_4", "2 a 4 semanas"], ["4_6", "4 a 6 semanas"], ["gt6", "Más de 6 semanas"]] },
          { id: "fecha_examen", label: "Fecha aproximada de tu examen", type: "date" },
          { id: "motivo_eval", label: "Motivo exacto de la evaluación", type: "textarea", rows: 2, req: true, ph: "Ej. Refrendo de licencia federal a 2 años; me detectaron triglicéridos altos" },
          { type: "heading", text: "Tu ruta y tu turno" },
          { id: "km", label: "Kilómetros o horas que manejas por semana", type: "text", ph: "Ej. 3,500 km / 60 h" },
          { id: "paradas", label: "¿Dónde sueles comer en ruta?", type: "textarea", rows: 2, ph: "Fondas, paraderos, Oxxo, gasolineras, comedor industrial…", req: true },
          { id: "hielera", label: "¿Cuentas con hielera o termo en la unidad?", type: "yesno", req: true },
          { id: "turno_noct", label: "¿Trabajas de noche o con turnos rotativos?", type: "yesno", req: true },
          { id: "horario_sueno", label: "Horario real en el que duermes (ej. 8:00 a 15:00)", type: "text", show: (d) => isYes(d, "turno_noct"), req: true },
        ],
      },
      {
        id: "estudios", title: "Estudios y medidas", icon: "flask",
        intro: "Valores de laboratorio y medidas para fijar tu punto de partida y tus metas.",
        fields: [
          LABS_ESTADO, ...LAB_FIELDS(false), ...MEDIDAS({}),
          { type: "heading", text: "Tu alimentación en ruta" },
          { id: "farmacos_apto", label: "Medicamentos para presión, azúcar o colesterol (con dosis y horario)", type: "textarea", rows: 2, ph: "Escribe «ninguno» si no tomas" },
          { id: "refrescos", label: "Refrescos o jugos azucarados al día", type: "radio", req: true, opts: [["0", "Ninguno"], ["1", "1"], ["2_3", "2 a 3"], ["4", "4 o más"]] },
          { id: "embutidos", label: "Embutidos, sopas instantáneas, cecina o botanas saladas", type: "radio", req: true, opts: [["rara", "Rara vez"], ["algunas", "Algunas veces por semana"], ["casi_diario", "Casi todos los días"]] },
          { id: "alcohol", label: "Consumo de alcohol", type: "radio", req: true, opts: [["nunca", "Nunca"], ["ocasional", "Ocasional"], ["semanal", "1–2 veces por semana"], ["frecuente", "3 o más por semana"]] },
          { id: "anamnesis", label: "Cuéntanos cómo es un día típico de comida", type: "textarea", rows: 3, req: true, ph: "Desayuno, comida, cena y lo que picas entre comidas" },
        ],
      },
    ],
    peso: [
      {
        id: "medidas", title: "Tus medidas", icon: "ruler",
        intro: "Punto de partida para calcular tu plan y medir tu avance semana a semana.",
        fields: [
          ...MEDIDAS({ cinturaReq: true, extra: [
            { id: "peso_habitual", label: "Peso en el que te has mantenido más tiempo", type: "number", unit: "kg", step: "0.1", half: true },
            { id: "peso_meta", label: "Peso al que te gustaría llegar", type: "number", unit: "kg", step: "0.1", half: true },
          ] }),
          LABS_ESTADO, ...LAB_FIELDS(false),
        ],
      },
      {
        id: "historia_peso", title: "Tu historia con el peso", icon: "heart",
        intro: "Sin juicios: entender qué ha pasado antes nos permite no repetirlo.",
        fields: [
          { id: "dietas_previas", label: "Dietas o planes que hayas intentado y cómo te fue", type: "textarea", rows: 3, req: true },
          { id: "rebote", label: "¿Has tenido efecto rebote (recuperar el peso perdido)?", type: "yesno", req: true },
          { id: "anorexigenicos", label: "¿Has usado pastillas, inyecciones o suplementos «milagro» para bajar de peso?", type: "yesno", req: true },
          { id: "anorex_detalle", label: "¿Cuáles y hace cuánto?", type: "text", show: (d) => isYes(d, "anorexigenicos"), req: true },
          { id: "antec_fam", label: "Antecedentes familiares (diabetes, hipertensión, infartos…)", type: "textarea", rows: 2, ph: "Escribe «ninguno» si no los conoces" },
          H_R24, ...R24, H_HAB, ...HABITOS,
        ],
      },
    ],
    cronica: [
      {
        id: "diagnostico", title: "Diagnóstico y tratamiento", icon: "stetho",
        intro: "Este paquete se cotiza después de revisar tu expediente. Entre más completo, mejor y más seguro tu plan.",
        fields: [
          { id: "dx_principal", label: "¿Qué diagnóstico(s) médico(s) tienes y desde cuándo?", type: "textarea", rows: 3, req: true, ph: "Ej. Diabetes tipo 2 desde 2019; hipertensión desde 2021" },
          { id: "medico", label: "Médico que te atiende (nombre y especialidad)", type: "text", req: true },
          { id: "ultimo_control", label: "Fecha de tu última consulta médica", type: "date" },
          { id: "farmacos", label: "¿Tomas alguno de estos medicamentos?", type: "checks", stack: true, req: true, exclusive: "ninguno", opts: [
            ["ibp", "Antiácidos o protectores gástricos (omeprazol, pantoprazol, magaldrato)"],
            ["corticoides", "Corticoides (prednisona, meticorten)"],
            ["hipogluc", "Hipoglucemiantes orales (metformina, sulfonilureas…)"],
            ["insulina", "Insulina"],
            ["antihta", "Antihipertensivos o diuréticos"],
            ["inmuno", "Inmunosupresores (azatioprina, ciclosporina)"],
            ["estatinas", "Estatinas o fibratos"],
            ["levotiroxina", "Levotiroxina u hormona tiroidea"],
            ["anticoag", "Anticoagulantes"],
            ["otros", "Otros"],
            ["ninguno", "Ninguno"],
          ] },
          { id: "farmacos_detalle", label: "Nombre, dosis y horario de cada medicamento", type: "textarea", rows: 3, req: true, ph: "Ej. Losartán 50 mg, 8:00 · Atorvastatina 20 mg, 21:00" },
          { id: "equipo", label: "¿Cuentas con estos equipos en casa?", type: "checks", opts: [["glucometro", "Glucómetro"], ["baumanometro", "Baumanómetro"], ["bascula", "Báscula"], ["cinta", "Cinta métrica"]] },
          { id: "hora_despierta", label: "Hora a la que despiertas", type: "time", half: true, req: true },
          { id: "hora_duerme", label: "Hora a la que te duermes", type: "time", half: true, req: true },
        ],
      },
      {
        id: "estudios", title: "Estudios y medidas", icon: "flask",
        intro: "Evaluación bioquímica y antropométrica para tu expediente.",
        fields: [
          LABS_ESTADO, ...LAB_FIELDS(true),
          ...MEDIDAS({ extra: [
            { id: "fc", label: "Frecuencia cardiaca en reposo", type: "number", unit: "lpm", half: true },
            { id: "peso_habitual", label: "Peso habitual", type: "number", unit: "kg", step: "0.1", half: true },
          ] }),
          { type: "heading", text: "Clínica y digestión" },
          { id: "edema", label: "¿Notas hinchazón en tobillos o piernas?", type: "yesno", req: true },
          { id: "bristol", label: "¿Cómo son tus evacuaciones habituales? (Escala de Bristol)", type: "radio", stack: true, req: true, opts: [["1_2", "Tipos 1–2: duras, en bolitas o grumosas (estreñimiento)"], ["3_4", "Tipos 3–4: normales"], ["5_6", "Tipos 5–6: blandas"], ["7", "Tipo 7: líquidas"]] },
          { id: "digestivo", label: "Síntomas digestivos frecuentes", type: "checks", exclusive: "ninguno", opts: [["pirosis", "Agruras o reflujo"], ["distension", "Distensión o gases"], ["dispepsia", "Indigestión"], ["estrenimiento", "Estreñimiento"], ["diarrea", "Diarrea"], ["ninguno", "Ninguno"]] },
        ],
      },
      {
        id: "habitos", title: "Alimentación y hábitos", icon: "apple",
        intro: "Cómo comes de verdad, para adaptar el plan a tu vida real.",
        fields: [
          H_R24, ...R24,
          { id: "frecuencia", label: "¿Qué consumes con frecuencia (3 o más veces por semana)?", type: "checks", stack: true, opts: [["refrescos", "Refrescos o jugos azucarados"], ["fritos", "Frituras o comida frita"], ["embutidos", "Embutidos o carnes frías"], ["pan_dulce", "Pan dulce, galletas o postres"], ["fastfood", "Comida rápida"], ["verduras", "Verduras todos los días"], ["fruta", "Fruta todos los días"], ["leguminosas", "Leguminosas (frijol, lenteja)"], ["pescado", "Pescado"]] },
          { id: "saciedad", label: "Hambre y saciedad", type: "radio", req: true, opts: [["bien", "Reconozco bien mi hambre y saciedad"], ["poca", "Me cuesta sentirme satisfecho(a)"], ["ansiedad", "Como por ansiedad con frecuencia"]] },
          ...HABITOS.filter((h) => !["hora_despierta", "hora_duerme"].includes(h.id)),
        ],
      },
    ],
  };

  /* ---------- Activación física (todos los paquetes) ---------- */
  const F_ACTIVIDAD = {
    id: "actividad", title: "Activación física", icon: "run",
    intro: "En Nutrimind recibirás una rutina de activación física acorde a tus necesidades. Primero lo primero: tu seguridad.",
    fields: [
      { id: "ef_nivel", label: "¿Qué tanta actividad física haces hoy?", type: "radio", req: true, stack: true, opts: [["sedentario", "Sedentario: casi no me muevo"], ["ligera", "Ligera: camino de vez en cuando"], ["moderada", "Moderada: me ejercito 2 a 3 días por semana"], ["activa", "Activa: me ejercito 4 o más días por semana"]] },
      { id: "ef_dias", label: "Días por semana que podrías dedicar", type: "radio", req: true, opts: [["1_2", "1–2"], ["3_4", "3–4"], ["5_6", "5–6"]], half: true },
      { id: "ef_tiempo", label: "Tiempo por sesión", type: "radio", req: true, opts: [["15", "15 min"], ["30", "30 min"], ["45", "45 min"], ["60", "60 min o más"]], half: true },
      { id: "ef_lugar", label: "¿Dónde o con qué podrías hacerlo?", type: "checks", req: true, stack: true, opts: [["casa", "En casa, sin equipo"], ["aire", "Caminata o aire libre"], ["ligas", "Ligas o mancuernas"], ["gym", "Gimnasio"], ["cabina", "En ruta: pausas y estiramientos en cabina"]] },
      { id: "ef_limit", label: "Lesiones, dolor articular o limitaciones físicas", type: "textarea", rows: 2, ph: "Escribe «ninguna» si no tienes", req: true },
      { id: "ef_pref", label: "¿Qué actividad disfrutas o te gustaría probar?", type: "text" },
      { type: "heading", text: "Antes de moverte", sub: "Cuestionario de seguridad para actividad física." },
      { id: "parq1", label: "¿Un médico te ha dicho que tienes un problema del corazón y que solo debes hacer ejercicio con supervisión?", type: "yesno", req: true },
      { id: "parq2", label: "¿Sientes dolor en el pecho al hacer actividad física o en reposo?", type: "yesno", req: true },
      { id: "parq3", label: "¿Has perdido el equilibrio por mareos o has perdido el conocimiento?", type: "yesno", req: true },
      { id: "parq4", label: "¿Un médico te ha indicado que no hagas ejercicio?", type: "yesno", req: true },
    ],
  };

  /* ---------- Consentimiento ---------- */
  const CONSENT_BASE = [
    "Entiendo que Nutrimental, a cargo del L.N. Aldo Giovanni Bermúdez Castillo (Cédula Profesional 9817691), brinda orientación nutricional a distancia mediante videollamadas y la app Nutrimind, y que este servicio no sustituye la atención médica de urgencia ni el diagnóstico o tratamiento de un médico.",
    "Entiendo que la consulta en línea está diseñada para cuadros estables. Si mis respuestas o estudios muestran una condición que requiera atención presencial, seré referido(a) a valoración médica o a un equipo multidisciplinario.",
    "Me comprometo a registrar mi avance en Nutrimind (comidas, peso y cintura una vez por semana) y a avisar de cualquier cambio en mi salud, medicamentos o diagnósticos.",
    "El chat de la app es para dudas puntuales, con respuesta de lunes a viernes en horario laboral (hora de Chihuahua). No es un servicio de emergencias.",
    "Mi expediente se integra conforme a la NOM-004-SSA3-2012: es confidencial y se conserva por un mínimo de 5 años. Mis datos personales se tratan conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares y solo se usan para brindarme el servicio.",
  ];
  const CONSENT_EXTRA = {
    apto: "Entiendo que el paquete Apto Médico / Choferes busca optimizar mi estado metabólico y nutricional de forma segura, pero no sustituye la valoración médica ni garantiza por sí solo la emisión de la Constancia de Aptitud Psicofísica ni el resultado de mi examen, sobre todo si existen condiciones que ameriten tratamiento farmacológico o valoración presencial.",
    peso: "Entiendo que los resultados dependen de mi constancia y que el plan puede ajustarse en cada videollamada quincenal.",
    cronica: "Entiendo que el plan nutricional se coordina con mi médico tratante, que no debo suspender ni modificar mis medicamentos por mi cuenta y que el precio de este plan se define después de la revisión de mi expediente.",
    consulta: "",
  };

  const F_CONSENT = (key) => ({
    id: "consentimiento", title: "Consentimiento", icon: "sign",
    intro: "Último paso del expediente. Lee con calma y confirma.",
    consentText: [...CONSENT_BASE, CONSENT_EXTRA[key]].filter(Boolean),
    fields: [
      { id: "ok_aviso", label: "He leído y acepto el aviso de privacidad y el tratamiento de mis datos de salud.", type: "agree", req: true },
      { id: "ok_consent", label: "He leído y acepto el consentimiento informado.", type: "agree", req: true },
      { id: "ok_veraz", label: "Declaro que la información que proporcioné es verdadera y completa.", type: "agree", req: true },
      { id: "firma", label: "Firma: escribe tu nombre completo", type: "text", req: true, ph: "Tu nombre completo" },
    ],
  });

  function buildSteps(formKey) {
    const objOpts = formKey === "apto" ? OBJ_ALL : OBJ_ALL;
    return [F_DATOS(objOpts), F_SEGURIDAD, ...(MOD[formKey] || MOD.consulta), F_ACTIVIDAD, F_CONSENT(formKey)];
  }

  /* ---------- Cálculos ---------- */
  const n = (v) => (v === undefined || v === null || v === "" ? NaN : parseFloat(v));
  function imc(d) {
    const p = n(d.peso), e = n(d.estatura) / 100;
    if (!p || !e) return NaN;
    return p / (e * e);
  }
  function clasifIMC(v) {
    if (isNaN(v)) return "";
    if (v < 18.5) return "Bajo peso";
    if (v < 25) return "Peso normal";
    if (v < 30) return "Sobrepeso";
    if (v < 35) return "Obesidad grado I";
    if (v < 40) return "Obesidad grado II";
    return "Obesidad grado III";
  }

  /* ---------- Semáforo de triaje ---------- */
  // Devuelve { nivel: 'verde'|'amarillo'|'rojo', rojos:[], amarillos:[] }
  function triaje(d, formKey) {
    const rojos = [], amar = [];
    const R = (t) => rojos.push(t), A = (t) => amar.push(t);
    const cond = d.condiciones || [];
    const chronic = formKey === "cronica";

    const edad = n(d.edad);
    if (edad && edad < 18) R("Menor de edad: por ahora atendemos a personas de 18 años en adelante.");

    if (cond.includes("renal")) R("Enfermedad renal");
    if (cond.includes("hepatica")) R("Enfermedad hepática avanzada");
    if (cond.includes("embarazo")) R("Embarazo o lactancia");
    if (cond.includes("tca_dx")) R("Trastorno de la conducta alimentaria diagnosticado o en tratamiento");
    if (cond.includes("bariatrica")) R("Cirugía bariátrica reciente o con complicaciones");
    if (cond.includes("cancer")) R("Cáncer activo o tratamiento oncológico");
    if (cond.includes("hta_nc")) R("Hipertensión no controlada o evento cardiovascular reciente");
    if (cond.includes("alarma_dig")) R("Signos de alarma digestiva (sangrado, pérdida de peso involuntaria, dificultad para tragar o anemia)");

    if (cond.includes("diabetes") && d.insulina === "si") {
      if (chronic) A("Diabetes con insulina o descompensaciones: se valorará con supervisión médica.");
      else R("Diabetes con insulina o con descompensaciones recientes");
    } else if (cond.includes("diabetes") && !chronic) {
      A("Diabetes: el plan «Patología Crónica» está diseñado para tu caso.");
    }

    if (has(d, "otros_dx", "apnea") && d.apnea_ctrl === "no") R("Apnea del sueño sin tratamiento o sin control");

    // Tamizaje TCA (SCOFF adaptado)
    const tca = ["tca1", "tca2", "tca3", "tca4"].filter((k) => d[k] === "si").length;
    if (tca >= 2) R("Tamizaje de conducta alimentaria con 2 o más respuestas positivas");
    else if (tca === 1) A("Una respuesta positiva en tamizaje de conducta alimentaria: lo platicaremos con cuidado.");

    // IMC
    const im = imc(d);
    if (!isNaN(im)) {
      if (im >= 40) R("IMC de 40 o más (obesidad grado III)");
      else if (im < 18.5) A("IMC por debajo de 18.5: revisaremos tu caso antes de plantear un plan.");
    }

    // Laboratorios y signos
    const hb = n(d.hba1c), glu = n(d.glucosa), tg = n(d.tg), sis = n(d.pa_sis), dia = n(d.pa_dia), tfg = n(d.tfg);
    if (hb >= 9) R("HbA1c de 9.0 % o más (glucotoxicidad)");
    if (glu > 250) R("Glucosa en ayuno mayor a 250 mg/dL");
    if (tg > 500) R("Triglicéridos mayores a 500 mg/dL (riesgo de pancreatitis)");
    if (tfg && tfg < 60) R("Filtración glomerular menor a 60 mL/min");
    if (sis >= 140 || dia >= 90) {
      if (formKey === "apto") R("Presión arterial de 140/90 mmHg o más sin control");
      else A("Presión arterial elevada: requiere valoración médica en paralelo; solo actividad física ligera.");
    }
    if (d.bristol === "7" && (d.digestivo || []).length) A("Evacuaciones líquidas frecuentes: descartaremos causa médica antes de restringir alimentos.");

    // Condiciones de tiempo / estudios
    if (formKey === "apto" && d.semanas_examen === "lt2") A("Tu examen es en menos de 2 semanas: en tan poco tiempo no se corrige un perfil de lípidos de forma segura ni milagrosa. Te daremos expectativas realistas.");
    if ((formKey === "apto" || chronic) && d.labs_estado && d.labs_estado !== "listos") A("Necesitaremos química sanguínea y perfil de lípidos con máximo 3 meses de antigüedad antes de diseñar tu plan.");

    // PAR-Q
    if (["parq1", "parq2", "parq3", "parq4"].some((k) => d[k] === "si")) A("Necesitarás autorización de tu médico antes de iniciar actividad física; mientras tanto solo caminatas suaves.");

    const nivel = rojos.length ? "rojo" : amar.length ? "amarillo" : "verde";
    return { nivel, rojos, amarillos: amar };
  }

  // Evaluación parcial para el paso de seguridad (solo lo respondido hasta ahí)
  function triajeTemprano(d, formKey) { return triaje(d, formKey); }

  /* ---------- Utilidades de etiqueta ---------- */
  function etiquetaOpcion(field, val) {
    if (!field.opts) return val;
    const f = field.opts.find((o) => o[0] === val);
    return f ? f[1] : val;
  }
  function valorLegible(field, d) {
    const v = d[field.id];
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length)) return "";
    if (field.type === "yesno") return v === "si" ? "Sí" : "No";
    if (field.type === "agree") return v ? "Aceptado" : "";
    if (field.type === "checks") return v.map((x) => etiquetaOpcion(field, x)).join("; ");
    if (field.type === "radio" || field.type === "select") return etiquetaOpcion(field, v);
    if (field.unit) return v + " " + field.unit;
    return String(v);
  }

  window.NM_SCHEMA = { buildSteps, triaje, triajeTemprano, imc, clasifIMC, valorLegible, etiquetaOpcion, SN };
})();
