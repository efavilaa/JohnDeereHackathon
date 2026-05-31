// ── 1. Priorización de Lotes ─────────────────────────────────────────────────
// Combina madurez, lluvia, humedad, distancia y capacidad en un score 0-100
export function calcPriorizacion(d) {
  const scoreMadurez   = d.madurezCultivo / 100
  const scoreLluvia    = d.pronosticoLluvia / 100
  const scoreHumedad   =
    d.humedadSuelo >= 35 && d.humedadSuelo <= 65 ? 1.0
    : d.humedadSuelo >= 20 && d.humedadSuelo <= 80 ? 0.6
    : 0.25
  const scoreDistancia = Math.max(0, 1 - d.distanciaMaquinaria / 60)
  const scoreCapacidad = Math.min(d.capacidadDisponible / 120, 1)

  const score =
    scoreMadurez   * 0.35 +
    scoreLluvia    * 0.30 +
    scoreHumedad   * 0.15 +
    scoreDistancia * 0.10 +
    scoreCapacidad * 0.10

  const nivel    = score >= 0.65 ? 'Alta' : score >= 0.40 ? 'Media' : 'Baja'
  const colorKey = nivel === 'Alta' ? 'danger' : nivel === 'Media' ? 'warning' : 'success'

  return {
    nivel,
    colorKey,
    score: Math.round(score * 100),
    factores: [
      { label: 'Madurez cultivo',    pct: Math.round(scoreMadurez   * 100), raw: `${d.madurezCultivo}%`          },
      { label: 'Pronóstico lluvia',  pct: Math.round(scoreLluvia    * 100), raw: `${d.pronosticoLluvia}%`        },
      { label: 'Humedad suelo',      pct: Math.round(scoreHumedad   * 100), raw: `${d.humedadSuelo}%`            },
      { label: 'Dist. maquinaria',   pct: Math.round(scoreDistancia * 100), raw: `${d.distanciaMaquinaria} km`   },
      { label: 'Capacidad',          pct: Math.round(scoreCapacidad * 100), raw: `${d.capacidadDisponible} ha/d` },
    ],
  }
}

// ── 2. Riesgo de Retraso (basado en nuevas variables) ────────────────────────
export function calcRiesgoRetraso(d) {
  // Nuevas variables de entrada
  const tiempoRestanteEstimado = d.tiempoRestanteEstimado;
  const horasDisponiblesTurno = d.horasDisponiblesTurno;
  const probabilidadLluvia = d.probabilidadLluvia; // Ahora es un porcentaje
  const operadoresDisponibles = d.operadoresDisponibles;
  const maquinariaDisponible = d.maquinariaDisponible;

  let probabilidadRetraso = 0;

  // Impacto del tiempo restante vs. horas disponibles
  // Si el trabajo restante es mucho mayor que la capacidad por turno, aumenta el riesgo
  if (horasDisponiblesTurno > 0) {
    const ratioTiempo = tiempoRestanteEstimado / horasDisponiblesTurno;
    if (ratioTiempo > 5) probabilidadRetraso += 30; // Mucho trabajo para la capacidad
    else if (ratioTiempo > 2) probabilidadRetraso += 15; // Más trabajo que capacidad
  } else {
    probabilidadRetraso += 50; // No hay horas de turno disponibles, alto riesgo
  }

  // Impacto de la probabilidad de lluvia
  probabilidadRetraso += probabilidadLluvia * 0.5; // Cada % de lluvia añade 0.5% de riesgo

  // Impacto de maquinaria disponible
  if (maquinariaDisponible === 0) {
    probabilidadRetraso += 40; // Sin maquinaria, muy alto riesgo
  } else if (maquinariaDisponible === 1) {
    probabilidadRetraso += 15; // Poca maquinaria
  }

  // Impacto de operadores disponibles
  if (operadoresDisponibles === 0) {
    probabilidadRetraso += 35; // Sin operadores, muy alto riesgo
  } else if (operadoresDisponibles === 1) {
    probabilidadRetraso += 10; // Pocos operadores
  }

  // Asegurar que la probabilidad esté entre 0 y 100
  probabilidadRetraso = Math.min(100, Math.max(0, probabilidadRetraso));

  // Determinar el nivel y colorKey basado en la probabilidad
  const nivel = probabilidadRetraso >= 70 ? 'Alto' : probabilidadRetraso >= 40 ? 'Medio' : 'Bajo';
  const colorKey = nivel === 'Alto' ? 'danger' : nivel === 'Medio' ? 'warning' : 'success';

  return {
    probabilidad: Math.round(probabilidadRetraso),
    nivel,
    colorKey,
    factores: [
      { label: 'Tiempo restante estimado', valor: `${tiempoRestanteEstimado} h` },
      { label: 'Horas disponibles turno', valor: `${horasDisponiblesTurno} h` },
      { label: 'Probabilidad de lluvia', valor: `${probabilidadLluvia}%` },
      { label: 'Operadores disponibles', valor: `${operadoresDisponibles}` },
      { label: 'Maquinaria disponible', valor: `${maquinariaDisponible}` },
    ],
  };
}
