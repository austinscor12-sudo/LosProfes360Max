// Selección Argentina: convocatorias de Scaloni, amistosos, Eliminatorias, Copa América y Mundial.
// Solo para jugadores de nacionalidad argentina. Toda la lógica vive acá; las pantallas están en pantallaseleccion.js.
import { fuerzaDe } from "./data/fuerza.js";
import { CONMEBOL, INVITADOS_COPA, DT_SELECCION, TODAS } from "./data/selecciones.js";
import { aplicarLesion } from "./evolucion.js";

export const SELECCION = "Argentina";
const NIVEL_SEL = 82;   // valoración de un titular típico de la Selección (para el rol: titular / suplente)

const lim = (n, a, b) => Math.max(a, Math.min(b, n));
const pick = a => a[Math.floor(Math.random() * a.length)];
const mezclar = a => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const poisson = l => { const L = Math.exp(-l); let k = 0, x = 1; do { k++; x *= Math.random(); } while (x > L && k < 12); return k - 1; };

export const esArgentino = p => p.jugador?.nacionalidad === "Argentina";
export const hayPendientes = p => (p.seleccion?.pendientes?.length || 0) > 0;

/* ---------- Estado ---------- */
export function asegurar(p) {
  if (!p.seleccion) p.seleccion = { partidos: 0, convocatorias: 0, goles: 0, asist: 0, minutos: 0, notaSuma: 0, titulos: 0, debut: null, historial: [], pendientes: [], plan: [], planTemp: 0, contador: 0, lista: null, elim: null, torneo: null, temp: null };
  const s = p.seleccion;
  if (!s.temp || s.temp.temporada !== p.temporada) s.temp = { temporada: p.temporada, pj: 0, goles: 0, asist: 0, notaSuma: 0 };
  return s;
}
const nuevo = (s, o) => ({ id: `SEL-${++s.contador}`, jugado: false, local: null, ...o });

/* ---------- Cuánto te quiere Scaloni ---------- */
// Puntaje de convocatoria: valoración + potencial (jóvenes) + forma + rendimiento de la temporada + visibilidad del club.
export function puntajeConvocatoria(p) {
  const j = p.jugador, ovr = p.progreso.overall, t = p.temp || {}, s = asegurar(p);
  let pt = p.posicion === "ARQ" ? ovr - 4 : ovr;   // los arqueros tienen valoraciones más altas
  if (j.edad <= 23) pt += Math.min(8, Math.max(0, p.potencial - ovr) * .3);   // el DT mira a los pibes con proyección
  pt += ((p.forma ?? 60) - 60) * .12;
  let nota = null, gp = 0;
  if ((t.partidos || 0) >= 4) { nota = t.notaSuma / t.partidos; gp = (t.goles + t.asist) / t.partidos; }
  else { const h = (p.historial || []).at(-1); if (h && h.partidos >= 4) { nota = h.nota; gp = (h.goles + h.asist) / h.partidos; } }
  if (nota != null) {
    pt += lim((nota - 6.5) * 4, -4, 6);
    if (p.posicion === "DEL" || p.posicion === "MED") pt += lim((gp - .3) * 4, -2, 4);
  }
  pt += (fuerzaDe(p.equipo) - 66) * .1;   // jugar en un club grande te pone en la vidriera
  if (p.liga === "AR2") pt -= 3;
  if (j.edad > 35) pt -= (j.edad - 35) * 1.2;
  pt += Math.min(4, s.partidos * .25);   // los que ya son habituales tienen crédito
  return pt;
}
const CRITERIO = { amistoso: [66, 16], elim: [76, 10], copa: [77, 9], mundial: [79, 9] };   // [puntaje desde el que empieza a ser posible, ancho de la rampa]
export function probConvocatoria(p, tipo) {
  const [u, a] = CRITERIO[tipo], s = asegurar(p);
  return lim((puntajeConvocatoria(p) - u) / a + (s.lista?.convocado ? .12 : 0), 0, .97);
}
function razon(p) {
  if (p.lesion) return "Estás lesionado.";
  const pt = puntajeConvocatoria(p);
  return pt < 66 ? "Todavía te falta nivel para la Selección." : pt < 76 ? `${DT_SELECCION} prefirió a jugadores de más nivel en tu puesto.` : "Hubo mucha competencia en tu puesto: seguí así.";
}
export function decidirRolSeleccion(p, m) {
  if (p.lesion) return "Lesionado";
  const aj = p.progreso.overall - (p.posicion === "ARQ" ? 4 : 0);
  const pr = lim((m.tipo === "amistoso" ? .55 : .45) + (aj - NIVEL_SEL) * .06 + ((p.forma ?? 60) - 60) * .003, .06, .95);
  return Math.random() < pr ? "Titular" : "Suplente";
}

/* ---------- Partidos "de fondo" (cuando no estás o para rellenar tablas) ---------- */
function simSolo(fa, fb, ko) {
  const gf = poisson(1.45 * Math.exp((fa - fb) / 32)), gc = poisson(1.45 * Math.exp((fb - fa) / 32));   // calibrado contra el motor de partidos
  let pen = null;
  if (ko && gf === gc) pen = Math.random() < .5 ? { mi: 5, riv: 4 } : { mi: 4, riv: 5 };
  return { gf, gc, pen };
}
const fuerzaPartido = m => [fuerzaDe(SELECCION) + (m.local === true ? 3 : 0), fuerzaDe(m.rival) + (m.local === false ? 3 : 0)];
const anotar = (t, gf, gc) => { t.pj++; t.gf += gf; t.gc += gc; if (gf > gc) { t.g++; t.pts += 3; } else if (gf === gc) { t.e++; t.pts++; } else t.p++; };
const ordenar = T => Object.entries(T).map(([n, v]) => ({ n, ...v })).sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf);

/* ---------- Eliminatorias (CONMEBOL: 10 equipos, 18 fechas en 3 años) ---------- */
function iniciarElim(ciclo) {
  const ida = mezclar(CONMEBOL).map((rival, i) => ({ rival, local: i % 2 === 0 }));
  if (Math.random() < .5) ida.forEach(f => f.local = !f.local);
  let orden = mezclar(ida);
  while (orden[0].rival === ida[ida.length - 1].rival) orden = mezclar(ida);   // que no se repita el rival en fechas seguidas
  const vuelta = orden.map(f => ({ rival: f.rival, local: !f.local }));
  const tabla = Object.fromEntries([SELECCION, ...CONMEBOL].map(n => [n, { pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 }]));
  return { ciclo, fechas: [...ida, ...vuelta], proxima: 0, jugados: 0, tabla, final: null };
}
// Registra tu fecha y simula el resto. Devuelve un mensaje cuando se cierra la fase.
function registrarElim(el, rival, gm, gr) {
  const T = el.tabla;
  anotar(T[SELECCION], gm, gr); anotar(T[rival], gr, gm);
  const otros = mezclar(Object.keys(T).filter(n => n !== SELECCION && n !== rival));
  for (let i = 0; i + 1 < otros.length; i += 2) {
    const r = simSolo(fuerzaDe(otros[i]) + 3, fuerzaDe(otros[i + 1]));
    anotar(T[otros[i]], r.gf, r.gc); anotar(T[otros[i + 1]], r.gc, r.gf);
  }
  if (++el.jugados < 18) return null;
  const o = ordenar(T), pos = o.findIndex(x => x.n === SELECCION) + 1, pts = T[SELECCION].pts;
  const repechaje = pos === 7, clasificado = pos <= 6 || (repechaje && Math.random() < .5);
  el.final = { pos, pts, clasificado, repechaje };
  return `Eliminatorias ${el.ciclo}: ${SELECCION} terminó ${pos}° con ${pts} puntos y ${clasificado ? (repechaje ? `ganó el repechaje: ¡está en el Mundial ${el.ciclo}!` : `clasificó al Mundial ${el.ciclo}.`) : `se quedó sin Mundial ${el.ciclo}.`}`;
}
export const posicionElim = el => ordenar(el.tabla).findIndex(x => x.n === SELECCION) + 1;
export const tablaElim = el => ordenar(el.tabla);

/* ---------- Torneos: Copa América y Mundial ---------- */
const ETAPAS = { mundial: ["16avos de final", "Octavos de final", "Cuartos de final", "Semifinal", "Final"], copa: ["Cuartos de final", "Semifinal", "Final"] };
const poolTorneo = tipo => tipo === "mundial" ? TODAS : [...CONMEBOL, ...INVITADOS_COPA];
const nombreTorneo = (tipo, y) => `${tipo === "mundial" ? "Mundial" : "Copa América"} ${y}`;

function sorteoGrupo(pool) {
  const ord = [...pool].sort((a, b) => fuerzaDe(b) - fuerzaDe(a)), k = Math.ceil(ord.length / 3);
  return [0, 1, 2].map(i => pick(ord.slice(i * k, (i + 1) * k)));   // uno de cada bombo
}
// Cuanto más avanzada la ronda, más fuerte el rival.
function rivalKO(t) {
  const pool = poolTorneo(t.tipo).filter(n => !t.usados.includes(n)).sort((a, b) => fuerzaDe(b) - fuerzaDe(a));
  const k = t.etapa / (ETAPAS[t.tipo].length - 1);
  const a = Math.round((1 - k) * pool.length * .25), b = Math.min(pool.length, a + Math.max(3, Math.round(pool.length * (.38 - .2 * k))));
  return pick(pool.slice(a, b));
}
function crearTorneo(p, tipo, convocado) {
  const s = asegurar(p), grupo = sorteoGrupo(poolTorneo(tipo));
  return (s.torneo = { id: nombreTorneo(tipo, p.temporada), tipo, temporada: p.temporada, fase: "Fase de grupos", grupo, res: [], usados: [...grupo], etapa: -1, estado: "activo", resultado: "", tabla: null, convocado });
}
const partidosGrupo = (s, t) => t.grupo.map((rival, i) => nuevo(s, { comp: t.id, etiqueta: `Fase de grupos · Fecha ${i + 1}`, rival, tipo: "grupo" }));
function partidoKO(s, t) {
  const rival = rivalKO(t); t.usados.push(rival);
  return nuevo(s, { comp: t.id, etiqueta: ETAPAS[t.tipo][t.etapa], rival, tipo: "ko", copa: true });
}
function resolverGrupo(t) {
  const T = Object.fromEntries([SELECCION, ...t.grupo].map(n => [n, { pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 }]));
  for (const r of t.res) { anotar(T[SELECCION], r.gf, r.gc); anotar(T[r.rival], r.gc, r.gf); }
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
    const a = t.grupo[i], b = t.grupo[j], r = simSolo(fuerzaDe(a), fuerzaDe(b));
    anotar(T[a], r.gf, r.gc); anotar(T[b], r.gc, r.gf);
  }
  const o = ordenar(T), pos = o.findIndex(x => x.n === SELECCION) + 1, mi = T[SELECCION];
  t.tabla = o;
  // En el Mundial (48 equipos) también pasan los mejores terceros.
  const clasifica = pos <= 2 || (t.tipo === "mundial" && pos === 3 && (mi.pts >= 4 || (mi.pts === 3 && mi.gf >= mi.gc)));
  return { pos, pts: mi.pts, clasifica };
}
// Aplica un resultado al torneo. Devuelve mensajes y el próximo partido (si pasaste de fase).
function registrarTorneo(p, m, gm, gr, pen) {
  const s = asegurar(p), t = s.torneo, msgs = []; let sig = null;
  if (m.tipo === "grupo") {
    t.res.push({ rival: m.rival, gf: gm, gc: gr });
    if (t.res.length === 3) {
      const g = resolverGrupo(t);
      if (g.clasifica) { t.etapa = 0; t.fase = ETAPAS[t.tipo][0]; sig = partidoKO(s, t); msgs.push(`${SELECCION} terminó ${g.pos}° en el grupo (${g.pts} pts) y pasó a ${t.fase}.`); }
      else { t.estado = "eliminado"; t.resultado = "Eliminada en la fase de grupos"; msgs.push(`${SELECCION} quedó afuera en la fase de grupos: ${g.pos}° con ${g.pts} puntos.`); }
    }
  } else {
    const gano = gm > gr || (gm === gr && !!pen && pen.mi > pen.riv), et = ETAPAS[t.tipo][t.etapa];
    if (!gano) { t.estado = "eliminado"; t.resultado = `Eliminada en ${et.toLowerCase()}`; msgs.push(`${SELECCION} quedó eliminada en ${et.toLowerCase()} de ${t.id}.`); }
    else if (t.etapa === ETAPAS[t.tipo].length - 1) { t.estado = "campeon"; t.resultado = "Campeón"; msgs.push(`🏆 ¡${SELECCION} es campeón de ${t.id}!`); }
    else { t.etapa++; t.fase = ETAPAS[t.tipo][t.etapa]; sig = partidoKO(s, t); msgs.push(`${SELECCION} pasó a ${t.fase}.`); }
  }
  return { msgs, sig };
}
function simularTorneoSolo(p, t) {
  const s = asegurar(p), cola = partidosGrupo(s, t);
  while (cola.length) {
    const m = cola.shift(), [fa, fb] = fuerzaPartido(m), r = simSolo(fa, fb, m.tipo === "ko");
    const o = registrarTorneo(p, m, r.gf, r.gc, r.pen);
    if (o.sig) cola.push(o.sig);
  }
}

/* ---------- Calendario de ventanas FIFA de la temporada ---------- */
// Año del Mundial al que apuntan las Eliminatorias de este año (2030, 2034...). Mundial: años que dan resto 2 al dividir por 4.
const cicloElim = y => y >= 2027 && y % 4 !== 2 ? y + ((2 - (y % 4) + 4) % 4) : null;
function planificar(p) {
  const s = asegurar(p);
  if (s.planTemp === p.temporada) return;
  const y = p.temporada, len = (p.calendario || []).length || 30, mundial = y >= 2030 && y % 4 === 2, copa = y >= 2028 && y % 4 === 0, elim = cicloElim(y) != null;
  const V = (frac, tipo, n = 2) => ({ en: Math.max(1, Math.round(len * frac)), tipo, n, hecha: false });
  const plan = [];
  if (elim) { plan.push(V(.18, "elim"), V(.38, "elim"), V(.58, "elim")); if (!copa) plan.push(V(.80, "amistoso")); }
  else if (mundial) plan.push(V(.35, "amistoso"));
  else plan.push(V(.38, "amistoso"), V(.78, "amistoso"));
  // Los torneos se juegan al terminar la temporada del club.
  if (mundial) plan.push({ fin: true, tipo: "mundial", hecha: false });
  if (copa) plan.push({ fin: true, tipo: "copa", hecha: false });
  s.plan = plan; s.planTemp = y;
  // Si ya hay partidos jugados (partida vieja), no se recuperan las ventanas que ya pasaron.
  for (const w of plan) if (!w.fin && (p.temp?.equipoPJ || 0) >= w.en) w.hecha = true;
}

function amistosos(s, n) {
  const pool = TODAS.filter(r => fuerzaDe(r) >= 66), rivales = mezclar(pool).slice(0, n), neutral = Math.random() < .4;
  return rivales.map((rival, i) => nuevo(s, { comp: "Amistoso internacional", etiqueta: `Amistoso ${i + 1}`, rival, tipo: "amistoso", local: neutral ? null : (i % 2 === 0) === (Math.random() < .5) }));
}
function resolverVentana(p, w) {
  const s = asegurar(p), msgs = [], nombre = w.tipo === "elim" ? "las Eliminatorias" : "los amistosos";
  let partidos = [], el = null;
  if (w.tipo === "elim") {
    const ciclo = cicloElim(p.temporada);
    if (!s.elim || s.elim.ciclo !== ciclo) s.elim = iniciarElim(ciclo);
    el = s.elim;
    for (let k = 0; k < w.n && el.proxima < 18; k++, el.proxima++) {
      const f = el.fechas[el.proxima];
      partidos.push(nuevo(s, { comp: `Eliminatorias ${ciclo}`, etiqueta: `Fecha ${el.proxima + 1}`, rival: f.rival, local: f.local, tipo: "elim" }));
    }
  } else partidos = amistosos(s, w.n);
  if (!partidos.length) return msgs;
  if (!p.lesion && Math.random() < probConvocatoria(p, w.tipo)) {
    s.convocatorias++; s.pendientes.push(...partidos);
    s.lista = { temporada: p.temporada, convocado: true, texto: `${DT_SELECCION} te convocó para ${nombre}: ${partidos.map(m => m.rival).join(" y ")}.` };
    if (s.convocatorias === 1) msgs.push("🇦🇷 ¡Primera convocatoria a la Selección Argentina!");
    msgs.push(`🇦🇷 ${s.lista.texto}`);
  } else {
    if (el) for (const m of partidos) { const [fa, fb] = fuerzaPartido(m), r = simSolo(fa, fb), f = registrarElim(el, m.rival, r.gf, r.gc); if (f) msgs.push(f); }
    s.lista = { temporada: p.temporada, convocado: false, texto: `${DT_SELECCION} dio la lista para ${nombre} y no estás. ${razon(p)}` };
    msgs.push(`🇦🇷 ${s.lista.texto}`);
  }
  return msgs;
}
function resolverTorneo(p, w) {
  const s = asegurar(p), id = nombreTorneo(w.tipo, p.temporada);
  if (w.tipo === "mundial") {
    const e = s.elim;
    // Si no hay datos de Eliminatorias (partida vieja) se da por clasificada a la Selección.
    if (e && e.ciclo === p.temporada && e.final && !e.final.clasificado) {
      s.lista = { temporada: p.temporada, convocado: false, texto: `${SELECCION} no se clasificó al ${id}.` };
      return [`🇦🇷 ${s.lista.texto}`];
    }
  }
  const conv = !p.lesion && Math.random() < probConvocatoria(p, w.tipo), t = crearTorneo(p, w.tipo, conv);
  if (conv) {
    s.convocatorias++; s.pendientes.push(...partidosGrupo(s, t));
    s.lista = { temporada: p.temporada, convocado: true, texto: `${DT_SELECCION} dio la lista de 26 para el ${id}: ¡estás en el plantel!` };
    return [`🇦🇷 ${s.lista.texto}`, `Debutan contra ${t.grupo[0]}.`];
  }
  simularTorneoSolo(p, t);
  s.lista = { temporada: p.temporada, convocado: false, texto: `${DT_SELECCION} dio la lista de 26 para el ${id} y no estás. ${razon(p)} ${SELECCION}: ${t.resultado.toLowerCase()}.` };
  return [`🇦🇷 ${s.lista.texto}`];
}

// Se llama después de cada partido de tu club. Devuelve los mensajes a mostrar (o null).
export function chequearVentana(p) {
  if (!esArgentino(p)) return null;
  const s = asegurar(p); planificar(p);
  const msgs = [], terminada = (p.calendario || []).every(m => m.jugado);
  for (const w of s.plan) {
    if (w.hecha || (w.fin ? !terminada : (p.temp?.equipoPJ || 0) < w.en)) continue;
    w.hecha = true;
    msgs.push(...(w.fin ? resolverTorneo(p, w) : resolverVentana(p, w)));
  }
  return msgs.length ? msgs : null;
}

/* ---------- Resultado de un partido con la Selección ---------- */
export function aplicarResultadoSeleccion(p, m, res) {
  const s = asegurar(p), j = res.jug, gm = res.golesMi, gr = res.golesRiv, out = { mejoras: [], lesion: null, cierres: [] };
  m.jugado = true; m.resultado = { gf: gm, gc: gr };
  s.pendientes = s.pendientes.filter(x => x.id !== m.id);
  if (j.minutos > 0) {
    s.partidos++; s.minutos += j.minutos; s.notaSuma += j.nota; s.temp.pj++; s.temp.notaSuma += j.nota;
    if (!s.debut) { s.debut = { temporada: p.temporada, rival: m.rival, comp: m.comp }; out.cierres.push("🇦🇷 ¡Debutaste en la Selección Argentina!"); }
  }
  if (j.goles > 0 && s.goles === 0) out.cierres.push("⚽ ¡Tu primer gol con la Selección!");
  s.goles += j.goles; s.asist += j.asist; s.temp.goles += j.goles; s.temp.asist += j.asist;
  s.historial.push({ temporada: p.temporada, comp: m.comp, etiqueta: m.etiqueta, rival: m.rival, gf: gm, gc: gr, pen: res.penales || null, goles: j.goles, asist: j.asist, nota: j.nota ?? null, minutos: j.minutos, rol: res.rol });

  p.forma = lim(p.forma + (gm > gr ? 3 : gm < gr ? -3 : 0) + (j.nota ? (j.nota - 6.4) * 5 : 0), 20, 100);
  p.fatiga = lim(Math.round(p.fatiga + j.minutos / 90 * 10), 0, 100);
  if (res.lesion) out.lesion = aplicarLesion(p, res.lesion);

  if (m.tipo === "elim") { const f = registrarElim(s.elim, m.rival, gm, gr); if (f) out.cierres.push(f); }
  else if (m.tipo === "grupo" || m.tipo === "ko") {
    const o = registrarTorneo(p, m, gm, gr, res.penales);
    out.cierres.push(...o.msgs);
    if (o.sig) s.pendientes.push(o.sig);
    if (s.torneo.estado === "campeon") { s.titulos++; p.palmares.push({ temporada: p.temporada, titulo: `${s.torneo.id} (Selección Argentina)` }); }
  }
  return out;
}

export function resumenSeleccion(p) {
  const s = asegurar(p);
  return { ...s, nota: s.partidos ? s.notaSuma / s.partidos : null };
}
