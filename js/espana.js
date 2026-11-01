// España: LaLiga, Segunda División, Primera Federación, Copa del Rey, Supercopa y cupos europeos.
// El "mundo" de España vive en p.esp: quiénes juegan en cada categoría. Cambia al final de cada temporada con los ascensos y descensos.
import { LALIGA, SEGUNDA, TERCERA, INFERIORES, FILIALES } from "./data/equipos.js";
import { fuerzaDe } from "./data/fuerza.js";
import { TEMPORADA_INICIAL } from "./data/competiciones.js";

export const COPA_REY = "Copa del Rey";
export const SUPERCOPA = "Supercopa de España";
export const NIVELES_ESP = ["ES1", "ES2", "ES3"];
export const esLigaEsp = id => NIVELES_ESP.includes(id);
export const COMP_LIGA = { ES1: "LaLiga", ES2: "Segunda División", ES3: "Primera Federación" };
export const RONDAS_REY = ["Primera ronda", "Segunda ronda", "Dieciseisavos de final", "Octavos de final", "Cuartos de final", "Semifinal (ida)", "Semifinal (vuelta)", "Final"];

const ENTRADA = { ES1: 2, ES2: 1, ES3: 0 };            // ronda de la Copa en la que entra cada categoría
const OFFSET = [4, 4, 5, 4, 3, 3, 4];                    // partidos hasta la ronda siguiente, según la ronda que se acaba de jugar
const PLAZAS = { descensoES1: 3, descensoES2: 4, ascensoES3: 4 };

// Campeón y subcampeón de LaLiga 2025/26 + campeón y subcampeón de la Copa del Rey 2025/26: son los que juegan la Supercopa de enero de 2027.
// Orden de cabezas: [campeón liga, subcampeón liga, campeón copa, subcampeón copa]. Cruces: 1.º vs 4.º y 2.º vs 3.º.
const SUPERCOPA_2026 = ["Barcelona", "Real Madrid", "Real Sociedad", "Atlético de Madrid"];

const mezclar = a => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const poisson = l => { const L = Math.exp(-l); let k = 0, x = 1; do { k++; x *= Math.random(); } while (x > L && k < 12); return k - 1; };
const ponderado = (lista, peso) => {
  let u = Math.random() * lista.reduce((s, n) => s + peso(n), 0);
  for (const n of lista) { u -= peso(n); if (u <= 0) return n; }
  return lista[lista.length - 1];
};

/* ---------- El mundo de España ---------- */
export const nuevoMundoEsp = () => ({ ES1: [...LALIGA], ES2: [...SEGUNDA], ES3: [...TERCERA], INF: [...INFERIORES], sc: null });
export function mundoEspana(p) { if (!p.esp) p.esp = nuevoMundoEsp(); return p.esp; }
// En qué categoría juega un club ahora (null si no es de España o no hay mundo armado).
export const ligaEspDe = (p, nombre) => p.esp ? NIVELES_ESP.find(id => p.esp[id].includes(nombre)) || null : null;
// Equipos de la liga actual del jugador (si es española, con los ascensos y descensos ya aplicados).
export const equiposLigaEsp = p => esLigaEsp(p.liga) && p.esp ? p.esp[p.liga] : null;
const categoriaDe = (esp, n) => esp.ES1.includes(n) ? 1 : esp.ES2.includes(n) ? 2 : 3;

/* ---------- Simulaciones de fondo (cuando el jugador no está en esa categoría) ---------- */
const orden = t => Object.entries(t).map(([nombre, s]) => ({ ...s, nombre })).sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf).map(x => x.nombre);   // (las filas ya tienen un campo "e" = empates)
function simularLiga(equipos) {
  const t = Object.fromEntries(equipos.map(e => [e, { pts: 0, gf: 0, gc: 0 }]));
  for (const a of equipos) for (const b of equipos) {
    if (a === b) continue;                                   // a es local contra b
    const d = fuerzaDe(a) - fuerzaDe(b) + 3, ga = poisson(1.2 * Math.exp(d / 35)), gb = poisson(1.2 * Math.exp(-d / 35));
    t[a].gf += ga; t[a].gc += gb; t[b].gf += gb; t[b].gc += ga;
    if (ga > gb) t[a].pts += 3; else if (ga < gb) t[b].pts += 3; else { t[a].pts++; t[b].pts++; }
  }
  return orden(t);
}
const duelo = (x, y, ventaja = 0) => Math.random() < 1 / (1 + Math.exp(-(fuerzaDe(x) - fuerzaDe(y) + ventaja) / 9)) ? x : y;
function copaSimulada(esp, excluir) {
  const pool = [...esp.ES1, ...esp.ES2.filter(n => !FILIALES.includes(n))].filter(n => n !== excluir);
  const campeon = ponderado(pool, n => Math.exp(fuerzaDe(n) / 5));
  return { campeon, sub: ponderado(pool.filter(n => n !== campeon), n => Math.exp(fuerzaDe(n) / 5)) };
}

/* ---------- Supercopa: campeón y subcampeón de Liga + campeón y subcampeón de Copa ---------- */
// Si un finalista de Copa ya está entre los dos primeros de Liga, su lugar lo toma el siguiente de la tabla de LaLiga.
function proximaSupercopa(o1, copa) {
  const liga = [o1[0], o1[1]], usados = new Set(liga), candidatos = o1.slice(2);
  const tomar = n => {
    if (!usados.has(n)) { usados.add(n); return n; }
    const r = candidatos.find(x => !usados.has(x) && x !== copa.campeon && x !== copa.sub);
    usados.add(r); return r;
  };
  const campeonCopa = tomar(copa.campeon), subCopa = tomar(copa.sub);
  return [...liga, campeonCopa, subCopa];
}
function supercopaDe(esp, temporada) {
  if (!esp.sc || esp.sc.temporada !== temporada) {
    // Primera temporada del juego: se usan los resultados reales de 2025/26. Si el jugador llega a España más tarde, se simula la temporada anterior.
    esp.sc = { temporada, equipos: temporada === TEMPORADA_INICIAL ? [...SUPERCOPA_2026] : proximaSupercopa(simularLiga(esp.ES1), copaSimulada(esp, null)) };
  }
  return esp.sc.equipos;
}
function semifinalSupercopa(yo, eq) {
  const i = eq.indexOf(yo), par = { 0: 3, 3: 0, 1: 2, 2: 1 }[i];
  const otra = i === 0 || i === 3 ? [eq[1], eq[2]] : [eq[0], eq[3]];
  return { id: "SC-1", comp: SUPERCOPA, etiqueta: "Semifinal", rival: eq[par], local: null, jugado: false, rivalFinal: duelo(otra[0], otra[1]) };
}

/* ---------- Copa del Rey ---------- */
// Con quién te cruzás según tu categoría y la ronda: [[categoría del rival, probabilidad], ...]
const PESOS = {
  1: { 2: [[3, .6], [2, .4]], 3: [[3, .15], [2, .4], [1, .45]], 4: [[2, .2], [1, .8]], 5: [[2, .05], [1, .95]], 7: [[1, 1]] },
  2: { 1: [[3, 1]], 2: [[3, .5], [2, .5]], 3: [[3, .2], [2, .5], [1, .3]], 4: [[2, .3], [1, .7]], 5: [[1, 1]], 7: [[1, 1]] },
  3: { 0: [[3, 1]], 1: [[3, .8], [2, .2]], 2: [[3, .3], [2, .4], [1, .3]], 3: [[3, .1], [2, .4], [1, .5]], 4: [[2, .2], [1, .8]], 5: [[1, 1]], 7: [[1, 1]] }
};
const poolCat = (esp, cat, yo, usados) =>
  (cat === 1 ? esp.ES1 : cat === 2 ? esp.ES2.filter(n => !FILIALES.includes(n)) : [...esp.ES3, ...esp.INF]).filter(n => n !== yo && !usados.includes(n));
function elegirRival(esp, yo, r, usados) {
  const w = PESOS[categoriaDe(esp, yo)][r] || [[1, 1]];
  let u = Math.random(), cat = w[w.length - 1][0];
  for (const [c, pr] of w) { if ((u -= pr) < 0) { cat = c; break; } }
  const pool = poolCat(esp, cat, yo, usados);
  return pick(pool.length ? pool : poolCat(esp, 1, yo, usados).concat(poolCat(esp, 2, yo, usados)).concat(poolCat(esp, 3, yo, usados)));
}
// Partido único: se juega en la cancha del equipo de menor categoría (si son de la misma, se sortea).
const sedeUnica = (miCat, rivCat) => miCat < rivCat ? false : miCat > rivCat ? true : Math.random() < .5;
function partidoRey(esp, yo, r, usados) {
  const rival = elegirRival(esp, yo, r, usados);
  return { id: `CR-${r + 1}`, comp: COPA_REY, etiqueta: RONDAS_REY[r], rival, local: sedeUnica(categoriaDe(esp, yo), categoriaDe(esp, rival)), jugado: false };
}
const insertar = (cal, ref, off, nuevo) => { cal.splice(Math.min(cal.length, cal.indexOf(ref) + off), 0, nuevo); return nuevo; };

// Al ganar una ronda se agrega la siguiente unos partidos más adelante. Devuelve el próximo partido.
function siguienteRey(p, m) {
  const r = RONDAS_REY.indexOf(m.etiqueta), cal = p.calendario, esp = p.esp;
  const usados = cal.filter(x => x.comp === COPA_REY).map(x => x.rival);
  if (r === 4) {                                   // cuartos -> semifinal a ida y vuelta
    const rival = elegirRival(esp, p.equipo, 5, usados);
    const ida = insertar(cal, m, OFFSET[4], { id: "CR-6", comp: COPA_REY, etiqueta: RONDAS_REY[5], rival, local: Math.random() < .5, jugado: false });
    insertar(cal, ida, OFFSET[5], { id: "CR-7", comp: COPA_REY, etiqueta: RONDAS_REY[6], rival, local: !ida.local, jugado: false });
    return ida;
  }
  if (r === 6) return insertar(cal, m, OFFSET[6], { id: "CR-8", comp: COPA_REY, etiqueta: "Final", rival: elegirRival(esp, p.equipo, 7, usados), local: null, jugado: false });   // final en estadio neutral
  return insertar(cal, m, OFFSET[r], partidoRey(esp, p.equipo, r + 1, usados));
}

/* ---------- Calendario de una temporada en España ---------- */
export function calendarioEsp(esp, equipo, ligaId, temporada) {
  const inicio = Math.random() < .5;
  const ida = mezclar(esp[ligaId].filter(n => n !== equipo)).map((rival, i) => ({ rival, local: (i % 2 === 0) === inicio }));
  const vuelta = mezclar(ida).map(x => ({ rival: x.rival, local: !x.local }));
  const cal = [...ida, ...vuelta].map((x, i) => ({ id: `${ligaId}-${i + 1}`, comp: COMP_LIGA[ligaId], etiqueta: `Fecha ${i + 1}`, rival: x.rival, local: x.local, jugado: false }));
  if (!FILIALES.includes(equipo)) cal.splice(ligaId === "ES1" ? 12 : 4, 0, partidoRey(esp, equipo, ENTRADA[ligaId], []));   // las filiales no juegan la Copa
  const sc = supercopaDe(esp, temporada);
  if (sc.includes(equipo)) cal.splice(Math.min(cal.length, 18), 0, semifinalSupercopa(equipo, sc));                         // la Supercopa se juega en enero
  return cal;
}

// Resultado de un partido de Copa del Rey o Supercopa: actualiza la temporada, el palmarés y agrega la próxima ronda.
export function resolverCopaEsp(p, m, res, out) {
  const t = p.temp, cal = p.calendario, titulo = nombre => p.palmares.push({ temporada: p.temporada, titulo: nombre });
  if (m.comp === SUPERCOPA) {
    if (m.etiqueta === "Semifinal") {
      if (res.clasificado) {
        cal.splice(cal.indexOf(m) + 1, 0, { id: "SC-2", comp: SUPERCOPA, etiqueta: "Final", rival: m.rivalFinal, local: null, jugado: false });
        t.supercopa = "Finalista"; out.copa = "Pasaste a la final de la Supercopa de España.";
      } else { t.supercopa = "Eliminado en semifinales"; out.copa = "Eliminados en las semifinales de la Supercopa de España."; }
    } else if (res.clasificado) { t.supercopa = "Campeón"; titulo(SUPERCOPA); out.copa = "¡Campeón de la Supercopa de España!"; }
    else { t.supercopa = "Subcampeón"; out.copa = "Perdiste la final de la Supercopa de España."; }
    return;
  }
  if (m.etiqueta === "Semifinal (ida)") {          // la ida no elimina a nadie: el global se define en la vuelta
    const vuelta = cal.find(x => x.id === "CR-7");
    if (vuelta) vuelta.agregado = { mi: res.golesMi, riv: res.golesRiv };
    t.copa = "Semifinal: ida jugada"; out.copa = `Semifinal de ida: ${res.golesMi}-${res.golesRiv}. Se define en la vuelta.`;
    return;
  }
  const ronda = m.etiqueta.replace(/ \((ida|vuelta)\)/, "");
  if (res.clasificado) {
    if (m.etiqueta === "Final") { t.copa = "Campeón"; titulo(COPA_REY); out.copa = "¡Campeón de la Copa del Rey!"; return; }
    const s = siguienteRey(p, m);
    t.copa = `Clasificado a ${s.etiqueta.replace(/ \((ida|vuelta)\)/, "")}`; out.copa = `Pasaste a ${s.etiqueta.replace(/ \((ida|vuelta)\)/, "")} de la Copa del Rey.`;
  } else if (m.etiqueta === "Final") { t.copa = "Subcampeón"; out.copa = "Perdiste la final de la Copa del Rey."; }
  else { t.copa = `Eliminado en ${ronda}`; out.copa = `Eliminados de la Copa del Rey en ${ronda}.`; }
}

/* ---------- Cupos europeos ---------- */
// 4 a la Champions; Europa League = 5.º + campeón de Copa (si el campeón de Copa ya está en Champions o es el 5.º, ese cupo pasa al 6.º y la Conference al 7.º).
export function cuposEuropa(o1, campeonCopa) {
  const ucl = o1.slice(0, 4), [q5, q6, q7] = o1.slice(4, 7);
  const cupoCopa = ucl.includes(campeonCopa) || campeonCopa === q5 ? q6 : campeonCopa;
  return { ucl, uel: [q5, cupoCopa], uecl: [cupoCopa === q6 ? q7 : q6] };
}
export const copaEuropea = (c, n) => c.ucl.includes(n) ? "UEFA Champions League" : c.uel.includes(n) ? "UEFA Europa League" : c.uecl.includes(n) ? "UEFA Conference League" : "";

/* ---------- Fin de temporada: ascensos, descensos, playoff, Copa y Supercopa del año que viene ---------- */
function resultadoCopa(p, esp) {
  const f = p.calendario.find(x => x.comp === COPA_REY && x.etiqueta === "Final" && x.jugado === true);
  if (!f) return copaSimulada(esp, p.equipo);          // si te eliminaron antes, el resto del cuadro se simula
  const r = f.resultado || {}, gano = r.local > r.visitante || (r.local === r.visitante && f.penales && f.penales.mi > f.penales.riv);
  return gano ? { campeon: p.equipo, sub: f.rival } : { campeon: f.rival, sub: p.equipo };
}
// Playoff por el 3.er ascenso: 3.º vs 6.º y 4.º vs 5.º, y final entre los ganadores (se simula).
function playoffAscenso([a, b, c, d]) {
  const s1 = duelo(a, d, 2), s2 = duelo(b, c, 2), f = duelo(s1, s2);
  return { participantes: [a, b, c, d], semis: [{ g: s1, p: s1 === a ? d : a }, { g: s2, p: s2 === b ? c : b }], final: { g: f, p: f === s1 ? s2 : s1 } };
}

export function cierreEspana(p) {
  const esp = mundoEspana(p), id = p.liga, yo = p.equipo;
  const tabla = k => { const t = p.tablas?.[COMP_LIGA[k]]; return k === id && t && Object.keys(t).length === esp[k].length ? orden(t) : simularLiga(esp[k]); };
  const o1 = tabla("ES1"), o2 = tabla("ES2"), o3 = tabla("ES3");
  const po = playoffAscenso(o2.slice(2, 6));
  const copa = resultadoCopa(p, esp), europa = cuposEuropa(o1, copa.campeon);

  const baja1 = o1.slice(-PLAZAS.descensoES1), sube1 = [...o2.slice(0, 2), po.final.g];
  const baja2 = o2.slice(-PLAZAS.descensoES2), sube2 = o3.slice(0, PLAZAS.ascensoES3);
  let ascenso = false, descenso = false, nuevaLiga = null;
  const info = { copa, cambios: { baja1, sube1, baja2, sube2 } };
  if (id === "ES1") {
    if (baja1.includes(yo)) { descenso = true; nuevaLiga = "ES2"; }
    info.europa = { ...europa, mio: copaEuropea(europa, yo) };
  } else if (id === "ES2") {
    if (sube1.includes(yo)) { ascenso = true; nuevaLiga = "ES1"; } else if (baja2.includes(yo)) { descenso = true; nuevaLiga = "ES3"; }
    info.playoff = { ...po, participa: po.participantes.includes(yo) };
  } else if (sube2.includes(yo)) { ascenso = true; nuevaLiga = "ES2"; }

  // El mundo del año que viene
  esp.ES1 = [...o1.slice(0, o1.length - PLAZAS.descensoES1), ...sube1];
  esp.ES2 = [...o2.filter(n => !sube1.includes(n) && !baja2.includes(n)), ...baja1, ...sube2];
  esp.ES3 = [...o3.slice(PLAZAS.ascensoES3), ...baja2];
  esp.sc = { temporada: p.temporada + 1, equipos: proximaSupercopa(o1, copa) };
  return { ascenso, descenso, nuevaLiga, info };
}

/* ---------- Partidas viejas ---------- */
// Una partida guardada antes de este cambio no tiene mundo de España. Si todavía no se jugó nada, se arma el calendario nuevo (con Copa).
export function prepararEsp(p) {
  if (!esLigaEsp(p.liga) || p.esp) return false;
  mundoEspana(p);
  if (!p.calendario?.some(m => m.jugado === true)) { p.calendario = calendarioEsp(p.esp, p.equipo, p.liga, p.temporada); p.tablas = {}; }
  return true;
}

/* ---------- Zonas de la tabla (para pintarlas y explicarlas) ---------- */
export const ZONAS = {
  "LaLiga": { z: [[1, 4, "#3b82f6", "UEFA Champions League"], [5, 5, "#f59e0b", "UEFA Europa League"], [6, 6, "#10b981", "UEFA Conference League"], [18, 20, "#ef4444", "Descenso a Segunda División"]],
    nota: "El campeón de la Copa del Rey se clasifica a la Europa League. Si ya está en Champions (o es el 5.º), ese cupo pasa al 6.º y la Conference al 7.º." },
  "Segunda División": { z: [[1, 2, "#22c55e", "Ascenso directo a Primera"], [3, 6, "#eab308", "Playoff por el tercer ascenso"], [19, 22, "#ef4444", "Descenso a la tercera categoría"]] },
  "Primera Federación": { z: [[1, 4, "#22c55e", "Ascenso a Segunda División"]] }
};
export const zonaDe = (comp, pos) => (ZONAS[comp]?.z || []).find(([a, b]) => pos >= a && pos <= b) || null;
