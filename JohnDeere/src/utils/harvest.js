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

// ── 2. Riesgo de Retraso ─────────────────────────────────────────────────────
// Combina lluvia pronosticada (mm) y brecha de capacidad vs tiempo
export function calcRiesgoRetraso(d) {
  // Cada mm de lluvia aporta hasta 0.5% de riesgo, máx 45%
  const impactoLluvia = Math.min(d.lluviaPronosticada * 0.5, 45)

  // Brecha capacidad: producción posible vs demanda en la ventana de tiempo
  const produccionPosible = d.capacidadDisponible * d.turnosRestantes
  const demandaWindow     = d.capacidadDisponible * Math.max(d.tiempoRestante, 1)
  const gapRatio          = produccionPosible / demandaWindow
  const impactoCapacidad  = Math.max(0, (1 - gapRatio) * 55)

  const riesgo   = Math.min(97, Math.max(3, impactoLluvia + impactoCapacidad))
  const nivel    = riesgo >= 70 ? 'Crítico' : riesgo >= 45 ? 'Moderado' : 'Bajo'
  const colorKey = nivel === 'Crítico' ? 'danger' : nivel === 'Moderado' ? 'warning' : 'success'

  return {
    porcentaje: Math.round(riesgo),
    nivel,
    colorKey,
    factores: [
      { label: 'Lluvia pronosticada',  valor: `${d.lluviaPronosticada} mm`,   impacto: Math.round(impactoLluvia)   },
      { label: 'Brecha de capacidad',  valor: `${(gapRatio * 100).toFixed(0)}%`, impacto: Math.round(impactoCapacidad) },
      { label: 'Turnos restantes',     valor: `${d.turnosRestantes} turnos`,  impacto: null },
      { label: 'Tiempo restante',      valor: `${d.tiempoRestante} días`,     impacto: null },
    ],
  }
}

// ── 3. Anomalía en Máquina ───────────────────────────────────────────────────
const SENSOR_RANGES = {
  temperaturaMotor:  { min: 50,   max: 88,   unit: '°C',   label: 'Temperatura Motor'    },
  vibracion:         { min: 0,    max: 4.5,  unit: 'mm/s', label: 'Vibración'            },
  rpm:               { min: 900,  max: 3100, unit: 'RPM',  label: 'RPM'                  },
  presionHidraulica: { min: 145,  max: 255,  unit: 'bar',  label: 'Presión Hidráulica'   },
}

export function calcAnomalia(d) {
  const sensores = Object.entries(SENSOR_RANGES).map(([key, rng]) => {
    const valor = d[key]
    const span  = rng.max - rng.min
    const pct   = Math.min(100, Math.max(0, ((valor - rng.min) / span) * 100))
    const fuera = valor < rng.min || valor > rng.max
    const critico = valor < rng.min * 0.83 || valor > rng.max * 1.17
    return {
      key,
      label:  rng.label,
      valor,
      unit:   rng.unit,
      pct,
      estado: fuera ? (critico ? 'critico' : 'advertencia') : 'normal',
      rango:  `${rng.min}–${rng.max} ${rng.unit}`,
    }
  })

  const issues     = sensores.filter(s => s.estado !== 'normal')
  const hasCritical = issues.some(s => s.estado === 'critico')
  const estado   = issues.length === 0 ? 'Normal' : hasCritical ? 'Crítico' : 'Advertencia'
  const colorKey = estado === 'Normal' ? 'success' : estado === 'Crítico' ? 'danger' : 'warning'

  return { estado, colorKey, sensores, issues }
}

// ── 4. Asignación de Recursos ────────────────────────────────────────────────
// Distribuye equipos y operarios entre lotes ponderado por tiempo estimado
export function calcAsignacion(d) {
  const nLotes     = Math.max(1, d.numLotes)
  const nEquipos   = Math.max(1, d.numEquipos)
  const nOperarios = Math.max(1, d.numOperarios)
  const tiempos    = Array.from({ length: nLotes }, (_, i) => d.tiemposEstimados[i] ?? 8)
  const totalHoras = tiempos.reduce((a, b) => a + b, 0) || 1
  const maxHoras   = Math.max(...tiempos)

  const plan = tiempos.map((t, i) => {
    const peso = t / totalHoras
    return {
      lote:      i + 1,
      equipos:   Math.max(1, Math.round(nEquipos   * peso)),
      operarios: Math.max(1, Math.round(nOperarios * peso)),
      horas:     t,
      prioridad: t >= maxHoras * 0.8 ? 'Alta' : t >= maxHoras * 0.5 ? 'Media' : 'Baja',
    }
  })

  return {
    plan,
    resumen: {
      equiposPorLote:     (nEquipos   / nLotes).toFixed(1),
      operariosPorEquipo: (nOperarios / nEquipos).toFixed(1),
      horasPromedio:      (totalHoras / nLotes).toFixed(1),
    },
  }
}
