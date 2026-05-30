import './Interfaz.css'

// ── Mapa de colores por estado ────────────────────────────────────────────────
const C = {
  success: { bg: '#e8f5e9', text: '#1b5e20', border: '#43a047', accent: '#43a047' },
  warning: { bg: '#fff8e1', text: '#795548', border: '#e8a022', accent: '#e8a022' },
  danger:  { bg: '#fdecea', text: '#7f1d1d', border: '#e53935', accent: '#e53935' },
}

// ── Componente raíz del dashboard ─────────────────────────────────────────────
export default function Interfaz({ recommendations: r }) {
  return (
    <div className="interfaz-panel">
      <div className="interfaz-header">
        <h2>Interfaz de Visualización</h2>
        <p>Recomendaciones calculadas en tiempo real a partir del Panel de Control</p>
      </div>

      <div className="cards-grid">
        <PriorizacionCard data={r.priorizacion} />
        <RetrasoCard      data={r.retraso}      />
        <AnomaliaCard     data={r.anomalia}     />
        <AsignacionCard   data={r.asignacion}   />
      </div>
    </div>
  )
}

// ── Subcomponentes reutilizables ──────────────────────────────────────────────
function Badge({ label, colorKey }) {
  const c = C[colorKey] ?? C.success
  return (
    <span className="badge" style={{ background: c.bg, color: c.text, borderColor: c.border }}>
      {label}
    </span>
  )
}

function MiniBar({ pct, colorKey }) {
  const c = C[colorKey] ?? C.success
  return (
    <div className="minibar-track">
      <div className="minibar-fill" style={{ width: `${Math.min(100, pct)}%`, background: c.accent }} />
    </div>
  )
}

// ── Card 1: Priorización de Lotes ────────────────────────────────────────────
function PriorizacionCard({ data }) {
  const c = C[data.colorKey] ?? C.success
  return (
    <div className="dash-card" style={{ '--card-accent': c.accent }}>
      <CardHead icon="🏷️" title="Priorización de Lotes" sub="Urgencia de cosecha" />

      <div className="card-hero">
        <span className="hero-value" style={{ color: c.accent }}>{data.nivel}</span>
        <Badge label={`Score: ${data.score} / 100`} colorKey={data.colorKey} />
      </div>

      <div className="card-factors">
        {data.factores.map(f => (
          <div key={f.label} className="factor-row">
            <span className="factor-label">{f.label}</span>
            <MiniBar pct={f.pct} colorKey={data.colorKey} />
            <span className="factor-val">{f.raw}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Card 2: Riesgo de Retraso ─────────────────────────────────────────────────
// Circumference of r=38 circle: 2π×38 ≈ 238.76
const CIRC = 2 * Math.PI * 38

function RetrasoCard({ data }) {
  const c = C[data.colorKey] ?? C.success
  const dash = (data.porcentaje / 100) * CIRC

  return (
    <div className="dash-card" style={{ '--card-accent': c.accent }}>
      <CardHead icon="⏱️" title="Riesgo de Retraso" sub="Probabilidad de demora" />

      <div className="card-hero card-hero--ring">
        <svg className="ring-svg" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="38" fill="none" stroke="#e8eaed" strokeWidth="9" />
          <circle
            cx="50" cy="50" r="38" fill="none"
            stroke={c.accent} strokeWidth="9"
            strokeDasharray={`${dash.toFixed(1)} ${CIRC.toFixed(1)}`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dasharray 0.4s ease' }}
          />
          <text x="50" y="44" textAnchor="middle" className="ring-pct" fill={c.accent}>
            {data.porcentaje}%
          </text>
          <text x="50" y="58" textAnchor="middle" className="ring-sub" fill="#666">
            {data.nivel}
          </text>
        </svg>
      </div>

      <div className="card-factors">
        {data.factores.map(f => (
          <div key={f.label} className="factor-row factor-row--flat">
            <span className="factor-label">{f.label}</span>
            <span className="factor-val">{f.valor}</span>
            {f.impacto !== null && (
              <span className="factor-impact" style={{ color: c.accent }}>+{f.impacto}%</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Card 3: Anomalía en Máquina ───────────────────────────────────────────────
const SENSOR_ICON = { normal: '✅', advertencia: '⚠️', critico: '🚨' }
const SENSOR_COLOR = { normal: '#43a047', advertencia: '#e8a022', critico: '#e53935' }

function AnomaliaCard({ data }) {
  const c = C[data.colorKey] ?? C.success
  return (
    <div className="dash-card" style={{ '--card-accent': c.accent }}>
      <CardHead icon="⚙️" title="Anomalía en Máquina" sub="Estado de sensores" />

      <div className="card-hero">
        <span className="hero-value" style={{ color: c.accent }}>{data.estado}</span>
        <Badge
          label={data.issues.length === 0 ? 'Todos los sensores OK' : `${data.issues.length} alerta(s)`}
          colorKey={data.colorKey}
        />
      </div>

      <div className="sensor-list">
        {data.sensores.map(s => (
          <div key={s.key} className="sensor-row">
            <span className="sensor-icon">{SENSOR_ICON[s.estado]}</span>
            <span className="sensor-label">{s.label}</span>
            <div className="sensor-bar-wrap">
              <div className="sensor-bar-track">
                <div
                  className="sensor-bar-fill"
                  style={{ width: `${s.pct}%`, background: SENSOR_COLOR[s.estado] }}
                />
              </div>
            </div>
            <span className="sensor-val" style={{ color: SENSOR_COLOR[s.estado] }}>
              {s.valor} {s.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Card 4: Asignación de Recursos ────────────────────────────────────────────
const PRIORIDAD_COLOR = { Alta: 'danger', Media: 'warning', Baja: 'success' }

function AsignacionCard({ data }) {
  return (
    <div className="dash-card" style={{ '--card-accent': '#43a047' }}>
      <CardHead icon="👥" title="Asignación de Recursos" sub="Plan de distribución de equipos" />

      <div className="stats-row">
        <Stat value={data.resumen.equiposPorLote}     label="Equipos / lote"   />
        <Stat value={data.resumen.operariosPorEquipo} label="Oper. / equipo"   />
        <Stat value={`${data.resumen.horasPromedio}h`} label="Horas promedio"  />
      </div>

      <div className="table-wrapper">
        <table className="assign-table">
          <thead>
            <tr>
              <th>Lote</th>
              <th>Equipos</th>
              <th>Operarios</th>
              <th>Horas</th>
              <th>Prioridad</th>
            </tr>
          </thead>
          <tbody>
            {data.plan.map(row => (
              <tr key={row.lote}>
                <td className="td-lote">#{row.lote}</td>
                <td>{row.equipos}</td>
                <td>{row.operarios}</td>
                <td>{row.horas}h</td>
                <td>
                  <Badge label={row.prioridad} colorKey={PRIORIDAD_COLOR[row.prioridad]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Utilidades ────────────────────────────────────────────────────────────────
function CardHead({ icon, title, sub }) {
  return (
    <div className="card-head">
      <span className="card-icon">{icon}</span>
      <div>
        <h3 className="card-title">{title}</h3>
        <p className="card-sub">{sub}</p>
      </div>
    </div>
  )
}

function Stat({ value, label }) {
  return (
    <div className="stat-item">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}
