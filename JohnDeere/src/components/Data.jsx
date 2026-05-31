import './Data.css'
import { SPEC } from '../utils/engineHealth'; // Importa SPEC para definir los campos de los sensores

// ── Definición de secciones y campos ──────────────────────────────────────────
const SECTIONS = [
  {
    id: 'retraso',
    title: 'Riesgo de Retraso',
    icon: '⏱️',
    accent: 'blue',
    fields: [
      { key: 'tiempoRestanteEstimado', label: 'Tiempo Restante Estimado', unit: 'h',      type: 'number', min: 0,    max: 200, step: 0.1 },
      { key: 'horasDisponiblesTurno',  label: 'Horas Disponibles Turno',  unit: 'h',      type: 'number', min: 0,    max: 24,  step: 0.5 },
      { key: 'probabilidadLluvia',     label: 'Probabilidad Lluvia',      unit: '%',      type: 'range',  min: 0,    max: 100, step: 1   },
      { key: 'operadoresDisponibles',  label: 'Operadores Disponibles',   unit: '',       type: 'number', min: 0,    max: 10,  step: 1   },
      { key: 'maquinariaDisponible',   label: 'Maquinaria Disponible',    unit: '',       type: 'number', min: 0,    max: 10,  step: 1   },
    ],
  },
]

// Campos comunes para la priorización de lotes
const PRIORIZACION_FIELDS = [
  { key: 'humedadSuelo',        label: 'Humedad Suelo',        unit: '%',      type: 'range',  min: 0,    max: 100, step: 1   },
  { key: 'pronosticoLluvia',    label: 'Pronóstico Lluvia',    unit: '%',      type: 'range',  min: 0,    max: 100, step: 1   },
  { key: 'madurezCultivo',      label: 'Madurez Cultivo',      unit: '%',      type: 'range',  min: 0,    max: 100, step: 1   },
  { key: 'distanciaMaquinaria', label: 'Distancia Maquinaria', unit: 'km',     type: 'number', min: 0,    max: 200, step: 0.5 },
  { key: 'capacidadDisponible', label: 'Capacidad Disponible', unit: 'ha/día', type: 'number', min: 0,    max: 500, step: 1   },
];

// Campos para los sensores de los tractores
const SENSOR_FIELDS = Object.keys(SPEC).map(key => ({
  key: key,
  label: SPEC[key].name,
  unit: SPEC[key].unit,
  type: 'number', // Asumimos que todos los sensores son de tipo number para la entrada
  min: 0, // Valores mínimos y máximos genéricos, se pueden ajustar si es necesario
  max: 5000,
  step: 0.1,
}));


// ── Componente principal ───────────────────────────────────────────────────────
export default function Data({ data, onChange }) { // Eliminamos onTiempoChange y onNumLotesChange
  return (
    <div className="data-panel">
      <div className="data-panel-header">
        <h2>Panel de Control</h2>
        <p>Modifica los valores para actualizar el dashboard</p>
      </div>

      <div className="sections-list">
        {/* Sección 1 — Priorización de Lote A */}
        <section className={`data-section accent-green`}>
          <h3 className="section-title">
            <span className="section-icon">🏷️</span>
            Priorización de Lote A
          </h3>
          <div className="fields-list">
            {PRIORIZACION_FIELDS.map(field => (
              <FieldInput
                key={`loteA-${field.key}`}
                field={field}
                value={data.loteA[field.key]}
                onChange={v => onChange(field.key, v, 'loteA')}
              />
            ))}
          </div>
        </section>

        {/* Sección 1 — Priorización de Lote B */}
        <section className={`data-section accent-green`}>
          <h3 className="section-title">
            <span className="section-icon">🏷️</span>
            Priorización de Lote B
          </h3>
          <div className="fields-list">
            {PRIORIZACION_FIELDS.map(field => (
              <FieldInput
                key={`loteB-${field.key}`}
                field={field}
                value={data.loteB[field.key]}
                onChange={v => onChange(field.key, v, 'loteB')}
              />
            ))}
          </div>
        </section>

        {/* Sección 2 — Riesgo de Retraso */}
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

        {/* Nueva Sección: Predicción de Servicio - Tractor 1 */}
        <section className={`data-section accent-orange`}>
          <h3 className="section-title">
            <span className="section-icon">🚜</span>
            Sensores Tractor 1
          </h3>
          <div className="fields-list">
            {/* Campo para el modelo del tractor */}
            <FieldInput
              field={{ key: 'model', label: 'Modelo', unit: '', type: 'text' }}
              value={data.tractor1.model}
              onChange={v => onChange('model', v, 'tractor1')}
            />
            {SENSOR_FIELDS.map(field => (
              <FieldInput
                key={`tractor1-${field.key}`}
                field={field}
                value={data.tractor1[field.key]}
                onChange={v => onChange(field.key, v, 'tractor1')}
              />
            ))}
          </div>
        </section>

        {/* Nueva Sección: Predicción de Servicio - Tractor 2 */}
        <section className={`data-section accent-orange`}>
          <h3 className="section-title">
            <span className="section-icon">🚜</span>
            Sensores Tractor 2
          </h3>
          <div className="fields-list">
            {/* Campo para el modelo del tractor */}
            <FieldInput
              field={{ key: 'model', label: 'Modelo', unit: '', type: 'text' }}
              value={data.tractor2.model}
              onChange={v => onChange('model', v, 'tractor2')}
            />
            {SENSOR_FIELDS.map(field => (
              <FieldInput
                key={`tractor2-${field.key}`}
                field={field}
                value={data.tractor2[field.key]}
                onChange={v => onChange(field.key, v, 'tractor2')}
              />
            ))}
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
    const raw = field.type === 'number' ? (isFloat ? parseFloat(e.target.value) : parseInt(e.target.value, 10)) : e.target.value;
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
          type={field.type} // Usa el tipo de campo dinámicamente
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
