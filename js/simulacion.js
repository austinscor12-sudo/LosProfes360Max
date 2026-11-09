// Motor de simulación de partidos: minuto a minuto, con eventos, estadísticas y nota del jugador.
import { fuerzaEquipo, nivelPlantel, APELLIDOS, INICIALES } from "./data/fuerza.js";
import { generarLesion, probTitular } from "./evolucion.js";
import { plantillaDe } from "./plantillas.js";

const az = (a, b) => a + Math.random() * (b - a);
const ent = (a, b) => Math.floor(az(a, b + 1));
const prob = p => Math.random() < p;
const lim = (n, a, b) => Math.max(a, Math.min(b, n));
const pick = a => a[Math.floor(Math.random() * a.length)];
const nombre = () => `${pick(INICIALES)}. ${pick(APELLIDOS)}`;
const mezclar = a => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const poisson = l => { const L = Math.exp(-l); let k = 0, x = 1; do { k++; x *= Math.random(); } while (x > L && k < 12); return k - 1; };
export const fmtMin = m => m >= 200 ? "Pen." : m <= 0 ? "Ini" : m > 90 ? `90+${m - 90}'` : `${m}'`;

const DEFINE = ["define cruzado ante la salida del arquero", "la manda al fondo de la red", "la cruza con categoría", "define de primera, sin dejarla caer", "la pica por encima del arquero"];

export function decidirRol(p) {
  if (p.lesion) return "Lesionado";
  const d = p.progreso.overall - nivelPlantel(p.equipo);
  if (prob(probTitular(p))) return "Titular";
  return d < -12 && prob(.45) ? "No convocado" : "Suplente";
}

// Resultado de un ataque: gol, palo, atajada, afuera, bloqueado o nada.
const resultado = g => {
  const u = Math.random();
  if (u < g) return "gol"; if (u < g + .03) return "palo"; if (u < g + .30) return "ataj";
  if (u < g + .50) return "afuera"; if (u < g + .59) return "bloq"; return "nada";
};

export function simularPartido({ equipo, rival, local, p, rol, copa, copaNombre }) {
  const j = p.jugador, A = p.atributos, pos = p.posicion;
  const yo = j.apodo || j.apellido;
  // Nombres de compañeros y rivales: salen de la plantilla del equipo (js/data/plantillas/) o, si no hay, al azar.
  const plM = plantillaDe(equipo), plR = plantillaDe(rival);
  const delOnce = pl => pl && pl.jugadores.length ? () => pick(pl.jugadores.slice(0, 11).filter(x => x.p !== "ARQ")).c : nombre;
  const nMi = delOnce(plM), nRiv = delOnce(plR), dtMi = (plM && plM.dt) || "El DT";
  const fat = p.fatiga || 0, forma = p.forma ?? 60;
  const rend = (1 + (forma - 60) / 400) * (1 - Math.max(0, fat - 60) / 200);
  const fM0 = fuerzaEquipo(equipo) + (local === true ? 3 : 0), fR0 = fuerzaEquipo(rival) + (local === false ? 3 : 0);
  let rojasM = 0, rojasR = 0, gM = 0, gR = 0, nt = 0, lesion = null;
  const ev = [];
  const push = (m, t, x, mio = false) => ev.push({ m, t, x, yo: mio, gm: gM, gr: gR });
  const st = { remM: 0, remR: 0, arcoM: 0, arcoR: 0 };
  const jug = { minutos: 0, goles: 0, asist: 0, remates: 0, alArco: 0, pasesClave: 0, pases: 0, pasesOk: 0, regates: 0, regatesOk: 0, recuperaciones: 0, bloqueos: 0, faltas: 0, faltasRec: 0, amarilla: false, roja: false, atajadas: 0, golesContra: 0, errores: 0, nota: null, figura: false };
  const gk = pos === "ARQ" ? (A.reflejos + A.estirada + A.manos + A.posicionamiento) / 4 : 0;

  // Minutos del jugador
  let ini = 0, fin = 0;
  if (rol === "Titular") fin = prob(.4 + Math.max(0, fat - 50) / 150) ? ent(58, 88) : 93;
  else if (rol === "Suplente" && prob(.78)) { ini = ent(46, 80); fin = 93; }
  const juega = fin > ini, finOrig = fin;
  const enCancha = m => juega && m >= ini && m <= fin;

  // Línea de tiempo: ataques y eventos sueltos
  const slots = [];
  for (let i = ent(22, 30); i > 0; i--) slots.push({ m: ent(1, 93), k: "ataque" });
  if (juega) {
    const dur = Math.min(fin, 90) - ini, f = Math.min(1, dur / 90 + .15), a = Math.max(1, ini), b = Math.min(fin, 93);
    if (prob(({ DEF: .22, MED: .17, DEL: .09, ARQ: .04 }[pos] || .1) * f)) slots.push({ m: ent(a, b), k: "amarilla" });
    if (prob(.012 * f)) slots.push({ m: ent(a, b), k: "roja" });
    if (prob(.03 * (1 + fat / 100) * f)) slots.push({ m: ent(a, b), k: "lesion" });
    if (ini > 0) slots.push({ m: ini, k: "entra" });
    if (fin < 90) slots.push({ m: fin, k: "sale" });
  }
  if (prob(.05)) slots.push({ m: ent(20, 88), k: "rojaM" });
  if (prob(.05)) slots.push({ m: ent(20, 88), k: "rojaR" });
  for (let i = ent(0, 2); i > 0; i--) slots.push({ m: ent(5, 90), k: "amarillaM" });
  for (let i = ent(0, 2); i > 0; i--) slots.push({ m: ent(5, 90), k: "amarillaR" });
  slots.push({ m: 45, k: "descanso" });
  slots.sort((x, y) => x.m - y.m || (x.k === "ataque") - (y.k === "ataque"));

  /* ---- Ataques ---- */
  const penalMio = (m, en) => {
    const toma = en && pos !== "ARQ" && prob(pos === "DEL" ? .6 : pos === "MED" ? .35 : .1);
    push(m, "penal", `¡Penal para ${equipo}!${toma ? ` Se hace cargo ${yo}.` : ""}`, toma);
    const quien = toma ? yo : nMi();
    const pc = toma ? lim((.7 + (A.tiro - 55) * .004) * rend, .5, .93) : .76;
    st.remM++; if (toma) jug.remates++;
    if (prob(pc)) {
      gM++; st.arcoM++;
      if (toma) { jug.alArco++; jug.goles++; nt += .9; }
      push(m, "gol", `¡GOL de penal! ${quien} no perdona desde los doce pasos.`, toma);
    } else if (prob(.6)) {
      st.arcoM++; if (toma) { jug.alArco++; nt -= .4; }
      push(m, "tiro", `${quien} patea el penal y el arquero lo ataja.`, toma);
    } else { if (toma) nt -= .5; push(m, "tiro", `${quien} la tira afuera. Se pierde el penal.`, toma); }
  };
  const penalRival = (m, en) => {
    const ataja = en && pos === "ARQ";
    push(m, "penal", `Penal para ${rival}.${ataja ? ` Te toca a vos, ${yo}.` : ""}`, ataja);
    st.remR++;
    const pAt = ataja ? lim((.2 + (A.reflejos - 50) * .003 + (A.estirada - 50) * .002) * rend, .12, .45) : .2;
    if (prob(pAt)) { st.arcoR++; if (ataja) { jug.atajadas++; nt += .8; } push(m, "ataj", ataja ? `¡Atajaste el penal, ${yo}! Gran lectura del remate.` : `El arquero de ${equipo} ataja el penal.`, ataja); }
    else if (!prob(.95)) push(m, "info", `${rival} desperdicia el penal: la tira afuera.`);
    else {
      gR++; st.arcoR++; if (en) { jug.golesContra++; if (pos === "ARQ") nt -= .1; }
      push(m, "golR", `Gol de penal de ${rival}.${ataja ? " Te adivinaste el palo, pero no llegaste." : ""}`, ataja);
    }
  };
  const ataqueMio = (m, fm, fr) => {
    const en = enCancha(m);
    if (prob(.05)) return penalMio(m, en);
    const inter = en && prob({ DEL: .3, MED: .24, DEF: .06, ARQ: 0 }[pos]);
    const tira = inter && prob({ DEL: .66, MED: .4, DEF: .5, ARQ: 0 }[pos]);
    const crea = inter && !tira;
    let g = lim(.075 * Math.exp((fm - fr) / 35), .03, .3);
    if (tira) g *= .6 + (pos === "DEF" ? (A.fisico + A.tiro) / 2 : A.tiro) * rend / 100 * .8;
    if (crea) g *= .8 + A.pase * rend / 100 * .4;
    const r = resultado(g), mate = nMi();
    if (r !== "nada") { st.remM++; if (r === "gol" || r === "ataj") st.arcoM++; }
    if (r === "gol") {
      gM++;
      if (tira) { jug.remates++; jug.alArco++; jug.goles++; nt += 1.1; const a = prob(.7) ? nMi() : null; push(m, "gol", `¡GOOOL de ${equipo}! ${yo} ${pick(DEFINE)}.${a ? ` Asistencia de ${a}.` : " Gol de jugada individual."}`, true); }
      else if (crea) { jug.pasesClave++; jug.asist++; nt += .7; push(m, "gol", `¡GOL de ${equipo}! ${mate} la empuja tras un pase exquisito de ${yo}.`, true); }
      else push(m, "gol", `¡Gol de ${equipo}! ${mate} ${pick(DEFINE)}.`);
      return;
    }
    if (tira) {
      jug.remates++;
      if (r === "ataj") { jug.alArco++; nt += .1; push(m, "tiro", `${yo} dispara al arco y el arquero ${pick(["la desvía", "ataja abajo", "responde con seguridad"])}.`, true); }
      else if (r === "palo") { nt += .05; push(m, "palo", `¡Palo! El remate de ${yo} se estrella en el poste.`, true); }
      else if (r === "bloq") push(m, "tiro", `Bloquean el remate de ${yo} dentro del área.`, true);
      else if (r === "afuera") { nt -= .1; push(m, "tiro", `${yo} la tiene y la manda ${pick(["por arriba del travesaño", "afuera, cerca del palo"])}.`, true); }
      else if (prob(.5)) push(m, "info", `${yo} intenta el remate pero la defensa despeja.`, true);
    } else if (crea) {
      if (r === "nada") { if (prob(.4)) push(m, "info", `${yo} intenta filtrar un pase pero lo cortan.`, true); }
      else { jug.pasesClave++; nt += .15; push(m, "pase", `Pase clave de ${yo}: ${mate} ${r === "palo" ? "pega en el palo" : r === "ataj" ? "remata y ataja el arquero" : "no logra definir"}.`, true); }
    } else if (r === "palo") push(m, "palo", `¡Palo! ${mate} la pega en el poste para ${equipo}.`);
    else if (r === "ataj" && prob(.3)) push(m, "info", `Atajada del arquero de ${rival} ante ${mate}.`);
  };
  const ataqueRival = (m, fm, fr) => {
    const en = enCancha(m);
    if (prob(.05)) return penalRival(m, en);
    let g = lim(.075 * Math.exp((fr - fm) / 35), .03, .3), vencido = false;
    if (en && pos !== "ARQ" && prob({ DEF: .3, MED: .16, DEL: .04 }[pos])) {
      if (prob(lim(.35 + (A.defensa - 50) * .007 + (A.fisico - 50) * .002, .15, .8) * rend)) {
        jug.recuperaciones++; nt += .18;
        push(m, "corte", pick([`Corte clave de ${yo}: se anticipa y desactiva el ataque de ${rival}.`, `${yo} cierra bien y le saca la pelota al delantero.`, `Gran quite de ${yo} justo antes del remate.`]), true);
        return;
      }
      vencido = true;
    }
    if (en) {
      if (pos === "ARQ") g *= lim(1 - (gk * rend - 55) * .012, .6, 1.35);
      else if (pos === "DEF") g *= 1 - (A.defensa - 50) * .003;
      else if (pos === "MED") g *= 1 - (A.defensa - 50) * .0015;
    }
    const r = resultado(g);
    if (r !== "nada") { st.remR++; if (r === "gol" || r === "ataj") st.arcoR++; }
    if (r === "gol") {
      gR++;
      let txt = `Gol de ${rival}: ${nRiv()} ${pick(DEFINE)}.`;
      if (en) {
        jug.golesContra++;
        if (pos === "ARQ") { nt -= .3; if (prob(.1) && A.manos < 65) { jug.errores++; nt -= .3; txt += ` Se te escapó de las manos, ${yo}.`; } else txt += ` No pudiste hacer nada, ${yo}.`; }
        else if (pos === "DEF") { nt -= .25; if (vencido && prob(.5)) { jug.errores++; nt -= .3; txt += ` Te ganó la posición, ${yo}.`; } }
        else if (pos === "MED") nt -= .05;
      }
      push(m, "golR", txt, en && (pos === "ARQ" || vencido));
    } else if (r === "ataj") {
      if (en && pos === "ARQ") { jug.atajadas++; nt += .3; push(m, "ataj", pick([`¡Atajadón de ${yo}! Vuela y la saca al córner.`, `${yo} responde abajo y evita el gol.`, `Remate de ${rival} y ${yo} la controla sin problemas.`]), true); }
      else if (prob(.25)) push(m, "ataj", `El arquero de ${equipo} ataja el remate de ${nRiv()}.`);
    } else if (r === "palo") push(m, "palo", `¡Palo! ${rival} casi marca: el remate pega en el travesaño.`, en && pos === "ARQ");
    else if (r === "bloq" && en && pos === "DEF" && prob(.5)) { jug.bloqueos++; nt += .12; push(m, "corte", `${yo} se tira y bloquea el remate de ${rival}.`, true); }
  };

  push(0, "info", `Arranca el partido: ${equipo} vs ${rival}.`);
  if (rol === "No convocado") push(0, "info", `${yo}, no entraste en la lista de convocados.`, true);
  else if (rol === "Lesionado") push(0, "info", `${yo}, seguís lesionado y mirás el partido desde afuera.`, true);
  else if (rol === "Titular") push(0, "info", `${yo} está en el once inicial.`, true);
  else push(0, "info", `${yo} arranca en el banco de suplentes.`, true);

  for (const s of slots) {
    const m = s.m;
    switch (s.k) {
      case "descanso": push(45, "info", `Termina el primer tiempo: ${equipo} ${gM} - ${gR} ${rival}.`); break;
      case "entra": push(m, "cambio", `Ingresás vos, ${yo}, por ${nMi()}. A dejar todo en la cancha.`, true); break;
      case "sale": if (m === fin) push(m, "cambio", `Te reemplazan: sale ${yo}, entra ${nMi()}. ${dtMi} te aplaude.`, true); break;
      case "amarilla": if (enCancha(m)) { jug.amarilla = true; nt -= .2; push(m, "amarilla", `Amarilla para ${yo} por una infracción.`, true); } break;
      case "roja": if (enCancha(m)) { jug.roja = true; nt -= 1.5; fin = m; rojasM++; push(m, "roja", `¡Roja directa para ${yo}! ${equipo} se queda con uno menos.`, true); } break;
      case "lesion": if (enCancha(m)) { lesion = generarLesion(); fin = m; push(m, "lesion", `${yo} queda tendido en el piso: ${lesion.nombre.toLowerCase()}. Tiene que salir.`, true); } break;
      case "rojaM": if (rojasM < 2) { rojasM++; push(m, "roja", `Expulsan a ${nMi()} de ${equipo}. Juegan con uno menos.`); } break;
      case "rojaR": if (rojasR < 2) { rojasR++; push(m, "roja", `Expulsan a ${nRiv()} de ${rival}. ${equipo} tiene un hombre más.`); } break;
      case "amarillaM": push(m, "amarilla", `Amarilla para ${nMi()} (${equipo}).`); break;
      case "amarillaR": push(m, "amarilla", `Amarilla para ${nRiv()} (${rival}).`); break;
      default: {
        const fm = fM0 * (1 - .1 * rojasM) * (1 + .05 * rojasR), fr = fR0 * (1 - .1 * rojasR) * (1 + .05 * rojasM);
        const pA = lim(fm ** 2 / (fm ** 2 + fr ** 2) + (gM < gR ? .03 : gM > gR ? -.02 : 0), .12, .88);
        if (prob(pA)) ataqueMio(m, fm, fr); else ataqueRival(m, fm, fr);
      }
    }
  }
  if (rol === "Suplente" && !juega) push(93, "info", `${yo}, el DT no te hizo ingresar. Te quedaste en el banco.`, true);

  /* ---- Penales (Copa Argentina) ---- */
  let penales = null;
  if (copa && gM === gR) {
    push(93, "info", `Empate ${gM}-${gR}: ${copaNombre || "la Copa Argentina"} se define por penales.`);
    const yoToma = juega && fin >= 90 && pos !== "ARQ" && prob(.55), turno = yoToma ? ent(1, 5) : 0;
    const yoAtajo = juega && fin >= 90 && pos === "ARQ";
    let a = 0, b = 0;
    for (let i = 1; (i <= 5 || a === b) && i < 30; i++) {
      const mio = i === turno;
      const okM = prob(mio ? lim((.7 + (A.tiro - 55) * .004) * rend, .5, .93) : .75);
      if (okM) a++;
      if (mio) { jug.remates++; if (okM) { jug.goles++; jug.alArco++; nt += .6; } else nt -= .6; }
      push(200 + i, okM ? "gol" : "tiro", `${equipo}: ${mio ? yo : nMi()} ${okM ? "convierte" : "falla"} su penal. (${a}-${b})`, mio);
      const atajado = yoAtajo && prob(lim(.22 + (A.reflejos - 50) * .003, .1, .4));
      const okR = !atajado && prob(.75);
      if (okR) b++;
      if (atajado) { jug.atajadas++; nt += .6; }
      push(200 + i, okR ? "golR" : atajado ? "ataj" : "tiro", atajado ? `¡Lo atajó ${yo}! (${a}-${b})` : `${rival}: ${nRiv()} ${okR ? "convierte" : "falla"} su penal. (${a}-${b})`, atajado);
      if (i <= 5 && (a > b + (5 - i) || b > a + (5 - i))) break;
    }
    penales = { mi: a, riv: b };
  }
  const clasificado = gM > gR || (gM === gR && !!penales && penales.mi > penales.riv);
  push(93, "fin", `Final del partido: ${equipo} ${gM} - ${gR} ${rival}${penales ? ` (penales ${penales.mi}-${penales.riv})` : ""}.`);

  /* ---- Estadísticas de fondo y nota ---- */
  jug.minutos = juega ? Math.max(0, Math.min(fin, 90) - ini) : 0;
  const mf = jug.minutos / 90, ctl = fM0 ** 3 / (fM0 ** 3 + fR0 ** 3);
  if (juega) {
    jug.pases = Math.round({ ARQ: 26, DEF: 50, MED: 62, DEL: 28 }[pos] * mf * (.8 + ctl * .5) * az(.85, 1.15));
    jug.pasesOk = Math.round(jug.pases * lim(.55 + (pos === "ARQ" ? A.saque : A.pase) / 100 * .4 * rend, .5, .95));
    jug.regates = Math.round({ ARQ: 0, DEF: 1.5, MED: 5, DEL: 7 }[pos] * mf * az(.7, 1.3));
    jug.regatesOk = Math.round(jug.regates * lim(.3 + (A.regate || 0) / 100 * .5 * rend, .3, .8));
    jug.recuperaciones += Math.round({ ARQ: 0, DEF: 4, MED: 4.5, DEL: 1.5 }[pos] * mf * az(.6, 1.3));
    jug.faltas = Math.round({ DEF: 1.6, MED: 1.3, DEL: .9, ARQ: .1 }[pos] * mf * az(.3, 1.8));
    jug.faltasRec = Math.round({ DEF: .8, MED: 1.4, DEL: 2, ARQ: .1 }[pos] * mf * az(.3, 1.8));
    let n = 6 + nt;
    if (jug.pases >= 10) n += (jug.pasesOk / jug.pases - .78) * 1.5;
    n += gM > gR ? .3 : gM < gR ? -.25 : 0;
    if ((pos === "ARQ" || pos === "DEF") && gR === 0 && jug.minutos >= 60) n += .4;
    n += az(-.35, .35);
    n = 6 + (n - 6) * Math.min(1, .35 + jug.minutos / 60 * .65);
    jug.nota = Math.round(lim(n, 3, 10) * 10) / 10;
    jug.figura = jug.nota >= 8.2 || jug.goles >= 2;
  }
  const equipos = { posesion: lim(Math.round(50 + (fM0 - fR0) * .7 + az(-5, 5)), 30, 72), remM: st.remM, remR: st.remR, arcoM: st.arcoM, arcoR: st.arcoR };
  return { golesMi: gM, golesRiv: gR, penales, clasificado, eventos: ev, jug, rol, lesion, equipos };
}

/* ---------- Tabla de posiciones ---------- */
const anotar = (t, gf, gc) => { t.pj++; t.gf += gf; t.gc += gc; if (gf > gc) { t.g++; t.pts += 3; } else if (gf === gc) { t.e++; t.pts++; } else t.p++; };

// Registra tu resultado y simula el resto de la fecha para los demás equipos de la zona.
export function actualizarTabla(p, m, gm, gr) {
  if (m.comp === "Copa Argentina") return;
  const equipos = [p.equipo, ...new Set(p.calendario.filter(x => x.comp === m.comp).map(x => x.rival))];
  if (!p.tablas[m.comp]) p.tablas[m.comp] = Object.fromEntries(equipos.map(e => [e, { pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 }]));
  const t = p.tablas[m.comp];
  anotar(t[p.equipo], gm, gr); anotar(t[m.rival], gr, gm);
  const otros = mezclar(equipos.filter(e => e !== p.equipo && e !== m.rival));
  for (let i = 0; i + 1 < otros.length; i += 2) {
    const a = otros[i], b = otros[i + 1], fa = fuerzaEquipo(a) + 3, fb = fuerzaEquipo(b);
    const ga = poisson(1.2 * Math.exp((fa - fb) / 35)), gb = poisson(1.2 * Math.exp((fb - fa) / 35));
    anotar(t[a], ga, gb); anotar(t[b], gb, ga);
  }
}
export const tablaOrdenada = t => Object.entries(t).map(([equipo, s]) => ({ equipo, ...s }))
  .sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf);
export function posicionEn(p, comp) {
  const t = p.tablas?.[comp]; if (!t) return null;
  const o = tablaOrdenada(t), i = o.findIndex(x => x.equipo === p.equipo);
  return { pos: i + 1, total: o.length, pts: o[i].pts };
}