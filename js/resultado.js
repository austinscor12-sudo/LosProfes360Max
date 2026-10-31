// Aplica el resultado de un partido a la partida: estadísticas, forma, lesiones, entrenamiento, tabla y copa.
import { siguienteCopa } from "./fixture.js";
import { actualizarTabla, posicionEn } from "./simulacion.js";
import { aplicarLesion, entrenarSemana } from "./evolucion.js";

const lim = (n, a, b) => Math.max(a, Math.min(b, n));

export function aplicarResultado(p, m, res) {
  const j = res.jug, t = p.temp, pr = p.progreso, gm = res.golesMi, gr = res.golesRiv;
  const out = { mejoras: [], lesion: null, lesionEntreno: null, recuperado: null, cierres: [], copa: "", tabla: null };

  m.jugado = true;
  m.resultado = `${gm > gr ? "Ganaste" : gm < gr ? "Perdiste" : "Empate"} ${gm}-${gr}${res.penales ? ` (pen. ${res.penales.mi}-${res.penales.riv})` : ""}${j.minutos ? ` · Nota ${j.nota.toFixed(1)}` : ""}`;
  m.detalle = { eventos: res.eventos, jug: j, equipos: res.equipos, rol: res.rol, penales: res.penales, golesMi: gm, golesRiv: gr };

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

  // Tabla y cierre de torneos
  if (m.comp !== "Copa Argentina") {
    actualizarTabla(p, m, gm, gr);
    out.tabla = { comp: m.comp, ...posicionEn(p, m.comp) };
    if (p.calendario.filter(x => x.comp === m.comp).every(x => x.jugado)) {
      t.pos[m.comp] = out.tabla.pos;
      out.cierres.push(`${m.comp}: terminaste ${out.tabla.pos}° de ${out.tabla.total}.`);
      if (out.tabla.pos === 1) { p.palmares.push({ temporada: p.temporada, titulo: m.comp }); out.cierres.push(`¡Campeón del ${m.comp}!`); }
    }
  } else if (res.clasificado) {
    if (m.etiqueta === "Final") { t.copa = "Campeón"; p.palmares.push({ temporada: p.temporada, titulo: "Copa Argentina" }); out.copa = "¡Campeón de la Copa Argentina!"; }
    else { const s = siguienteCopa(p.calendario, m, p.equipo); t.copa = `Clasificado a ${s.etiqueta}`; out.copa = `Pasaste a ${s.etiqueta} de la Copa Argentina.`; }
  } else { t.copa = `Eliminado en ${m.etiqueta}`; out.copa = `Eliminados de la Copa Argentina en ${m.etiqueta}.`; }
  return out;
}