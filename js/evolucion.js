// Evolución del jugador: entrenamiento, lesiones, contratos, transferencias y paso de temporada.
import { fuerzaEquipo, nivelPlantel } from "./data/fuerzas.js";
import { PRIMERA, NACIONAL, LIGAS } from "./data/equipos.js";
import { COMPETICIONES } from "./data/competiciones.js";
import { generarAtributos, calcularOverall } from "./atributos.js";
import { generarCalendario } from "./fixture.js";

const ent = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const lim = (n, a, b) => Math.max(a, Math.min(b, n));
const pick = a => a[Math.floor(Math.random() * a.length)];
const mezclar = a => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
export const FISICOS = ["ritmo", "fisico", "velocidad"];
export const usd = n => "USD " + Math.round(n).toLocaleString("es-AR");

export const INTENSIDADES = {
  descanso: { nombre: "Descanso", desc: "Recuperás fatiga rápido. No hay progreso.", xp: 0, fatiga: -12, riesgo: 0 },
  suave: { nombre: "Suave", desc: "Progreso lento y casi sin riesgo.", xp: 5, fatiga: 0, riesgo: .004 },
  normal: { nombre: "Normal", desc: "Equilibrio entre progreso y desgaste.", xp: 9, fatiga: 4, riesgo: .01 },
  intenso: { nombre: "Intenso", desc: "Progreso rápido, pero más fatiga y riesgo de lesión.", xp: 15, fatiga: 10, riesgo: .025 }
};
export const FOCO_POR_POS = { DEL: "tiro", MED: "pase", DEF: "defensa", ARQ: "reflejos" };

/* ---------- Lesiones ---------- */
const LESIONES = [
  { g: "Leve", peso: 55, min: 1, max: 2, lista: ["Golpe en el muslo", "Contractura", "Sobrecarga muscular", "Molestia en el tobillo"] },
  { g: "Moderada", peso: 28, min: 3, max: 6, lista: ["Esguince de tobillo", "Distensión muscular", "Tendinitis rotuliana", "Lesión en el aductor"] },
  { g: "Grave", peso: 14, min: 7, max: 14, lista: ["Desgarro muscular", "Fractura de metatarsiano", "Lesión de menisco"] },
  { g: "Muy grave", peso: 3, min: 18, max: 30, lista: ["Rotura de ligamentos cruzados", "Fractura de tibia"] }
];
export function generarLesion(suave = false) {
  let r = Math.random() * (suave ? 83 : 100), l = LESIONES[0];
  for (const x of LESIONES) { if ((r -= x.peso) < 0) { l = x; break; } }
  const total = ent(l.min, l.max);
  return { nombre: pick(l.lista), gravedad: l.g, total, restantes: total };
}
export function aplicarLesion(p, les) {
  les.nueva = true; p.lesion = les; p.temp.lesiones++;
  if (les.gravedad === "Muy grave") {
    const perd = [];
    for (const k of FISICOS) if (p.atributos[k] != null) { const d = ent(1, 3); p.atributos[k] = Math.max(25, p.atributos[k] - d); perd.push(`${k} -${d}`); }
    les.secuela = perd.join(", ");
    p.progreso.overall = calcularOverall(p.posicion, p.atributos);
  }
  return les;
}

/* ---------- Valor, rol y contrato ---------- */
export function valorMercado(ovr, edad, pot) {
  const f = edad <= 21 ? 1.6 : edad <= 25 ? 1.25 : edad <= 28 ? 1 : edad <= 31 ? .6 : edad <= 34 ? .3 : .12;
  const extra = edad <= 24 ? 1 + Math.max(0, pot - ovr) * .03 : 1;
  return Math.max(5000, Math.round(25000 * Math.pow(1.19, ovr - 50) * f * extra / 1000) * 1000);
}
export const salarioPara = v => Math.max(1500, Math.round(v * .012 / 100) * 100);
export const potencialInicial = (ovr, edad) => Math.min(92, ovr + Math.max(2, Math.round((27 - edad) * 1.8 + ent(0, 8))));
export const rolSegun = d => d >= 8 ? "Figura del plantel" : d >= 3 ? "Titular indiscutido" : d >= -2 ? "Titular" : d >= -7 ? "Rotación" : d >= -12 ? "Suplente" : "Juvenil de proyección";
export const rolEstimado = p => rolSegun(p.progreso.overall - nivelPlantel(p.equipo));
export const probTitular = p => lim(.55 + (p.progreso.overall - nivelPlantel(p.equipo)) * .045 + ((p.forma ?? 60) - 60) * .003, .05, .97);
export const valorActual = p => valorMercado(p.progreso.overall, p.jugador.edad, p.potencial);

export const nuevaTemp = () => ({ equipoPJ: 0, partidos: 0, titular: 0, minutos: 0, goles: 0, asist: 0, notaSuma: 0, amarillas: 0, rojas: 0, figuras: 0, lesiones: 0, pos: {}, copa: "" });

// Completa partidas viejas a las que les faltan datos. Devuelve true si cambió algo.
export function completarPartida(p) {
  let c = false; const j = p.jugador;
  const set = (k, v) => { if (p[k] === undefined) { p[k] = typeof v === "function" ? v() : v; c = true; } };
  if (!p.atributos) { p.atributos = generarAtributos(p.posicion, j, p.liga); c = true; }
  if (!p.calendario) { p.calendario = generarCalendario(p.equipo, p.liga); c = true; }
  const ovr = calcularOverall(p.posicion, p.atributos);
  if (p.progreso.overall !== ovr) { p.progreso.overall = ovr; c = true; }
  set("potencial", () => potencialInicial(ovr, j.edad));
  set("fatiga", 10); set("forma", 60); set("lesion", null); set("renov", null); set("fin", null);
  set("plan", () => ({ foco: FOCO_POR_POS[p.posicion] || Object.keys(p.atributos)[0], intensidad: "normal" }));
  set("xp", {}); set("temp", nuevaTemp); set("tablas", {}); set("historial", []); set("palmares", []); set("traspasos", []); set("ahorros", 0);
  set("contrato", () => ({ anios: ent(2, 3), salario: salarioPara(valorMercado(ovr, j.edad, p.potencial)) }));
  return c;
}

/* ---------- Entrenamiento semanal ---------- */
const edadF = e => e <= 20 ? 1.5 : e <= 23 ? 1.25 : e <= 26 ? 1 : e <= 29 ? .7 : e <= 32 ? .4 : .2;

// Se llama una vez por partido de tu equipo (una "semana"). jug = estadísticas del partido o null si no jugaste.
export function entrenarSemana(p, jug) {
  const out = { mejoras: [], lesion: null, recuperado: null };
  const I = INTENSIDADES[p.lesion ? "suave" : p.plan.intensidad];
  const edad = p.jugador.edad;

  // Lesión: cuenta un partido menos (salvo la semana en que te lesionaste).
  if (p.lesion) {
    if (p.lesion.nueva) delete p.lesion.nueva;
    else if (--p.lesion.restantes <= 0) { out.recuperado = p.lesion; p.lesion = null; }
  }
  // Fatiga y forma
  p.fatiga = lim(Math.round((p.fatiga + (jug?.minutos || 0) / 90 * 14 + I.fatiga) * .75), 0, 100);
  p.forma = Math.round(p.forma + (60 - p.forma) * .15);
  p.ahorros = (p.ahorros || 0) + Math.round(p.contrato.salario * .4);

  // Experiencia de entrenamiento
  const gap = p.potencial - p.progreso.overall;
  const gf = gap <= 0 ? .4 : Math.min(1.5, .6 + gap / 12);
  const tope = Math.min(99, p.potencial + 12);
  const ganar = (k, n) => {
    if (!(k in p.atributos) || n <= 0) return;
    p.xp[k] = (p.xp[k] || 0) + n;
    while (p.xp[k] >= 100 && p.atributos[k] < tope) { p.xp[k] -= 100; p.atributos[k]++; out.mejoras.push({ k, a: p.atributos[k] }); }
    if (p.atributos[k] >= tope) p.xp[k] = Math.min(p.xp[k], 99);
  };
  ganar(p.plan.foco, I.xp * edadF(edad) * gf);
  if (I.xp) ganar(pick(Object.keys(p.atributos).filter(k => k !== p.plan.foco)), I.xp * edadF(edad) * gf * .3);
  if (jug?.nota) ganar(FOCO_POR_POS[p.posicion], Math.max(0, jug.nota - 6) * 4 * edadF(edad));
  p.progreso.overall = calcularOverall(p.posicion, p.atributos);

  // Lesión en el entrenamiento
  if (!p.lesion && Math.random() < I.riesgo * (1 + p.fatiga / 100)) { out.lesion = aplicarLesion(p, generarLesion(true)); }
  return out;
}

/* ---------- Cambio de temporada ---------- */
function cambioAnual(e, fis) {
  if (e <= 20) return ent(1, 3);
  if (e <= 23) return ent(0, 2);
  if (e <= 27) return fis ? ent(0, 1) : ent(0, 2);
  if (e <= 30) return fis ? ent(-2, 0) : ent(-1, 1);
  if (e <= 33) return fis ? ent(-3, -1) : ent(-2, 0);
  return fis ? ent(-4, -2) : ent(-3, -1);
}
export function evolucionAnual(p) {
  const j = p.jugador; j.edad++;
  const e = p.posicion === "ARQ" ? j.edad - 3 : j.edad;
  const antes = p.progreso.overall, cambios = [];
  for (const k in p.atributos) {
    let d = cambioAnual(e, FISICOS.includes(k));
    if (d > 0 && antes >= p.potencial) d = Math.round(d / 2);
    const de = p.atributos[k]; p.atributos[k] = lim(de + d, 25, 95);
    if (p.atributos[k] !== de) cambios.push({ k, de, a: p.atributos[k] });
  }
  p.progreso.overall = calcularOverall(p.posicion, p.atributos);
  p.potencial = j.edad >= 27 ? p.progreso.overall : Math.max(p.progreso.overall, p.potencial + ent(-2, 2));
  return { edad: j.edad, antes, despues: p.progreso.overall, cambios };
}

/* ---------- Ofertas, renovación y fichajes ---------- */
const TODOS = [...PRIMERA, ...NACIONAL];
const ligaDe = n => PRIMERA.includes(n) ? "AR1" : "AR2";

export function generarOfertas(p, libre) {
  const ovr = p.progreso.overall, t = p.temp, val = valorActual(p);
  const nota = t.partidos ? t.notaSuma / t.partidos : 6;
  const interes = (ovr - nivelPlantel(p.equipo)) * .6 + (nota - 6.2) * 5 + Math.max(0, p.potencial - ovr) * .25 + (t.goles + t.asist) * .1;
  let n = lim(Math.round(interes / 3 + Math.random() * 1.7 - .4), 0, 4);
  if (libre) n = Math.max(n, 2);
  let pool = TODOS.filter(x => x !== p.equipo && nivelPlantel(x) <= ovr + 4 && nivelPlantel(x) >= ovr - 14);
  if (pool.length < n) pool = TODOS.filter(x => x !== p.equipo).sort((a, b) => Math.abs(nivelPlantel(a) - ovr + 4) - Math.abs(nivelPlantel(b) - ovr + 4)).slice(0, 8);
  return mezclar(pool).slice(0, n).map(club => ({
    equipo: club, liga: ligaDe(club), rol: rolSegun(ovr - nivelPlantel(club)), anios: ent(2, 4),
    salario: Math.round(salarioPara(val) * (.9 + Math.random() * .5) * (fuerzaEquipo(club) / 66) * (libre ? 1.1 : 1) / 100) * 100,
    monto: libre ? 0 : Math.round(val * (.8 + Math.random() * .6) / 1000) * 1000
  }));
}

function cambiarLiga(p, id) {
  p.liga = id; p.ligaNombre = LIGAS.find(l => l.id === id).nombre; p.competiciones = COMPETICIONES[id];
}
export function fichar(p, o) {
  p.traspasos.push({ temporada: p.temporada, de: p.equipo, a: o.equipo, monto: o.monto });
  p.equipo = o.equipo;
  if (p.liga !== o.liga) cambiarLiga(p, o.liga);
  p.contrato = { anios: o.anios, salario: o.salario }; p.renov = { estado: "firmada" };
  if (p.fin) { p.fin.ascenso = false; p.fin.descenso = false; p.fin.fichado = true; }
}

export function obtenerRenov(p) {
  if (!p.renov) {
    const d = p.progreso.overall - nivelPlantel(p.equipo);
    if (d < -8 && p.jugador.edad > 21 && Math.random() < .6) p.renov = { estado: "no" };
    else p.renov = { estado: "abierta", anios: ent(2, 4), salario: Math.round(salarioPara(valorActual(p)) * (1.05 + Math.max(0, d) * .01) / 100) * 100, pedidos: 0 };
  }
  return p.renov;
}
export function pedirMas(p) {
  if (Math.random() < .4) { p.renov = { estado: "retirada" }; return false; }
  p.renov.salario = Math.round(p.renov.salario * 1.2 / 100) * 100; p.renov.pedidos++; return true;
}
export function firmarRenov(p) {
  p.contrato = { anios: p.renov.anios, salario: p.renov.salario }; p.renov = { estado: "firmada" };
}

/* ---------- Fin de temporada ---------- */
export function iniciarFin(p) {
  const t = p.temp, pos = t.pos;
  p.historial.push({ temporada: p.temporada, equipo: p.equipo, partidos: t.partidos, goles: t.goles, asist: t.asist, nota: t.partidos ? +(t.notaSuma / t.partidos).toFixed(2) : 0, pos, copa: t.copa });
  const evo = evolucionAnual(p);
  p.contrato.anios = Math.max(0, p.contrato.anios - 1);
  const ascenso = p.liga === "AR2" && pos["Primera Nacional"] > 0 && pos["Primera Nacional"] <= 2;
  const ap = pos["Torneo Apertura"], cl = pos["Torneo Clausura"];
  const descenso = p.liga === "AR1" && ap && cl && (ap + cl) / 2 >= 14;
  return { paso: 0, evo, ofertas: generarOfertas(p, p.contrato.anios === 0), ascenso, descenso, fichado: false };
}
export function comenzarTemporada(p) {
  if (p.fin.ascenso) cambiarLiga(p, "AR1");
  if (p.fin.descenso) cambiarLiga(p, "AR2");
  p.temporada++; p.temp = nuevaTemp(); p.tablas = {};
  p.calendario = generarCalendario(p.equipo, p.liga);
  p.fatiga = Math.round(p.fatiga * .3); p.forma = 60;
  if (p.lesion) { p.lesion.restantes -= 3; if (p.lesion.restantes <= 0) p.lesion = null; }
  p.renov = null; p.fin = null;
}