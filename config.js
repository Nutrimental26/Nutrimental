/* ============================================================
   NUTRIMENTAL · CONTENIDO EDITABLE
   Este archivo lo genera el panel privado (admin.html).
   Para publicar cambios: descarga el nuevo config.js desde el
   panel y reemplaza este archivo en tu hosting.
   ============================================================ */
window.NUTRIMENTAL_CONFIG = {
  "version": 1,
  "negocio": {
    "nombre": "Nutrimental",
    "lema": "Nourish. Transform. Thrive.",
    "profesional": "L.N. Aldo Giovanni Bermúdez Castillo",
    "cedula": "9817691",
    "correo": "nutrimental.ycoma@gmail.com",
    "telefono": "614 352 0652",
    "app": "Nutrimind",
    "horarioChat": "Lunes a viernes, 9:00 a 18:00 h (hora de Chihuahua)"
  },
  "envio": {
    "correoDestino": "nutrimental.ycoma@gmail.com"
  },
  "pago": {
    "banco": "",
    "titular": "",
    "clabe": "",
    "tarjeta": "",
    "concepto": "Tu nombre completo + el paquete elegido",
    "enlacePago": "",
    "instrucciones": "Realiza tu transferencia o depósito por el monto indicado y captura abajo los datos de tu comprobante. Tu lugar queda apartado cuando revisamos tu expediente y confirmamos tu pago."
  },
  "paquetes": [
    {
      "id": "consulta",
      "formulario": "consulta",
      "activo": true,
      "destacado": false,
      "nombre": "Consulta Individual",
      "etiqueta": "Valoración inicial",
      "duracion": "1 sesión de 45–50 min",
      "descripcion": "La puerta de entrada sin compromiso: prueba el formato en línea o valida un check-up rápido.",
      "incluye": [
        "Triaje de seguridad previo y expediente clínico",
        "Cálculo de tus requerimientos nutricionales",
        "Plan base en la app Nutrimind",
        "Guía rápida de equivalentes",
        "Activación física básica según tus necesidades"
      ],
      "tipoPrecio": "fijo",
      "precio": 650,
      "parcialidades": 1,
      "promo": { "activa": false, "precio": 500, "nota": "Cupo fundador · primeros lugares" }
    },
    {
      "id": "apto",
      "formulario": "apto",
      "activo": true,
      "destacado": true,
      "nombre": "Apto Médico / Choferes",
      "etiqueta": "El más solicitado · 6 semanas",
      "duracion": "3 videollamadas (semanas 1, 3 y 6) + monitoreo en Nutrimind",
      "descripcion": "Para llegar a tu examen médico laboral o de Licencia Federal con triglicéridos, colesterol, glucosa y presión bajo control.",
      "incluye": [
        "Enfoque en dislipidemias, triglicéridos, glucosa y presión",
        "Plan de ruta y paraderos: qué pedir en fondas, Oxxo y gasolineras",
        "Revisión de tus laboratorios y ajuste previo al examen SICT / laboral",
        "Monitoreo semanal en la app Nutrimind",
        "Activación física adaptada a cabina y pausas de 30 min"
      ],
      "tipoPrecio": "fijo",
      "precio": 1850,
      "parcialidades": 2,
      "promo": { "activa": false, "precio": 1450, "nota": "Cupo fundador · primeros 6–8 lugares" }
    },
    {
      "id": "peso",
      "formulario": "peso",
      "activo": true,
      "destacado": false,
      "nombre": "Control de Peso",
      "etiqueta": "Trimestral · 12 semanas",
      "duracion": "6 videollamadas quincenales + seguimiento en la app",
      "descripcion": "Abordaje conductual para obesidad grado I y II: hábitos reales, resultados que se quedan.",
      "incluye": [
        "Menús y listas de intercambios en Nutrimind",
        "Gráfica semanal de peso y cintura",
        "Ajustes progresivos del plan cada quincena",
        "Chat de la app para dudas puntuales de equivalentes",
        "Rutina de activación física progresiva en la app"
      ],
      "tipoPrecio": "fijo",
      "precio": 3200,
      "parcialidades": 2,
      "promo": { "activa": false, "precio": 2500, "nota": "Cupo fundador · 2 pagos de $1,250" }
    },
    {
      "id": "cronica",
      "formulario": "cronica",
      "activo": true,
      "destacado": false,
      "nombre": "Plan Patología Crónica",
      "etiqueta": "Precio según evaluación",
      "duracion": "A la medida de tu caso",
      "descripcion": "Para diabetes, hipertensión, dislipidemias y otras condiciones estables que requieren un plan con ajuste fármaco-alimento.",
      "incluye": [
        "Expediente clínico completo (evaluación ABCD)",
        "Revisión de interacciones fármaco-alimento y crononutrición",
        "Plan personalizado y seguimiento en Nutrimind",
        "Cotización a tu medida tras revisar tu expediente",
        "Activación física con criterios de seguridad clínica"
      ],
      "tipoPrecio": "evaluacion",
      "precio": 0,
      "parcialidades": 1,
      "promo": { "activa": false, "precio": 0, "nota": "" }
    }
  ],
  "promociones": [
    { "imagen": "", "titulo": "", "paquete": "" },
    { "imagen": "", "titulo": "", "paquete": "" },
    { "imagen": "", "titulo": "", "paquete": "" }
  ],
  "adminHash": "15552c788279c8a45eac811bcc8696da509bfd9181fa37afe147461377778251"
};
