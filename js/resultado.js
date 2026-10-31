// Aplica el resultado de un partido a la partida: estadísticas, forma, lesiones, entrenamiento, tabla y copa.
import { siguienteCopa } from "./fixture.js";
import { actualizarTabla, posicionEn } from "./simulacion.js";
import { aplicarLesion, entrenarSemana } from "./evolucion.js";
import { registrarFecha, calcularTabla } from "./liga.js";

const lim = (n, a, b) => Math.max(a, Math.min(b, n));

// Puesto del usuario en su zona (o en la tabla anual de los 30 equipos) para los torneos indicados.
function puesto(p, torneos, anual) {
  const mi = p.equiposLiga.indexOf(p.equipo), base = mi < 15 ? 0 : 15;
  const idxs = anual ? Array.from({ length: 30 }, (_, k) => k) : Array.from({ length: 15 }, (_, k) => base + k);
  const filas = calcularTabla(p, torneos, idxs), k = filas.findIndex(f => f.i === mi);
  return { pos: k + 1, total: idxs.length, pts: filas[k].pts };
}

export function aplicarResultado(p, m, res) {
  const j = res.jug, t = p.temp, pr = p.progreso, gm = res.golesMi, gr = res.golesRiv;
  const out = { mejoras: [], lesion: null, lesionEntreno: null, recuperado: null, cierres: [], copa: "", tabla: null };

  // Mismo formato que usa el calendario y la tabla: resultado en orden local-visitante (neutral = tu equipo primero).
  const soyLocal = m.local !== false;
  m.jugado = true;
  m.resultado = { local: soyLocal ? gm : gr, visitante: soyLocal ? gr : gm };
  m.statsJugador = { goles: j.goles, asistencias: j.asist, nota: j.nota ?? null };
  if (res.penales) m.penales = res.penales;
  m.detalle = { eventos: res.eventos, jug: j, equipos: res.equipos, rol: res.rol, penales: res.penales };

  // Estadísticas
  t.equipoPJ++;
  if (j.minutos > 0) {
    pr.partidos++; t.partidos++; t.minutos += j.minutos; t.notaSuma += j.nota;
    if (res.rol === "Titular") t.titular++;
    if (j.figura) t.figuras++;
  }
  pr.goles += j.goles; pr.asistencias += j.asist; t.goles += j.goles; t.asist += j.asist;
  if (j.amarilla) t.amarillas++;
  if (j.roja) t.rojas++;

  // Forma: depende de tu nota y del resultado del equipo
  p.forma = lim(p.forma + (gm > gr ? 3 : gm < gr ? -3 : 0) + (j.nota ? (j.nota - 6.4) * 5 : 0), 20, 100);

  // Lesión en el partido y semana de entrenamiento
  if (res.lesion) out.lesion = aplicarLesion(p, res.lesion);
  const e = entrenarSemana(p, j.minutos ? j : null);
  out.mejoras = e.mejoras; out.lesionEntreno = e.lesion; out.recuperado = e.recuperado;

  if (m.comp !== "Copa Argentina") {
    const real = p.fixture && m.torneo;   // liga real (zonas) o calendario simple con tabla propia
    if (real) { registrarFecha(p, m); out.tabla = { comp: m.comp, ...puesto(p, [m.torneo], false) }; }
    else { actualizarTabla(p, m, gm, gr); out.tabla = { comp: m.comp, ...posicionEn(p, m.comp) }; }
    if (p.calendario.filter(x => x.comp === m.comp).every(x => x.jugado)) {
      t.pos[m.comp] = out.tabla.pos;
      out.cierres.push(`${m.comp}: terminaste ${out.tabla.pos}° de ${out.tabla.total}${real ? " en tu zona" : ""}.`);
      if (!real && out.tabla.pos === 1) { p.palmares.push({ temporada: p.temporada, titulo: m.comp }); out.cierres.push(`¡Campeón del ${m.comp}!`); }
      if (real && m.torneo === "CL") { const a = puesto(p, ["AP", "CL"], true); t.pos.Anual = a.pos; out.cierres.push(`Tabla anual: ${a.pos}° de 30.`); }
    }
  } else if (res.clasificado) {
    if (m.etiqueta === "Final") { t.copa = "Campeón"; p.palmares.push({ temporada: p.temporada, titulo: "Copa Argentina" }); out.copa = "¡Campeón de la Copa Argentina!"; }
    else { const s = siguienteCopa(p.calendario, m, p.equipo); t.copa = `Clasificado a ${s.etiqueta}`; out.copa = `Pasaste a ${s.etiqueta} de la Copa Argentina.`; }
  } else { t.copa = `Eliminado en ${m.etiqueta}`; out.copa = `Eliminados de la Copa Argentina en ${m.etiqueta}.`; }
  return out;
}