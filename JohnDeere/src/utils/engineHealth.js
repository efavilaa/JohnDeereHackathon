// ===== TRACTORES — 10 sensores cada uno (en producción llegan por JDLink) =====
export const TRACTORS = {
  '6M':  { label:'John Deere 6M (110-195 HP)', serviceInterval:500,
    s:{coolantTemp:85,vibration:0.42,rpm:2050,oilPressure:48,hydPressure:2950,engineHours:1850,engineLoad:62,oilTemp:90,tempRise:0.6,timeOver95:4} },
  '6R':  { label:'John Deere 6R (110-250 HP)', serviceInterval:500,
    s:{coolantTemp:92,vibration:0.65,rpm:2150,oilPressure:38,hydPressure:2400,engineHours:3420,engineLoad:78,oilTemp:96,tempRise:1.8,timeOver95:24} },
  '7R':  { label:'John Deere 7R (210-330 HP)', serviceInterval:600,
    s:{coolantTemp:97,vibration:0.88,rpm:2310,oilPressure:34,hydPressure:2300,engineHours:4480,engineLoad:85,oilTemp:101,tempRise:2.4,timeOver95:41} },
  '8R':  { label:'John Deere 8R (230-410 HP)', serviceInterval:750,
    s:{coolantTemp:83,vibration:0.35,rpm:1950,oilPressure:52,hydPressure:3050,engineHours:920, engineLoad:55,oilTemp:88,tempRise:0.4,timeOver95:2} },
  '8RX': { label:'John Deere 8RX (310-540 HP)',serviceInterval:750,
    s:{coolantTemp:106,vibration:1.35,rpm:2520,oilPressure:26,hydPressure:2050,engineHours:6240,engineLoad:94,oilTemp:112,tempRise:3.6,timeOver95:78} }
};

// ===== ESPEC. de los 10 sensores: rango sano + peso =====
export const SPEC = {
  coolantTemp:{ name:'Temperatura motor',     unit:'°C',     good:[80,98],     weight:14 },
  vibration:  { name:'Vibración RMS',         unit:'g',      good:[0,0.7],     weight:14 },
  rpm:        { name:'RPM motor',             unit:'rpm',    good:[1800,2300], weight:7  },
  oilPressure:{ name:'Presión de aceite',     unit:'psi',    good:[40,60],     weight:15, low:true },
  hydPressure:{ name:'Presión hidráulica',    unit:'psi',    good:[2600,3200], weight:11, low:true },
  engineHours:{ name:'Horas acumuladas',      unit:'h',      good:[0,5000],    weight:9  },
  engineLoad: { name:'Carga del motor',       unit:'%',      good:[0,85],      weight:9  },
  oilTemp:    { name:'Temperatura de aceite', unit:'°C',     good:[80,100],    weight:9  },
  tempRise:   { name:'Cambio temp./min',      unit:'°C/min', good:[0,1.5],     weight:7  },
  timeOver95: { name:'Tiempo arriba de 95°C', unit:'min',    good:[0,20],      weight:5  }
};

export function penalty(v,sp){const[lo,hi]=sp.good;if(v>=lo&&v<=hi)return 0;let o=v<lo?(lo-v)/Math.max(lo,1):(v-hi)/Math.max(hi,1);return Math.min(o*2.2,1);}
export function statusOf(v,sp){const p=penalty(v,sp);return p===0?'green':p<0.4?'amber':'red';}
export function fmtVal(k,v){
  if(k==='tempRise') return '+'+v+' ';
  if(k==='vibration') return v;
  return v.toLocaleString();
}

export function calculateEngineHealth(sensorData, serviceInterval) {
  let totalPenalty = 0;
  let totalWeight = 0;
  const detail = [];

  for (const k in SPEC) {
    const sp = SPEC[k];
    const value = sensorData[k];
    const p = penalty(value, sp);
    totalPenalty += p * sp.weight;
    totalWeight += sp.weight;
    detail.push({ key: k, name: sp.name, unit: sp.unit, val: value, status: statusOf(value, sp) });
  }

  let health = Math.round(100 - (totalPenalty / totalWeight) * 100);
  health = Math.min(health, 96); // techo de 96: ningún motor en uso real marca 100 (siempre hay desgaste base)
  health = Math.max(0, health); // Asegurar que no sea negativo

  const nextByInterval = Math.ceil(sensorData.engineHours / serviceInterval) * serviceInterval;
  let hoursUntil = nextByInterval - sensorData.engineHours;
  if (hoursUntil <= 0) hoursUntil = serviceInterval; // Si ya pasó el intervalo, el próximo es en un intervalo completo

  // Ajustar las horas restantes hasta el servicio basado en la salud del motor
  const adjHours = Math.round(hoursUntil * (0.45 + 0.55 * (health / 100)));

  return { health, detail, adjHours, serviceInterval, engineHours: sensorData.engineHours };
}
