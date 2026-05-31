import { useState, useMemo } from 'react';
import Data from './components/Data';
import Interfaz from './components/Interfaz';
import Planificacion from './Planificacion'; // Re-importamos Planificacion
import { calcPriorizacion, calcRiesgoRetraso } from './utils/harvest';
import { calculateEngineHealth, TRACTORS } from './utils/engineHealth'; // Importa la lógica de salud del motor
import './App.css';

const INITIAL = {
  // Sección 1 – Priorización de Lotes A
  loteA: {
    humedadSuelo:        65,
    pronosticoLluvia:    45,
    madurezCultivo:      78,
    distanciaMaquinaria: 12,
    capacidadDisponible: 85,
  },
  // Sección 1 – Priorización de Lotes B
  loteB: {
    humedadSuelo:        70,
    pronosticoLluvia:    30,
    madurezCultivo:      60,
    distanciaMaquinaria: 25,
    capacidadDisponible: 70,
  },
  // Sección 2 – Riesgo de Retraso (Nuevas variables)
  tiempoRestanteEstimado: 17.4,
  horasDisponiblesTurno:  8,
  probabilidadLluvia:     70,
  operadoresDisponibles:  1,
  maquinariaDisponible:   0,
  // Datos de sensores para Tractor 1
  tractor1: {
    model: '6R', // Modelo de tractor para referencia
    coolantTemp: 92,
    vibration: 0.65,
    rpm: 2150,
    oilPressure: 38,
    hydPressure: 2400,
    engineHours: 3420,
    engineLoad: 78,
    oilTemp: 96,
    tempRise: 1.8,
    timeOver95: 24,
  },
  // Datos de sensores para Tractor 2
  tractor2: {
    model: '8R', // Modelo de tractor para referencia
    coolantTemp: 83,
    vibration: 0.35,
    rpm: 1950,
    oilPressure: 52,
    hydPressure: 3050,
    engineHours: 920,
    engineLoad: 55,
    oilTemp: 88,
    tempRise: 0.4,
    timeOver95: 2,
  },
}

export default function App() {
  const [data, setData] = useState(INITIAL);
  const [activeTab, setActiveTab] = useState('interfaz'); // Nuevo estado para la pestaña activa

  // Modificado para manejar campos anidados como loteA.humedadSuelo o tractor1.coolantTemp
  function handleChange(field, value, parentKey = null) {
    setData(prev => {
      if (parentKey) {
        return {
          ...prev,
          [parentKey]: {
            ...prev[parentKey],
            [field]: value,
          },
        };
      }
      return { ...prev, [field]: value };
    });
  }

  const recommendations = useMemo(() => {
    const priorizacionA = calcPriorizacion(data.loteA);
    const priorizacionB = calcPriorizacion(data.loteB);

    // Lógica para la recomendación combinada de priorización
    let recomendacionPriorizacion = '';
    if (priorizacionA.score > priorizacionB.score) {
      recomendacionPriorizacion = `Cosechar Lote A (Prioridad: ${priorizacionA.nivel}), luego Lote B (Prioridad: ${priorizacionB.nivel}).`;
    } else if (priorizacionB.score > priorizacionA.score) {
      recomendacionPriorizacion = `Cosechar Lote B (Prioridad: ${priorizacionB.nivel}), luego Lote A (Prioridad: ${priorizacionA.nivel}).`;
    } else {
      recomendacionPriorizacion = `Ambos lotes tienen prioridad similar (${priorizacionA.nivel}).`;
    }

    // Cálculo de la predicción de servicio para Tractor 1
    const servicePrediction1 = calculateEngineHealth(
      data.tractor1,
      TRACTORS[data.tractor1.model].serviceInterval
    );

    // Cálculo de la predicción de servicio para Tractor 2
    const servicePrediction2 = calculateEngineHealth(
      data.tractor2,
      TRACTORS[data.tractor2.model].serviceInterval
    );

    return {
      priorizacionA,
      priorizacionB,
      recomendacionPriorizacion,
      retraso: calcRiesgoRetraso(data),
      servicePrediction1,
      servicePrediction2,
    };
  }, [data]);

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
        {/* Navegación por pestañas */}
        <nav className="app-nav">
          <button
            className={activeTab === 'data' ? 'active' : ''}
            onClick={() => setActiveTab('data')}
          >
            Data
          </button>
          <button
            className={activeTab === 'interfaz' ? 'active' : ''}
            onClick={() => setActiveTab('interfaz')}
          >
            Interfaz
          </button>
          <button
            className={activeTab === 'planificacion' ? 'active' : ''}
            onClick={() => setActiveTab('planificacion')}
          >
            Planificación
          </button>
        </nav>
      </header>

      <div className="app-body">
        {activeTab === 'data' && (
          <aside className="panel-left">
            <Data
              data={data}
              onChange={handleChange}
            />
          </aside>
        )}
        {activeTab === 'interfaz' && (
          <main className="panel-right">
            <Interfaz recommendations={recommendations} />
          </main>
        )}
        {activeTab === 'planificacion' && (
          <main className="panel-full"> {/* Puedes ajustar la clase según necesites */}
            <Planificacion tractor1Data={data.tractor1} /> {/* Pasamos data.tractor1 */}
          </main>
        )}
      </div>
    </div>
  );
}
