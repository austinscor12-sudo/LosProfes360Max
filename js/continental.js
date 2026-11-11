// Copas sudamericanas y títulos de liga: Libertadores, Sudamericana, Recopa, Trofeo de Campeones, Supercopa Argentina
// y los títulos de Apertura, Clausura y Tabla Anual (Campeón de Liga).
// Solo para clubes argentinos. Las ligas europeas no pasan por acá.
import { fuerzaDe } from "./data/fuerza.js";
import { CLUBES_SUD, COPAS_2026 } from "./data/continental.js";
import { PRIMERA, NACIONAL } from "./data/equipos.js";
import { TEMPORADA_INICIAL } from "./data/competiciones.js";
import { calcularTabla } from "./liga.js";
import { esc } from "./util.js";

const pick = a => a[Math.floor(Math.random() * a.length)];
const poisson = l => { const L = Math.exp(-l); let k = 0, x = 1; do { k++; x *= Math.random(); } while (x > L && k < 12); return k - 1; };
const esArg = n => PRIMERA.includes(n) || NACIONAL.includes(n);
const esAR = p => /^AR/.test(p.liga || "");

export const NOM = { LIB: "Copa Libertadores", SUD: "Copa Sudamericana" };
// [nombre de la fase, tipo]: grupos = 6 partidos, cruce = ida y vuelta, final = un partido en cancha neutral
const ETAPAS = {
  LIB: [["Fase previa", "cruce"], ["Fase de grupos", "grupos"], ["Octavos de final", "cruce"], ["Cuartos de final", "cruce"], ["Semifinal", "cruce"], ["Final", "final"]],
  SUD: [["Fase de grupos", "grupos"], ["Play-off de octavos", "cruce"], ["Octavos de final", "cruce"], ["Cuartos de final", "cruce"], ["Semifinal", "cruce"], ["Final", "final"]]
};
// Qué tan arriba (0 = lo más fuerte, 1 = lo más flojo) está el rival de cada fase.
const DIF = { "Fase previa": .75, "Play-off de octavos": .45, "Octavos de final": .15, "Cuartos de final": .1, Semifinal: .05, Final: 0 };
const TITULOS = {
  LIB: ["Copa Libertadores", "de la"], SUD: ["Copa Sudamericana", "de la"], REC: ["Recopa Sudamericana", "de la"],
  TDC: ["Trofeo de Campeones", "del"], SUP: ["Supercopa Argentina", "de la"]
};
export const COMPS_CONT = [NOM.LIB, NOM.SUD, "Recopa Sudamericana", "Trofeo de Campeones", "Supercopa Argentina"];
export const esContinental = comp => COMPS_CONT.includes(comp);

// Los brasileros y demás entran según su fuerza: la Libertadores se juega con los 36 mejores, la Sudamericana con el resto.
const ORD = CLUBES_SUD.map(c => c[0]).sort((a, b) => fuerzaDe(b) - fuerzaDe(a));
const POOL = { LIB: ORD.slice(0, 36), SUD: ORD.slice(10) };

const pesado = (lista, f) => {
  const w = lista.map(f), tot = w.reduce((a, b) => a + b, 0);
  let r = Math.random() * tot;
  for (let i = 0; i < lista.length; i++) if ((r -= w[i]) < 0) return lista[i];
  return lista[lista.length - 1];
};

/* ---------- Estado ---------- */
export function asegurarCopas(p) {
  if (p.copas) return false;
  p.copas = { hist: { [TEMPORADA_INICIAL - 1]: COPAS_2026.campeones2025 }, torneos: { LIB: null, SUD: null }, cur: null, prox: null, arg: { LIB: [], SUD: [] } };
  // Partida de la primera temporada: los argentinos que jugaron las copas en 2026 son los reales.
  if (esAR(p) && p.temporada === TEMPORADA_INICIAL) iniciarCopasTemporada(p, COPAS_2026);
  return true;
}
const curTemp = (p, c) => (c.cur && c.cur.temporada === p.temporada ? c.cur : (c.cur = { temporada: p.temporada }));
const setCont = (p, nombre, txt) => { (p.temp.cont ||= {})[nombre] = txt; };

/* ---------- Calendario ---------- */
// Reparte los partidos de grupo a lo largo de lo que falta de la temporada.
function repartir(cal, ps) {
  const s = cal.findIndex(x => !x.jugado), lo = (s < 0 ? cal.length : s) + 1, hi = Math.max(lo + ps.length, cal.length - 4);
  const pos = ps.map((_, k) => Math.round(lo + (k + .5) * (hi - lo) / ps.length));
  for (let k = ps.length - 1; k >= 0; k--) cal.splice(Math.min(cal.length, pos[k]), 0, ps[k]);
}
// Cruces: la ida a los 2 partidos, la vuelta unos 4 partidos después.
function adelante(cal, ps) {
  const s = cal.findIndex(x => !x.jugado);
  let at = Math.min(cal.length, (s < 0 ? cal.length : s) + 2);
  for (const m of ps) { cal.splice(at, 0, m); at = Math.min(cal.length, at + 4); }
}

/* ---------- Torneos (Libertadores / Sudamericana) ---------- */
const nuevoTorneo = (p, tipo, etapa) => ({ tipo, temporada: p.temporada, etapa, fase: ETAPAS[tipo][etapa][0], estado: "activo", resultado: "", grupo: [], res: [], usados: [], tabla: null, n: 0 });

function sortearGrupo(tipo) {
  const pool = POOL[tipo], k = Math.ceil(pool.length / 3);
  return [0, 1, 2].map(i => pick(pool.slice(i * k, (i + 1) * k)));   // uno de cada bombo
}
function rivalCruce(t) {
  const lista = POOL[t.tipo].filter(n => !t.usados.includes(n)), a = Math.floor(DIF[t.fase] * lista.length);
  return pick(lista.slice(a, a + Math.max(3, Math.round(lista.length * .3))));
}
const anotar = (x, gf, gc) => { x.pj++; x.gf += gf; x.gc += gc; if (gf > gc) { x.g++; x.pts += 3; } else if (gf === gc) { x.e++; x.pts++; } else x.p++; };
const ordenar = T => Object.entries(T).map(([n, v]) => ({ n, ...v })).sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf);
const simSolo = (fa, fb) => [Math.min(6, poisson(1.45 * Math.exp((fa - fb) / 32))), Math.min(6, poisson(1.45 * Math.exp((fb - fa) / 32)))];

// Crea los partidos de la etapa actual del torneo.
function partidosEtapa(p, t) {
  const [fase, tipo] = ETAPAS[t.tipo][t.etapa], id = () => `${t.tipo}${t.temporada}-${++t.n}`;
  const base = { comp: NOM[t.tipo], cont: t.tipo, fase, jugado: false };
  if (tipo === "grupos") {
    t.grupo = sortearGrupo(t.tipo); t.res = []; t.usados.push(...t.grupo);
    t.tabla = Object.fromEntries([p.equipo, ...t.grupo].map(n => [n, { pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 }]));
    const ini = Math.random() < .5;
    return [...t.grupo, ...t.grupo].map((rival, i) => ({ ...base, id: id(), etiqueta: `Fase de grupos · Fecha ${i + 1}`, rival, local: i < 3 ? (i % 2 === 0) === ini : !((i % 2 === 0) === ini) }));
  }
  const rival = rivalCruce(t); t.usados.push(rival);
  if (tipo === "final") return [{ ...base, id: id(), etiqueta: "Final", rival, local: null, copa: true, leg: 0 }];
  const L = Math.random() < .5, a = id(), v = id();
  return [
    { ...base, id: a, par: v, etiqueta: `${fase} · Ida`, rival, local: L, leg: 1 },
    { ...base, id: v, par: a, etiqueta: `${fase} · Vuelta`, rival, local: !L, leg: 2, copa: true }
  ];
}
function colocar(p, t, ps) {
  if (ETAPAS[t.tipo][t.etapa][1] === "grupos") repartir(p.calendario, ps); else adelante(p.calendario, ps);
  setCont(p, NOM[t.tipo], `En juego: ${t.fase}`);
}
function arrancar(p, tipo, etapa) {
  const t = nuevoTorneo(p, tipo, etapa);
  p.copas.torneos[tipo] = t;
  colocar(p, t, partidosEtapa(p, t));
  return t;
}

// Se llama al empezar la temporada (o una sola vez en la primera, con la lista real de 2026).
export function iniciarCopasTemporada(p, real) {
  const c = p.copas;
  c.torneos = { LIB: null, SUD: null }; c.cur = { temporada: p.temporada };
  if (!esAR(p)) return;
  const prox = real || (c.prox && c.prox.temporada === p.temporada ? c.prox : null);
  c.arg = prox ? { LIB: prox.lib.map(x => x.club), SUD: prox.sud.map(x => x.club) } : { LIB: [], SUD: [] };
  const l = prox && prox.lib.find(x => x.club === p.equipo), s = prox && prox.sud.find(x => x.club === p.equipo);
  if (l) arrancar(p, "LIB", l.fase === "Fase previa" ? 0 : 1);
  else if (s) arrancar(p, "SUD", 0);
  // Recopa: campeón de la Libertadores contra el de la Sudamericana del año anterior
  const h = c.hist[p.temporada - 1];
  if (h && h.lib && h.sud && h.lib !== h.sud && (h.lib === p.equipo || h.sud === p.equipo) && (p.temp?.equipoPJ || 0) === 0) {
    const rival = h.lib === p.equipo ? h.sud : h.lib, L = Math.random() < .5, a = `REC${p.temporada}-1`, v = `REC${p.temporada}-2`;
    const base = { comp: "Recopa Sudamericana", cont: "REC", rival, jugado: false };
    adelante(p.calendario, [
      { ...base, id: a, par: v, etiqueta: "Final · Ida", local: L, leg: 1 },
      { ...base, id: v, par: a, etiqueta: "Final · Vuelta", local: !L, leg: 2, copa: true }
    ]);
    setCont(p, "Recopa Sudamericana", `Contra ${rival}`);
  }
}

/* ---------- Resultados ---------- */
function titulo(p, out, cont) {
  const [nombre, de] = TITULOS[cont];
  p.palmares.push({ temporada: p.temporada, titulo: nombre });
  out.cierres.push(`¡Campeón ${de} ${nombre}!`);
  setCont(p, nombre, "Campeón");
}
// Cruce a ida y vuelta: null mientras falta la vuelta; después, true si pasaste.
function paso(p, m, res) {
  if (m.leg === 1) { const v = p.calendario.find(x => x.id === m.par); if (v) v.ventaja = res.golesMi - res.golesRiv; return null; }
  return !!res.clasificado;
}

function avanzar(p, t, etapa, out) {
  t.etapa = etapa; t.fase = ETAPAS[t.tipo][etapa][0];
  colocar(p, t, partidosEtapa(p, t));
  out.cierres.push(`${NOM[t.tipo]}: pasaste a ${t.fase}.`);
  setCont(p, NOM[t.tipo], `Clasificado a ${t.fase}`);
}
function eliminar(p, t, out, texto) {
  t.estado = "eliminado"; t.resultado = texto;
  out.cierres.push(`${NOM[t.tipo]}: ${texto.toLowerCase()}.`);
  setCont(p, NOM[t.tipo], texto);
}

function registrarCopa(p, m, res, out) {
  const t = p.copas.torneos[m.cont]; if (!t || t.estado !== "activo") return;
  const [fase, tipo] = ETAPAS[t.tipo][t.etapa], gm = res.golesMi, gr = res.golesRiv;
  if (tipo === "grupos") {
    t.res.push({ rival: m.rival, gm, gr });
    anotar(t.tabla[p.equipo], gm, gr); anotar(t.tabla[m.rival], gr, gm);
    const otros = t.grupo.filter(n => n !== m.rival), r = simSolo(fuerzaDe(otros[0]) + 3, fuerzaDe(otros[1]));
    anotar(t.tabla[otros[0]], r[0], r[1]); anotar(t.tabla[otros[1]], r[1], r[0]);
    const o = ordenar(t.tabla), pos = o.findIndex(x => x.n === p.equipo) + 1;
    out.tabla = { comp: `${NOM[t.tipo]} (grupo)`, pos, total: 4, pts: t.tabla[p.equipo].pts };
    if (t.res.length < 6) { setCont(p, NOM[t.tipo], `Fase de grupos: ${pos}.º`); return; }
    out.cierres.push(`${NOM[t.tipo]}: terminaste ${pos}° en tu grupo (${t.tabla[p.equipo].pts} pts).`);
    t.posGrupo = pos;
    if (t.tipo === "LIB") {
      if (pos <= 2) avanzar(p, t, 2, out);
      else if (pos === 3) {
        eliminar(p, t, out, "Tercero del grupo: pasa a la Sudamericana");
        const s = arrancar(p, "SUD", 1);
        s.desdeLib = true;
        out.cierres.push("Jugás el Play-off de octavos de la Copa Sudamericana.");
      } else eliminar(p, t, out, "Eliminado en la fase de grupos");
    } else if (pos === 1) avanzar(p, t, 2, out);
    else if (pos === 2) avanzar(p, t, 1, out);
    else eliminar(p, t, out, "Eliminado en la fase de grupos");
    return;
  }
  const r = paso(p, m, res);
  if (r === null) return;
  if (!r) return eliminar(p, t, out, `Eliminado en ${fase}`);
  if (tipo === "final") { t.estado = "campeon"; t.resultado = "Campeón"; return titulo(p, out, t.tipo); }
  avanzar(p, t, t.etapa + 1, out);
}

// Punto de entrada desde resultado.js para cualquier partido con `m.cont`.
export function registrarContinental(p, m, res, out) {
  asegurarCopas(p);
  if (m.cont === "LIB" || m.cont === "SUD") return registrarCopa(p, m, res, out);
  const r = m.cont === "REC" ? paso(p, m, res) : !!res.clasificado;   // Trofeo y Supercopa: un solo partido
  if (r === null) return;
  if (r) titulo(p, out, m.cont); else { out.cierres.push(`${TITULOS[m.cont][0]}: no pudiste ganarla.`); setCont(p, TITULOS[m.cont][0], "Perdiste la final"); }
}

/* ---------- Títulos de liga: Apertura, Clausura, Tabla Anual ---------- */
// Campeón de un torneo: salir primero en tu zona es ser campeón. Si no, lo gana uno de los dos líderes de zona.
function campeonZona(p, torneo) {
  const lider = z => calcularTabla(p, [torneo], Array.from({ length: 15 }, (_, k) => z * 15 + k))[0].nombre;
  const mi = p.equiposLiga.indexOf(p.equipo) < 15 ? 0 : 1, a = lider(mi), b = lider(1 - mi);
  if (a === p.equipo) return p.equipo;
  const wa = Math.exp(fuerzaDe(a) / 6), wb = Math.exp(fuerzaDe(b) / 6);
  return Math.random() < wa / (wa + wb) ? a : b;
}
// Se llama cuando terminás de jugar el Apertura o el Clausura (liga real con zonas). pos = tu puesto en la zona.
export function cerrarTorneoLiga(p, m, out, pos) {
  asegurarCopas(p);
  const cur = curTemp(p, p.copas), nombre = m.torneo === "AP" ? "Torneo Apertura" : "Torneo Clausura";
  const campeon = pos === 1 ? p.equipo : campeonZona(p, m.torneo);
  cur[m.torneo] = campeon;
  if (pos === 1) { p.palmares.push({ temporada: p.temporada, titulo: nombre }); out.cierres.push(`¡Campeón del ${nombre}!`); }
  else out.cierres.push(`${campeon} se quedó con el ${nombre}.`);
}
const tablaAnual = p => calcularTabla(p, ["AP", "CL"], Array.from({ length: 30 }, (_, k) => k)).map(f => f.nombre);
// Se llama al terminar el Clausura: la tabla anual (Apertura + Clausura) da al Campeón de Liga.
export function cerrarAnual(p, out) {
  asegurarCopas(p);
  const cur = curTemp(p, p.copas);
  cur.anual = tablaAnual(p);
  const pos = cur.anual.indexOf(p.equipo) + 1;
  if (pos === 1) { p.palmares.push({ temporada: p.temporada, titulo: "Liga Profesional (Tabla Anual)" }); out.cierres.push("¡Campeón de la Liga Profesional (Tabla Anual)!"); }
  else out.cierres.push(`${cur.anual[0]} ganó la Tabla Anual ${p.temporada} (título de Liga).`);
}

const copaArgentina = (p, cur) => p.temp.copa === "Campeón" ? p.equipo : (cur.copaArg ||= pesado([...PRIMERA].filter(n => n !== p.equipo), n => Math.exp(fuerzaDe(n) / 8)));

// Al terminar la liga y la Copa Argentina: Trofeo de Campeones (Apertura vs Clausura) y Supercopa (Campeón de Liga vs Copa Argentina).
export function chequearFinales(p, out) {
  if (!p.fixture || !p.copas) return;
  const cur = p.copas.cur;
  if (!cur || cur.temporada !== p.temporada || !cur.anual || cur.finales) return;
  const cp = p.temp.copa || "";
  if (!(cp === "Campeón" || cp.startsWith("Eliminado"))) return;   // todavía falta definir la Copa Argentina
  cur.finales = true;
  const unico = (cont, rival) => { p.calendario.push({ id: `${cont}${p.temporada}`, comp: TITULOS[cont][0], cont, etiqueta: "Final", rival, local: null, copa: true, leg: 0, jugado: false }); out.cierres.push(`Te toca jugar ${cont === "TDC" ? "el Trofeo" : "la Supercopa"} ante ${rival}.`); };
  const A = cur.AP, C = cur.CL;
  if (p.equipo === A || p.equipo === C) unico("TDC", A !== C ? (p.equipo === A ? C : A) : cur.anual.find(n => n !== A));
  const liga = cur.anual[0], copa = copaArgentina(p, cur);
  if (p.equipo === liga || p.equipo === copa) unico("SUP", p.equipo === liga ? (copa !== liga ? copa : cur.anual[1]) : liga);
}

/* ---------- Cierre de temporada: campeones continentales y clasificación del año que viene ---------- */
function campeonDe(p, tipo) {
  const t = p.copas.torneos?.[tipo];
  if (t && t.estado === "campeon") return p.equipo;
  const lista = [...POOL[tipo], ...(p.copas.arg?.[tipo] || [])].filter(n => n !== p.equipo);
  return pesado(lista, n => Math.exp((fuerzaDe(n) - 60) / 5));
}

export function cerrarCopas(p) {
  asegurarCopas(p);
  const c = p.copas, cur = curTemp(p, c), tp = p.temporada, h = (c.hist[tp] ||= {});
  h.lib = campeonDe(p, "LIB"); h.sud = campeonDe(p, "SUD");
  if (!esAR(p)) { c.prox = null; return null; }

  // Partidas empezadas antes de esta función: si falta algún dato de la liga, se arma con lo jugado.
  if (p.fixture) { for (const tn of ["AP", "CL"]) if (!cur[tn]) cur[tn] = campeonZona(p, tn); if (!cur.anual) cur.anual = tablaAnual(p); }
  // Libertadores: campeones de Apertura y Clausura, Copa Argentina y los mejores de la Tabla Anual (hasta 6).
  const lib = [], add = (club, motivo) => { if (club && !lib.some(x => x.club === club)) lib.push({ club, motivo }); };
  if (p.fixture && cur.anual) {
    add(cur.AP, "Campeón del Torneo Apertura"); add(cur.CL, "Campeón del Torneo Clausura"); add(copaArgentina(p, cur), "Campeón de la Copa Argentina");
    cur.anual.forEach((n, i) => { if (lib.length < 6) add(n, `${i + 1}.º en la Tabla Anual`); });
  } else if (p.temp.copa === "Campeón") add(p.equipo, "Campeón de la Copa Argentina");
  lib.forEach((x, i) => { x.fase = i < 4 ? "Fase de grupos" : "Fase previa"; });
  // Un argentino campeón de la Libertadores o de la Sudamericana entra a la Libertadores del año siguiente.
  for (const [club, tipo] of [[h.lib, "LIB"], [h.sud, "SUD"]]) if (club && esArg(club) && !lib.some(x => x.club === club)) lib.push({ club, fase: "Fase de grupos", motivo: `Campeón de la ${NOM[tipo]}` });
  // Sudamericana: los 6 mejores de la tabla anual que no clasificaron a la Libertadores.
  const sud = p.fixture && cur.anual ? cur.anual.filter(n => !lib.some(x => x.club === n)).slice(0, 6).map(n => ({ club: n, fase: "Fase de grupos", motivo: `${cur.anual.indexOf(n) + 1}.º en la Tabla Anual` })) : [];
  c.prox = { temporada: tp + 1, lib, sud };

  const l = lib.find(x => x.club === p.equipo), s = sud.find(x => x.club === p.equipo);
  return { texto: l ? `${p.equipo} clasificó a la Copa Libertadores ${tp + 1} (${l.fase.toLowerCase()}): ${l.motivo}.`
    : s ? `${p.equipo} clasificó a la Copa Sudamericana ${tp + 1}: ${s.motivo}.`
    : `${p.equipo} no clasificó a copas internacionales para ${tp + 1}.` };
}

/* ---------- Pantalla principal ---------- */
const dato = (l, v) => `<div class="dato"><span>${l}</span><b>${v}</b></div>`;
export function panelCopas(p) {
  const c = p.copas; if (!c || !esAR(p)) return "";
  const bloques = [];
  for (const tipo of ["LIB", "SUD"]) {
    const t = c.torneos?.[tipo]; if (!t) continue;
    const est = t.estado === "campeon" ? "🏆 Campeón" : t.estado === "eliminado" ? esc(t.resultado) : esc(t.fase);
    let tabla = "";
    if (t.estado === "activo" && ETAPAS[tipo][t.etapa][1] === "grupos" && t.tabla) tabla = ordenar(t.tabla).map((f, i) => dato(`${i + 1}. ${f.n === p.equipo ? `<b>${esc(f.n)}</b>` : esc(f.n)}`, `${f.pts} pts · ${f.pj} PJ`)).join("");
    bloques.push(`${dato(NOM[tipo], est)}${tabla}`);
  }
  const rec = (p.calendario || []).some(x => x.cont === "REC") ? dato("Recopa Sudamericana", (p.temp.cont || {})["Recopa Sudamericana"] || "") : "";
  if (!bloques.length && !rec) return "";
  return `<div class="panel"><h2>🌎 Copas internacionales</h2>${bloques.join("")}${rec}</div>`;
}

// Texto para la pantalla "Temporada X+1": a qué copa clasificó tu club actual (puede haber cambiado de club en el mercado de pases).
export function textoCopasProx(p) {
  const pr = p.copas && p.copas.prox; if (!pr) return "";
  const l = pr.lib.find(x => x.club === p.equipo), s = pr.sud.find(x => x.club === p.equipo);
  return l ? `Copa Libertadores ${pr.temporada}: ${l.fase.toLowerCase()} (${l.motivo}).` : s ? `Copa Sudamericana ${pr.temporada}: ${s.motivo}.` : "";
}
