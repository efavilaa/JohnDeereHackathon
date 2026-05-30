import './Data.css'

// ── Definición de secciones y campos ──────────────────────────────────────────
const SECTIONS = [
  {
    id: 'priorizacion',
    title: 'Priorización de Lotes',
    icon: '🏷️',
    accent: 'green',
    fields: [
      { key: 'humedadSuelo',        label: 'Humedad Suelo',        unit: '%',      type: 'range',  min: 0,    max: 100, step: 1   },
      { key: 'pronosticoLluvia',    label: 'Pronóstico Lluvia',    unit: '%',      type: 'range',  min: 0,    max: 100, step: 1   },
      { key: 'madurezCultivo',      label: 'Madurez Cultivo',      unit: '%',      type: 'range',  min: 0,    max: 100, step: 1   },
      { key: 'distanciaMaquinaria', label: 'Distancia Maquinaria', unit: 'km',     type: 'number', min: 0,    max: 200, step: 0.5 },
      { key: 'capacidadDisponible', label: 'Capacidad Disponible', unit: 'ha/día', type: 'number', min: 0,    max: 500, step: 1   },
    ],
  },
  {
    id: 'retraso',
    title: 'Riesgo de Retraso',
    icon: '⏱️',
    accent: 'blue',
    fields: [
      { key: 'tiempoRestante',      label: 'Tiempo Restante',      unit: 'días',   type: 'number', min: 1,    max: 90,  step: 1   },
      { key: 'lluviaPronosticada',  label: 'Lluvia Pronosticada',  unit: 'mm',     type: 'number', min: 0,    max: 300, step: 1   },
      { key: 'turnosRestantes',     label: 'Turnos Restantes',     unit: 'turnos', type: 'number', min: 1,    max: 10,  step: 1   },
    ],
  },
]

// ── Componente principal ───────────────────────────────────────────────────────
export default function Data({ data, onChange, onTiempoChange, onNumLotesChange }) {
  return (
    <div className="data-panel">
      <div className="data-panel-header">
        <h2>Panel de Control</h2>
        <p>Modifica los valores para actualizar el dashboard</p>
      </div>

      <div className="sections-list">
        {SECTIONS.map(section => (
          <section key={section.id} className={`data-section accent-${section.accent}`}>
            <h3 className="section-title">
              <span className="section-icon">{section.icon}</span>
              {section.title}
            </h3>
            <div className="fields-list">
              {section.fields.map(field => (
                <FieldInput
                  key={field.key}
                  field={field}
                  value={data[field.key]}
                  onChange={v => onChange(field.key, v)}
                />
              ))}
            </div>
          </section>
        ))}

        {/* Sección 4 — Asignación de Recursos (dinámica) */}
        <section className="data-section accent-purple">
          <h3 className="section-title">
            <span className="section-icon">👥</span>
            Asignación de Recursos
          </h3>
          <div className="fields-list">
            <FieldInput
              field={{ key: 'numEquipos',   label: 'Equipos',         unit: 'unidades', type: 'number', min: 1, max: 50,  step: 1 }}
              value={data.numEquipos}
              onChange={v => onChange('numEquipos', v)}
            />
            <FieldInput
              field={{ key: 'numOperarios', label: 'Operarios',       unit: 'personas', type: 'number', min: 1, max: 200, step: 1 }}
              value={data.numOperarios}
              onChange={v => onChange('numOperarios', v)}
            />
            <FieldInput
              field={{ key: 'numLotes',     label: 'Número de Lotes', unit: 'lotes',    type: 'number', min: 1, max: 20,  step: 1 }}
              value={data.numLotes}
              onChange={v => onNumLotesChange(v)}
            />
          </div>

          <div className="tiempos-block">
            <p className="tiempos-label">Tiempo estimado por lote (horas)</p>
            <div className="tiempos-grid">
              {data.tiemposEstimados.map((t, i) => (
                <div key={i} className="tiempo-item">
                  <span className="tiempo-lote">L{i + 1}</span>
                  <input
                    className="tiempo-input"
                    type="number"
                    min={1}
                    max={72}
                    step={0.5}
                    value={t}
                    onChange={e => onTiempoChange(i, parseFloat(e.target.value) || 1)}
                  />
                  <span className="tiempo-unit">h</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

// ── Campo de entrada reutilizable ─────────────────────────────────────────────
function FieldInput({ field, value, onChange }) {
  const isFloat = field.step % 1 !== 0

  function handleChange(e) {
    const raw = isFloat ? parseFloat(e.target.value) : parseInt(e.target.value, 10)
    onChange(isNaN(raw) ? field.min : raw)
  }

  return (
    <div className="field-item">
      <div className="field-top">
        <label className="field-label">{field.label}</label>
        <span className="field-badge">
          {typeof value === 'number' ? (isFloat ? value.toFixed(1) : value) : value}
          <em>{field.unit}</em>
        </span>
      </div>

      {field.type === 'range' ? (
        <>
          <input
            type="range"
            className="range-input"
            min={field.min}
            max={field.max}
            step={field.step}
            value={value}
            onChange={handleChange}
          />
          <div className="range-ends">
            <span>{field.min}</span>
            <span>{field.max}</span>
          </div>
        </>
      ) : (
        <input
          type="number"
          className="number-input"
          min={field.min}
          max={field.max}
          step={field.step}
          value={value}
          onChange={handleChange}
        />
      )}
    </div>
  )
}
