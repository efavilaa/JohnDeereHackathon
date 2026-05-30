import { useState, useMemo } from 'react'
import Data from './components/Data'
import Interfaz from './components/Interfaz'
import { calcPriorizacion, calcRiesgoRetraso, calcAsignacion } from './utils/harvest'
import './App.css'

const INITIAL = {
  // Sección 1 – Priorización de Lotes
  humedadSuelo:        65,
  pronosticoLluvia:    45,
  madurezCultivo:      78,
  distanciaMaquinaria: 12,
  capacidadDisponible: 85,
  // Sección 2 – Riesgo de Retraso
  tiempoRestante:      10,
  lluviaPronosticada:  30,
  turnosRestantes:      3,
  // Sección 3 – Asignación de Recursos
  numEquipos:           4,
  numOperarios:        12,
  numLotes:             4,
  tiemposEstimados:   [8, 10, 6, 12],
}

export default function App() {
  const [data, setData] = useState(INITIAL)

  function handleChange(field, value) {
    setData(prev => ({ ...prev, [field]: value }))
  }

  function handleTiempoChange(index, value) {
    setData(prev => {
      const arr = [...prev.tiemposEstimados]
      arr[index] = value
      return { ...prev, tiemposEstimados: arr }
    })
  }

  function handleNumLotesChange(n) {
    const count = Math.max(1, Math.min(20, n))
    setData(prev => ({
      ...prev,
      numLotes: count,
      tiemposEstimados: Array.from({ length: count }, (_, i) => prev.tiemposEstimados[i] ?? 8),
    }))
  }

  const recommendations = useMemo(() => ({
    priorizacion: calcPriorizacion(data),
    retraso:      calcRiesgoRetraso(data),
    asignacion:   calcAsignacion(data),
  }), [data])

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-brand">
          <svg className="brand-leaf" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-8 2s2-2 3-4c-3 1-5 5-5 5 2-1 5-1 5-1-2 3-7 3-7 3s-1-3 2-4c-3 0-4 2-4 2s0-3 3-3c-2 0-3 1-3 1z"/>
          </svg>
          <span>John Deere — Optimización de Cosecha</span>
        </div>
        <div className="app-realtime">
          <span className="realtime-dot" />
          Actualización en tiempo real
        </div>
      </header>

      <div className="app-body">
        <aside className="panel-left">
          <Data
            data={data}
            onChange={handleChange}
            onTiempoChange={handleTiempoChange}
            onNumLotesChange={handleNumLotesChange}
          />
        </aside>
        <main className="panel-right">
          <Interfaz recommendations={recommendations} />
        </main>
      </div>
    </div>
  )
}
