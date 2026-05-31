import React, { useState, useEffect, useMemo } from 'react';
import './Planificacion.css';
import { TRACTORS, SPEC, penalty, statusOf, fmtVal, calculateEngineHealth } from './utils/engineHealth';

/* ===== CULTIVOS — trabajos recomendados (count = veces recomendadas, editable) =====
   Cosecha ampliada en 3 sub-trabajos: Cosecha, Transporte de grano, Empacado de rastrojo */
const CROPS = {
  maiz:  { label:'Maíz',  workRate:4.5,
    jobs:[ {key:'siembra', name:'Siembra',              cls:'plant',  hrsPerHa:0.9, count:1, offset:0},
           {key:'fert',    name:'Fertilización',        cls:'fert',   hrsPerHa:0.4, count:2, offset:25, repeatEvery:35},
           {key:'fumiga',  name:'Fumigación',           cls:'spray',  hrsPerHa:0.3, count:3, offset:40, repeatEvery:30},
           {key:'cosecha', name:'Cosecha',              cls:'harvest',hrsPerHa:1.1, count:1, offset:145},
           {key:'transp',  name:'Transporte de grano',  cls:'harvest',hrsPerHa:0.5, count:1, offset:148},
           {key:'rastrojo',name:'Empacado de rastrojo', cls:'harvest',hrsPerHa:0.6, count:1, offset:155} ] },
  sorgo: { label:'Sorgo', workRate:4.8,
    jobs:[ {key:'siembra', name:'Siembra',              cls:'plant',  hrsPerHa:0.85,count:1, offset:0},
           {key:'fert',    name:'Fertilización',        cls:'fert',   hrsPerHa:0.4, count:2, offset:20, repeatEvery:30},
           {key:'fumiga',  name:'Fumigación',           cls:'spray',  hrsPerHa:0.3, count:2, offset:35, repeatEvery:30},
           {key:'cosecha', name:'Cosecha',              cls:'harvest',hrsPerHa:1.0, count:1, offset:115},
           {key:'transp',  name:'Transporte de grano',  cls:'harvest',hrsPerHa:0.5, count:1, offset:118},
           {key:'rastrojo',name:'Empacado de rastrojo', cls:'harvest',hrsPerHa:0.6, count:1, offset:124} ] },
  trigo: { label:'Trigo', workRate:5.0,
    jobs:[ {key:'siembra', name:'Siembra',              cls:'plant',  hrsPerHa:0.8, count:1, offset:0},
           {key:'fert',    name:'Fertilización',        cls:'fert',   hrsPerHa:0.35,count:2, offset:30, repeatEvery:40},
           {key:'fumiga',  name:'Fumigación',           cls:'spray',  hrsPerHa:0.28,count:2, offset:50, repeatEvery:35},
           {key:'cosecha', name:'Cosecha',              cls:'harvest',hrsPerHa:1.0, count:1, offset:130},
           {key:'transp',  name:'Transporte de grano',  cls:'harvest',hrsPerHa:0.5, count:1, offset:133},
           {key:'rastrojo',name:'Empacado de rastrojo', cls:'harvest',hrsPerHa:0.55,count:1, offset:139} ] }
};
function iconFor(c){return {plant:'🌱',spray:'💧',fert:'🌿',harvest:'🌾',service:'🔧'}[c]||'•'}

const MONTHS=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const M3=['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];
const WK=['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'];
function fmt(d){return `${WK[d.getDay()]} ${d.getDate()} ${M3[d.getMonth()]}`}

function Planificacion({ tractor1Data }) { // Recibe tractor1Data como prop
  const [selectedCrop, setSelectedCrop] = useState(Object.keys(CROPS)[0]);
  const [hectares, setHectares] = useState(320);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedTractorModel, setSelectedTractorModel] = useState(tractor1Data.model); // Usa el modelo del tractor1Data
  const [jobCounts, setJobCounts] = useState({});
  const [results, setResults] = useState(null);
  const [sensorDetail, setSensorDetail] = useState([]);

  // Actualiza el modelo de tractor seleccionado si tractor1Data cambia
  useEffect(() => {
    setSelectedTractorModel(tractor1Data.model);
  }, [tractor1Data.model]);

  useEffect(() => {
    // Initialize jobCounts based on the selected crop
    const initialJobCounts = {};
    CROPS[selectedCrop].jobs.forEach(job => {
      initialJobCounts[job.key] = job.count;
    });
    setJobCounts(initialJobCounts);
  }, [selectedCrop]);

  useEffect(() => {
    // Load sensors from tractor1Data
    const { detail } = calculateEngineHealth(tractor1Data, TRACTORS[selectedTractorModel].serviceInterval);
    setSensorDetail(detail);
  }, [tractor1Data, selectedTractorModel]); // Depende de tractor1Data y selectedTractorModel

  const handleStepJob = (key, dir) => {
    setJobCounts(prevCounts => {
      const newCount = Math.max(0, Math.min(9, (prevCounts[key] || 0) + dir));
      return { ...prevCounts, [key]: newCount };
    });
  };

  const runSimulation = () => {
    const crop = CROPS[selectedCrop];
    const ha = Math.max(1, +hectares || 1);
    const tractorInfo = TRACTORS[selectedTractorModel]; // Información del modelo para serviceInterval y label
    const start = new Date(startDate + 'T00:00:00');
    const startHours = tractor1Data.engineHours; // Horas acumuladas del tractor1Data

    let events = [];
    let totalHours = 0;

    crop.jobs.forEach(job => {
      const times = jobCounts[job.key];
      if (times <= 0) return;
      for (let i = 0; i < times; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + job.offset + (i * (job.repeatEvery || 0)));
        const h = Math.round(job.hrsPerHa * ha);
        totalHours += h;
        events.push({ name: job.name + (times > 1 ? ` #${i + 1}` : ''), date: d, cls: job.cls, hours: h, critical: (job.cls === 'plant' || job.key === 'cosecha') });
      }
    });

    // Calcular salud del motor usando tractor1Data
    const { health, detail, adjHours } = calculateEngineHealth(tractor1Data, tractorInfo.serviceInterval);
    const serviceDate = new Date(start);
    serviceDate.setDate(serviceDate.getDate() + Math.round(adjHours / (crop.workRate * 2))); // Estimación de días

    let conflict = null;
    events.forEach(ev => { if(ev.critical){const lo=new Date(ev.date.getTime()-3*864e5),hi=new Date(ev.date.getTime()+3*864e5);
      if(serviceDate>=lo&&serviceDate<=hi)conflict=ev;}});
    let suggested = conflict?new Date(conflict.date.getTime()-8*864e5):null;

    setResults({
      crop, ha, model: selectedTractorModel, tractor: tractorInfo, startHours, totalHours, health, detail, adjHours, serviceDate, events, conflict, suggested, startDate: start
    });
  };

  const buildCalendar = (events, D) => {
    const dates = events.map(e => e.date);
    if (dates.length === 0) return ''; // Handle case with no events

    const min = new Date(Math.min(...dates));
    const max = new Date(Math.max(...dates));
    let cursor = new Date(min.getFullYear(), min.getMonth(), 1);
    const end = new Date(max.getFullYear(), max.getMonth(), 1);
    let out = [];

    while (cursor <= end) {
      const y = cursor.getFullYear();
      const m = cursor.getMonth();
      const monthEvents = events.filter(e => e.date.getFullYear() === y && e.date.getMonth() === m);
      const firstDow = new Date(y, m, 1).getDay();
      const daysIn = new Date(y, m + 1, 0).getDate();

      let allCells = [];
      for (let i = 0; i < firstDow; i++) allCells.push(<div key={`empty-${i}`} className="day empty"></div>);
      for (let d = 1; d <= daysIn; d++) {
        const dayEv = monthEvents.filter(e => e.date.getDate() === d);
        let inWindow = false;
        let isConflict = false;
        const thisDate = new Date(y, m, d);

        D.events.forEach(ev => {
          if (ev.critical) {
            const lo = new Date(ev.date.getTime() - 3 * 864e5);
            const hi = new Date(ev.date.getTime() + 3 * 864e5);
            if (thisDate >= lo && thisDate <= hi) inWindow = true;
          }
        });
        if (D.conflict && dayEv.some(e => e.isService)) isConflict = true;

        const pills = dayEv.slice(0, 2).map((e, idx) => (
          <div key={`pill-${d}-${idx}`} className={`ev-pill ${e.cls}`}>
            {iconFor(e.cls)} {e.isService ? 'Servicio' : e.name}
          </div>
        ));
        allCells.push(
          <div key={`day-${d}`} className={`day ${dayEv.length ? 'has-event' : ''} ${inWindow ? 'window' : ''} ${isConflict ? 'service-conflict' : ''}`}>
            <div className="dnum">{d}</div>{pills}
          </div>
        );
      }

      while (allCells.length % 7 !== 0) allCells.push(<div key={`empty-end-${allCells.length}`} className="day empty"></div>);

      let weeks = [];
      for (let i = 0; i < allCells.length; i += 7) {
        weeks.push(<div key={`week-${y}-${m}-${i}`} className="week">{allCells.slice(i, i + 7)}</div>);
      }

      out.push(
        <div key={`month-${y}-${m}`} className="month">
          <div className="month-h">
            {MONTHS[m]} {y}<span className="m-count">{monthEvents.length ? monthEvents.length + ' eventos' : '—'}</span>
          </div>
          <div className="dow"><span>D</span><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span></div>
          {weeks}
        </div>
      );
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return out;
  };

  const renderResults = useMemo(() => {
    if (!results) {
      return (
        <div className="empty">
          <svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="#cfd8cc" strokeWidth="1.4"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>
          <p>Elige cultivo y tractor,<br/>luego "Generar calendario"</p>
        </div>
      );
    }

    const D = results;
    // const hc = D.health >= 70 ? 'green' : D.health >= 45 ? 'amber' : 'red'; // Ya no se usa para el medidor
    // const circ = 2 * Math.PI * 54; // Ya no se usa para el medidor
    // const off = circ * (1 - D.health / 100); // Ya no se usa para el medidor
    let vTxt,vCls;
    if(D.health >= 70){vCls='green';vTxt='Motor en buen estado. El servicio cae por uso normal, sin urgencia.';}
    else if(D.health >= 45){vCls='amber';vTxt='Hay sensores fuera de rango. El servicio se <b>adelanta</b> como precaución.';}
    else{vCls='red';vTxt='Varios sensores en zona crítica. <b>Riesgo alto de falla</b> — el servicio se adelanta de forma importante.';}
    const allEv=[...D.events.map(e=>({...e})), {name:'Servicio motor',date:D.serviceDate,cls:'service',critical:false,isService:true}];

    return (
      <div className="stagger">
        <div className="kpis">
          <div className="kpi"><div className="k-label">Horas de trabajo</div><div className="k-val">{D.totalHours}<span className="k-unit"> h</span></div></div>
          <div className="kpi"><div className="k-label">Trabajos</div><div className="k-val">{D.events.length}<span className="k-unit"> ops</span></div></div>
          <div className="kpi"><div className="k-label">Salud motor</div><div className="k-val" style={{ color: `var(--${vCls})` }}>{D.health}<span className="k-unit">/100</span></div></div>
          <div className="kpi"><div className="k-label">Servicio en</div><div className="k-val">{D.adjHours}<span className="k-unit"> h</span></div></div>
        </div>
        {D.conflict ? (
          <div className="alert-box danger"><div className="a-icon">⚠️</div><div className="a-txt">
            <h4>El mantenimiento choca con una fecha crítica</h4>
            <p>El servicio previsto (<b>{fmt(D.serviceDate)}</b>) cae junto a <b>{D.conflict.name}</b>. Recomendación: <b>adelantarlo al {fmt(D.suggested)}</b> para no perder días en plena operación.</p>
          </div></div>
        ) : (
          <div className="alert-box safe"><div className="a-icon">✅</div><div className="a-txt">
            <h4>Sin conflictos de mantenimiento</h4>
            <p>El servicio previsto (<b>{fmt(D.serviceDate)}</b>) no choca con la siembra ni la cosecha.</p>
          </div></div>
        )}
        {/* Eliminamos la sección de "Predicción de falla · 10 sensores del motor" */}
        {/*
        <div className="res-section">
          <div className="res-title">Predicción de falla · 10 sensores del motor</div>
          <div className="health-card">
            <div className="gauge"><svg width="130" height="130">
              <circle cx="65" cy="65" r="54" fill="none" stroke="var(--line)" strokeWidth="9"/>
              <circle cx="65" cy="65" r="54" fill="none" stroke={`var(--${hc})`} strokeWidth="9" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset 1s ease' }}/>
            </svg><div className="g-center"><div className="g-pct" style={{ color: `var(--${hc})` }}>{D.health}</div><div className="g-lbl">salud</div></div></div>
            <div className="health-detail">
              <h3>{D.model}</h3>
              <div className="machine-name">{D.tractor.label} · {D.startHours.toLocaleString()} h acumuladas</div>
              <div className="verdict ${vCls}" dangerouslySetInnerHTML={{ __html: vTxt }}></div>
            </div>
          </div>
          <div className="sensor-grid">
            {D.detail.map(s => (
              <div key={s.key} className="sgi">
                <span className={`sr-dot ${s.status}`}></span>
                <span className="sg-name">{s.name}</span>
                <span className="sg-val">{fmtVal(s.key, s.val)}{s.unit}</span>
              </div>
            ))}
          </div>
        </div>
        */}
        <div className="res-section">
          <div className="res-title">Calendario de la temporada</div>
          <div className="cal-legend">
            <div className="leg"><span className="chip plant"></span>Siembra</div>
            <div className="leg"><span className="chip fert"></span>Fertilización</div>
            <div className="leg"><span className="chip spray"></span>Fumigación</div>
            <div className="leg"><span className="chip harvest"></span>Cosecha</div>
            <div className="leg"><span className="chip service"></span>Servicio</div>
          </div>
          <div className="cal-months">{buildCalendar(allEv, D)}</div>
        </div>
      </div>
    );
  }, [results, jobCounts]); // Added jobCounts to dependencies to re-render when job counts change

  return (
    <div className="planificacion-container">
      <div className="jd-bar">
        <div className="jd-bar-inner">
          <div className="jd-logo">
            <svg className="leaf" viewBox="0 0 32 32" fill="#ffde00"><path d="M16 2C9 6 5 13 6 22c0 0 4-9 11-13C12 14 9 20 10 28c4 1 9-1 12-5 4-5 4-13 0-21-2 2-4 1-6 0z"/></svg>
            John Deere
          </div>
          {/* Navigation will be handled by App.jsx */}
        </div>
      </div>

      <div className="wrap">
        <div className="page-head">
          <h1>Planeador de Temporada</h1>
          <p>Elige tu cultivo y tu tractor. El sistema lee los <span className="strong">sensores del motor</span>, predice cuándo necesitará servicio y arma el <span class="strong">calendario de la temporada</span>, avisándote si el mantenimiento choca con la siembra o la cosecha.</p>
        </div>

        <div className="grid">
          <div className="card fade-in">
            <div className="card-h"><span className="ic">1</span><h2>Tu temporada</h2></div>
            <div className="card-body">
              <div className="field">
                <label>¿Qué vas a cultivar?</label>
                <select id="crop" value={selectedCrop} onChange={(e) => setSelectedCrop(e.target.value)}>
                  {Object.keys(CROPS).map(key => (
                    <option key={key} value={key}>{CROPS[key].label}</option>
                  ))}
                </select>
              </div>
              <div className="two">
                <div className="field">
                  <label>Hectáreas</label>
                  <input type="number" id="hectares" value={hectares} onChange={(e) => setHectares(e.target.value)} min="1" max="5000" />
                </div>
                <div className="field">
                  <label>Día de inicio</label>
                  <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
              </div>

              <div className="field" style={{ marginBottom: '6px' }}>
                <label>Trabajos recomendados para esta cosecha <span style={{ color: 'var(--jd-green)', textTransform: 'none' }}>· edita las veces</span></label>
                <div className="jobs-box" id="jobsBox">
                  {CROPS[selectedCrop].jobs.map(job => (
                    <div className="job-row" key={job.key}>
                      <div className={`job-ic ${job.cls}`}>{iconFor(job.cls)}</div>
                      <div className="job-name">{job.name}<small>{job.hrsPerHa} h/ha</small></div>
                      <div className="stepper">
                        <button onClick={() => handleStepJob(job.key, -1)} disabled={jobCounts[job.key] <= 0}>–</button>
                        <span className="val" id={`jc-${job.key}`}>{jobCounts[job.key] || 0}</span>
                        <button onClick={() => handleStepJob(job.key, 1)} disabled={jobCounts[job.key] >= 9}>+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="field"><label>Tractor a usar</label>
                <select id="tractor" value={selectedTractorModel} onChange={(e) => setSelectedTractorModel(e.target.value)}>
                  {Object.keys(TRACTORS).map(key => (
                    <option key={key} value={key}>{TRACTORS[key].label}</option>
                  ))}
                </select>
              </div>

              <div className="field" style={{ marginBottom: '6px' }}>
                <label>Sensores del motor <span style={{ color: 'var(--green)', textTransform: 'none' }}>· se cargan solos</span></label>
                <div className="sensor-readout" id="sensorReadout">
                  <div className="sr-head"><span className="live"></span><span>Telemetría JDLink · {selectedTractorModel} · en vivo</span></div>
                  {sensorDetail.map(s => (
                    <div className="sr-row" key={s.key}>
                      <span className={`sr-dot ${s.status}`}></span>
                      <span className="sr-name">{s.name}</span>
                      <span className="sr-val">{fmtVal(s.key, s.val)}{s.unit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button className="run-btn" onClick={runSimulation}>Generar calendario</button>
            </div>
          </div>

          <div className="card fade-in" style={{ animationDelay: '.08s' }}>
            <div className="card-h"><span className="ic">2</span><h2>Plan de temporada</h2></div>
            <div className="card-body">
              <div id="results">
                {renderResults}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer><div className="wrap">Prototipo Hackathon · Sensores simulados con base en telemetría JDLink / ISO 15143-3</div></footer>
    </div>
  );
}

export default Planificacion;