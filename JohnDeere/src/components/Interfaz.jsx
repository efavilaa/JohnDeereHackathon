import './Interfaz.css'
import { fmtVal, SPEC } from '../utils/engineHealth'; // Importa fmtVal y SPEC para los detalles de los sensores

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
        {/* Tarjeta combinada de Priorización */}
        <PriorizacionCombinadaCard
          priorizacionA={r.priorizacionA}
          priorizacionB={r.priorizacionB}
          recomendacion={r.recomendacionPriorizacion}
        />

        <RetrasoCard      data={r.retraso}      />

        {/* Nueva Tarjeta: Predicción de Servicio en Tractores */}
        <div className="full-width-card"> {/* Nuevo div para controlar el ancho */}
          <TractorServicePredictionCard
            servicePrediction1={r.servicePrediction1}
            servicePrediction2={r.servicePrediction2}
          />
        </div>
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

// ── Card de Priorización Combinada ────────────────────────────────────────────
function PriorizacionCombinadaCard({ priorizacionA, priorizacionB, recomendacion }) {
  // Usaremos el colorKey del lote con mayor score para la tarjeta principal, o el de A por defecto
  const mainColorKey = priorizacionA.score >= priorizacionB.score ? priorizacionA.colorKey : priorizacionB.colorKey;
  const c = C[mainColorKey] ?? C.success;

  return (
    <div className="dash-card" style={{ '--card-accent': c.accent }}>
      <CardHead icon="🏷️" title="Priorización de cosecha en lotes" sub="Urgencia de cosecha" />

      {/* Sección para Lote A */}
      <div className="lot-section">
        <h4 className="lot-title">Lote A <Badge label={`Score: ${priorizacionA.score} / 100`} colorKey={priorizacionA.colorKey} /></h4>
        <div className="card-factors">
          {priorizacionA.factores.map(f => (
            <div key={`A-${f.label}`} className="factor-row">
              <span className="factor-label">{f.label}</span>
              <MiniBar pct={f.pct} colorKey={priorizacionA.colorKey} />
              <span className="factor-val">{f.raw}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Separador */}
      <hr style={{ borderColor: 'var(--line)', margin: '15px 0' }} />

      {/* Sección para Lote B */}
      <div className="lot-section">
        <h4 className="lot-title">Lote B <Badge label={`Score: ${priorizacionB.score} / 100`} colorKey={priorizacionB.colorKey} /></h4>
        <div className="card-factors">
          {priorizacionB.factores.map(f => (
            <div key={`B-${f.label}`} className="factor-row">
              <span className="factor-label">{f.label}</span>
              <MiniBar pct={f.pct} colorKey={priorizacionB.colorKey} />
              <span className="factor-val">{f.raw}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mensaje de recomendación combinado */}
      <div className="card-recommendation" style={{ borderTop: `1px solid ${c.border}`, paddingTop: '15px', marginTop: '15px', color: c.text, fontWeight: 'bold' }}>
        Recomendación: {recomendacion}
      </div>
    </div>
  );
}


// ── Card 2: Riesgo de Retraso ─────────────────────────────────────────────────
// Circumference of r=38 circle: 2π×38 ≈ 238.76
const CIRC = 2 * Math.PI * 38

function RetrasoCard({ data }) {
  const c = C[data.colorKey] ?? C.success
  const dash = (data.probabilidad / 100) * CIRC // Usar data.probabilidad

  let recomendacion = '';
  if (data.probabilidad >= 75) {
    recomendacion = 'Posponer actividades';
  } else if (data.probabilidad >= 50) {
    recomendacion = 'Riesgo elevado';
  } else if (data.probabilidad >= 25) {
    recomendacion = 'Atención requerida';
  } else {
    recomendacion = 'Operación dentro de plan';
  }

  return (
    <div className="dash-card" style={{ '--card-accent': c.accent }}>
      <CardHead icon="⏱️" title="Riesgo de Retraso" sub="Probabilidad de retraso" /> {/* Título actualizado */}

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
            {data.probabilidad}% {/* Mostrar data.probabilidad */}
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
            {/* Eliminar f.impacto ya que no se usa en la nueva lógica */}
          </div>
        ))}
      </div>

      {/* Nueva sección de recomendación */}
      <div className="card-recommendation" style={{ borderTop: `1px solid ${c.border}`, paddingTop: '15px', marginTop: '15px', color: c.text, fontWeight: 'bold' }}>
        Recomendación: {recomendacion}
      </div>
    </div>
  )
}

// ── Nueva Card: Predicción de Servicio en Tractores ──────────────────────────
function TractorServicePredictionCard({ servicePrediction1, servicePrediction2 }) {
  const getHealthColor = (health) => {
    if (health >= 70) return 'success';
    if (health >= 45) return 'warning';
    return 'danger';
  };

  const healthColor1 = getHealthColor(servicePrediction1.health);
  const healthColor2 = getHealthColor(servicePrediction2.health);

  const c1 = C[healthColor1] ?? C.success;
  const c2 = C[healthColor2] ?? C.success;

  return (
    <div className="dash-card" style={{ '--card-accent': '#e8a022' }}> {/* Color genérico para la tarjeta */}
      <CardHead icon="🔧" title="Predicción de servicio en tractores" sub="Estado y próximo mantenimiento" />

      <div className="tractor-prediction-grid"> {/* Nuevo contenedor para el layout horizontal */}
        {/* Sección para Tractor 1 */}
        <div className="tractor-prediction-item">
          <h4 className="lot-title">Tractor 1 <Badge label={`Salud: ${servicePrediction1.health}%`} colorKey={healthColor1} /></h4>
          <div className="card-factors">
            <div className="factor-row factor-row--flat">
              <span className="factor-label">Horas acumuladas</span>
              <span className="factor-val">{servicePrediction1.engineHours}h</span>
            </div>
            <div className="factor-row factor-row--flat">
              <span className="factor-label">Servicio en</span>
              <span className="factor-val">{servicePrediction1.adjHours}h</span>
            </div>
          </div>
        </div>

        {/* Separador vertical */}
        <div className="vertical-separator"></div>

        {/* Sección para Tractor 2 */}
        <div className="tractor-prediction-item">
          <h4 className="lot-title">Tractor 2 <Badge label={`Salud: ${servicePrediction2.health}%`} colorKey={healthColor2} /></h4>
          <div className="card-factors">
            <div className="factor-row factor-row--flat">
              <span className="factor-label">Horas acumuladas</span>
              <span className="factor-val">{servicePrediction2.engineHours}h</span>
            </div>
            <div className="factor-row factor-row--flat">
              <span className="factor-label">Servicio en</span>
              <span className="factor-val">{servicePrediction2.adjHours}h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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
