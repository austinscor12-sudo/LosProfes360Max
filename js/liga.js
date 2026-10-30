import { PRIMERA, NACIONAL } from "./data/equipos.js";
import { ZONA_A, CLASICOS, INTERZONAL2 } from "./data/liga.js";
import { fuerzaDe } from "./data/fuerza.js";
import { RONDAS_COPA } from "./fixture.js";

const TORNEOS = [["AP", "Torneo Apertura"], ["CL", "Torneo Clausura"]];

const mezclar = a => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
};
const poisson = l => { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= Math.random(); } while (p > L); return k - 1; };

// Crea la liga completa: 30 equipos, 2 zonas de 15, 16 fechas por torneo (14 de zona + 2 interzonales).
// Índices 0-14 = zona A, 15-29 = zona B. Cada fecha es { m: [ { h, v, gl, gv } ] } (h = local, v = visitante; gl/gv aparecen al jugarse).
// Va en objetos porque Firestore no admite arrays dentro de arrays.
export function crearLiga(miEquipo) {
  const A = mezclar(ZONA_A);
  const B = A.map(a => INTERZONAL2[a]);          // B[r] es el rival interzonal de A[r]
  const equipos = [...A, ...B];
  const miIdx = equipos.indexOf(miEquipo);
  if (miIdx < 0) return null;

  const bal = new Array(30).fill(0);             // localías menos visitas, para repartirlas parejo
  const localia = (x, y) => {
    const xLocal = bal[x] === bal[y] ? Math.random() < 0.5 : bal[x] < bal[y];
    const [h, v] = xLocal ? [x, y] : [y, x];
    bal[h]++; bal[v]--;
    return { h, v };
  };

  const ap = [];
  for (let r = 0; r < 15; r++) {
    const fecha = [];
    for (const base of [0, 15]) {
      for (let i = 0; i < 15; i++) {
        if (i === r) continue;                   // el equipo en la posición r descansa en la ronda r
        const j = (((2 * r - i) % 15) + 15) % 15;
        if (i < j) fecha.push(localia(base + i, base + j));
      }
    }
    fecha.push(localia(r, 15 + r));              // los dos que descansan juegan el interzonal
    ap.push({ m: fecha });
  }
  ap.push({ m: A.map(a => localia(equipos.indexOf(a), equipos.indexOf(CLASICOS[a]))) });   // fecha 16: clásicos
  const cl = ap.map(f => ({ m: f.m.map(x => ({ h: x.v, v: x.h })) }));                      // Clausura: localías invertidas
  const fixture = { AP: ap, CL: cl };

  return { zona: miIdx < 15 ? "A" : "B", equipos, fixture, calendario: calendarioUsuario(equipos, fixture, miIdx) };
}

// Calendario del usuario (lista de sus partidos) a partir del fixture completo.
export function calendarioUsuario(equipos, fixture, miIdx) {
  const cal = [];
  const copaRival = (() => {
    const pool = [...PRIMERA, ...NACIONAL].filter(n => n !== equipos[miIdx]);
    return pool[Math.floor(Math.random() * pool.length)];
  })();
  const copa = { id: "CA-1", comp: "Copa Argentina", etiqueta: RONDAS_COPA[0], rival: copaRival, local: null, jugado: false };
  for (const [clave, comp] of TORNEOS) {
    fixture[clave].forEach((fecha, f) => {
      const m = fecha.m.find(x => x.h === miIdx || x.v === miIdx);
      const local = m.h === miIdx;
      const rivalIdx = local ? m.v : m.h;
      const interzonal = (rivalIdx < 15) !== (miIdx < 15);
      const extra = f === 15 ? " · Clásico" : interzonal ? " · Interzonal" : "";
      cal.push({ id: `${clave}-${f + 1}`, comp, torneo: clave, fecha: f, etiqueta: `Fecha ${f + 1}${extra}`, rival: equipos[rivalIdx], local, jugado: false });
    });
    if (clave === "AP") cal.splice(5, 0, copa);
  }
  return cal;
}

const simularOtro = (equipos, h, v) => {
  const d = fuerzaDe(equipos[h]) - fuerzaDe(equipos[v]) + 3;
  return [Math.min(6, poisson(1.05 * Math.exp(d * 0.02))), Math.min(6, poisson(0.95 * Math.exp(-d * 0.02)))];
};

// Guarda el resultado del usuario en el fixture y simula el resto de los partidos de esa fecha.
export function registrarFecha(p, partido) {
  const fecha = p.fixture?.[partido.torneo]?.[partido.fecha]?.m;
  if (!fecha) return;
  const miIdx = p.equiposLiga.indexOf(p.equipo);
  for (const m of fecha) {
    if (m.gl !== undefined) continue;
    if (m.h === miIdx || m.v === miIdx) { m.gl = partido.resultado.local; m.gv = partido.resultado.visitante; }
    else { const [gl, gv] = simularOtro(p.equiposLiga, m.h, m.v); m.gl = gl; m.gv = gv; }
  }
}

// Torneo "actual": el del próximo partido de liga del usuario (o el Clausura si ya no quedan).
export function torneoActual(p) {
  return p.calendario.find(m => m.torneo && m.jugado !== true)?.torneo || "CL";
}

// Tabla para los equipos `idxs`, sumando los torneos indicados. Los interzonales cuentan para la zona de cada equipo.
export function calcularTabla(p, torneos, idxs) {
  const filas = new Map(idxs.map(i => [i, { i, nombre: p.equiposLiga[i], pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0 }]));
  const sumar = (f, gf, gc) => {
    if (!f) return;
    f.pj++; f.gf += gf; f.gc += gc;
    if (gf > gc) { f.pg++; f.pts += 3; } else if (gf === gc) { f.pe++; f.pts += 1; } else f.pp++;
  };
  for (const t of torneos) for (const fecha of p.fixture[t]) for (const m of fecha.m) {
    if (m.gl === undefined) continue;
    sumar(filas.get(m.h), m.gl, m.gv);
    sumar(filas.get(m.v), m.gv, m.gl);
  }
  return [...filas.values()].sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf || a.nombre.localeCompare(b.nombre));
}

// Puesto del usuario en su zona, en el torneo actual.
export function puestoEnZona(p) {
  const t = torneoActual(p), miIdx = p.equiposLiga.indexOf(p.equipo), base = miIdx < 15 ? 0 : 15;
  const filas = calcularTabla(p, [t], Array.from({ length: 15 }, (_, k) => base + k));
  const k = filas.findIndex(f => f.i === miIdx);
  return { torneo: t, puesto: k + 1, pj: filas[k].pj };
}