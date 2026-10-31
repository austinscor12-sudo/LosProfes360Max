import { ir, estado, aviso } from "./router.js";
import { POSICIONES, TEMPORADA_INICIAL } from "./data/competiciones.js";
import { esc } from "./util.js";
import { ETIQUETAS } from "./atributos.js";
import { textoPartido, sede, temporadaTerminada } from "./fixture.js";
import { completarPartida, rolEstimado, usd } from "./evolucion.js";
import { noLeidos } from "./celular.js";
import { puestoEnZona } from "./liga.js";
import { abrirTabla } from "./tabla.js";
import { guardarTodo } from "./firebase.js";
import { PRIMERA, NACIONAL } from "./data/equipos.js";
import { esArgentino, hayPendientes } from "./seleccion.js";
import { panelSeleccion } from "./pantallaseleccion.js";

// ==========================================
// BASE DE DATOS: EQUIPOS (EDITÁ ESTO PARA TU 2026)
// ==========================================
// Los nombres tienen que coincidir EXACTO con los de data/equipos.js (antes se buscaba con "includes":
// "independiente" también agarraba a Independiente Rivadavia, "racing" a Racing (Córdoba), etc.).
const DATOS_EQUIPOS_2026 = {
    "Boca Juniors": { dt: "E. Cavani (DT)", figuras: "L. Brey, K. Zenón, I. Miramón" },
    "River Plate": { dt: "J. Pinola (DT)", figuras: "F. Mastantuono, S. Boselli" },
    "Racing Club": { dt: "Lisandro López (DT)", figuras: "M. Salas, B. Zuculini" },
    "Independiente": { dt: "C. Tevez", figuras: "S. López, M. Giménez" },
    "San Lorenzo": { dt: "L. Romagnoli", figuras: "E. Irala, G. Gómez" },
    "Estudiantes (LP)": { dt: "E. Pérez (DT)", figuras: "S. Ascacíbar, T. Palacios" },
    "default": { dt: "DT Interino", figuras: "Plantel profesional 2026" }
};

function obtenerDatosReales(nombreEquipo) {
    return DATOS_EQUIPOS_2026[nombreEquipo] || DATOS_EQUIPOS_2026["default"];
}

export function pantallaCarrera(el) {
  const p = estado.partida;
  if (p.retirado) return ir("retiro");   // carrera terminada: se ve el resumen del retiro
  // Completa las partidas viejas a las que les falta algo (atributos, liga real, calendario, contrato, etc.).
  if (completarPartida(p) && estado.user?.uid && p.id) guardarTodo(estado.user.uid, p).catch(() => {});
  const j = p.jugador, pr = p.progreso, t = p.temp, les = p.lesion;

  const pos = POSICIONES.find(x => x.id === p.posicion)?.nombre || p.posicion;
  const proximos = p.calendario.filter(m => m.jugado !== true).slice(0, 3);
  const jugados = p.calendario.filter(m => m.jugado === true).slice(-5).reverse();
  const fin = temporadaTerminada(p.calendario);
  const conv = esArgentino(p) && hayPendientes(p);   // convocado a la Selección: se juega antes que el próximo partido del club

  // Estadísticas colectivas del equipo
  let misPuntos = 0, misPG = 0, misPE = 0, misPP = 0;
  p.calendario.filter(m => m.jugado === true && (!p.fixture || m.torneo)).forEach(m => {
    const esLocal = m.local !== false;
    const aFavor = esLocal ? (m.resultado?.local || 0) : (m.resultado?.visitante || 0);
    const enContra = esLocal ? (m.resultado?.visitante || 0) : (m.resultado?.local || 0);
    if (aFavor > enContra) { misPuntos += 3; misPG++; } else if (aFavor === enContra) { misPuntos += 1; misPE++; } else misPP++;
  });

  let infoZona = "";
  if (p.fixture) {
    const z = puestoEnZona(p);
    infoZona = `<p class="sub" style="margin-bottom:10px">Zona ${p.zona} · ${z.torneo === "AP" ? "Apertura" : "Clausura"}: ${z.pj > 0 ? `${z.puesto}.º de 15 tras ${z.pj} fecha${z.pj === 1 ? "" : "s"}` : "todavía sin partidos"}</p>`;
  }

  // Es una foto de octubre de 2026: en las temporadas siguientes el DT y las figuras ya no coinciden, así que no se muestra.
  const datosClub = p.temporada === TEMPORADA_INICIAL && (PRIMERA.includes(p.equipo) || NACIONAL.includes(p.equipo)) ? obtenerDatosReales(p.equipo) : null;
  const stat = (n, v) => `<div class="stat"><b>${v}</b><span style="font-size:12px">${n}</span></div>`;
  const nota = t.partidos ? (t.notaSuma / t.partidos).toFixed(1) : "-";

  el.innerHTML = `
    <div class="cabecera" style="margin-bottom: 15px;">
      <div><h2>${esc(j.nombre)} ${esc(j.apellido)}${j.apodo ? ` “${esc(j.apodo)}”` : ""}</h2>
      <p class="sub">${pos} · ${j.edad} años · ${esc(j.nacionalidad)} · pie ${j.pie.toLowerCase()}</p></div>
      <div class="tags"><span>${esc(p.equipo)}</span><span>Temporada ${p.temporada}</span><span>${rolEstimado(p)}</span>${les ? `<span class="lesion">🩹 ${esc(les.nombre)} · ${les.restantes} partidos</span>` : ""}</div>
    </div>

    <div class="stats">${stat("Valoración", pr.overall)}${stat("Partidos (carrera)", pr.partidos)}${stat("Goles (carrera)", pr.goles)}${stat("Asistencias (carrera)", pr.asistencias)}</div>

    <div class="panel" style="margin-bottom:16px"><h2>Temporada ${p.temporada}</h2>
      <div class="stats" style="margin:12px 0 0">${stat("Partidos", t.partidos)}${stat("Goles", t.goles)}${stat("Asistencias", t.asist)}${stat("Nota media", nota)}</div>
      ${t.copa ? `<p class="sub" style="margin:10px 0 0">Copa Argentina: ${esc(t.copa)}</p>` : ""}</div>

    ${esArgentino(p) ? panelSeleccion(p) : ""}

    ${datosClub ? `<div class="panel" style="margin-bottom:16px; background:#1a1a2e; border: 1px solid #333;">
      <h2 style="color:#4ade80;">Actualidad del Club (Oct 2026)</h2>
      <p style="margin:5px 0; font-size:14px;">📋 <b>DT Actual:</b> ${datosClub.dt}</p>
      <p style="margin:5px 0; font-size:14px;">⭐ <b>Figuras:</b> ${datosClub.figuras}</p>
    </div>` : ""}

    <div class="panel" style="margin-bottom:16px;">
      <h2>Estadísticas Colectivas</h2>
      ${infoZona}
      <div style="display:flex; justify-content:space-between; text-align:center; margin-bottom:10px; background:#222; padding:10px; border-radius:8px;">
          <div><b style="font-size:18px;">${misPuntos}</b><br><span style="font-size:11px; opacity:0.7;">Puntos</span></div>
          <div><b style="font-size:18px; color:#4ade80;">${misPG}</b><br><span style="font-size:11px; opacity:0.7;">Victorias</span></div>
          <div><b style="font-size:18px; color:#fbbf24;">${misPE}</b><br><span style="font-size:11px; opacity:0.7;">Empates</span></div>
          <div><b style="font-size:18px; color:#f87171;">${misPP}</b><br><span style="font-size:11px; opacity:0.7;">Derrotas</span></div>
      </div>
      <div class="fila"><button class="btn" id="btn-tabla" style="background:#444;">📊 Ver Tabla de Posiciones</button></div>
    </div>

    <div class="panel" style="margin-bottom:16px"><h2>Atributos</h2>
      <div class="attrs">${Object.entries(p.atributos).map(([k, v]) => `<div class="attr"><span>${ETIQUETAS[k]}</span><div class="barra"><i style="width:${v}%"></i></div><b>${v}</b></div>`).join("")}</div>
      <div class="attrs"><div class="attr"><span>Fatiga</span><div class="barra ${p.fatiga > 60 ? "mala" : ""}"><i style="width:${p.fatiga}%"></i></div><b>${p.fatiga}</b></div><div class="attr"><span>Forma</span><div class="barra"><i style="width:${p.forma}%"></i></div><b>${p.forma}</b></div></div>
    </div>

    <div class="panel" style="margin-bottom:16px"><h2>Historial de Partidos</h2>
      ${jugados.length > 0 ? jugados.map(m => {
        const resLoc = m.resultado?.local ?? 0, resVis = m.resultado?.visitante ?? 0;
        const miNota = m.statsJugador?.nota?.toFixed(1) ?? "-";
        const textoRes = m.local !== false
          ? `${esc(p.equipo)} <b>${resLoc} - ${resVis}</b> ${esc(m.rival)}`
          : `${esc(m.rival)} <b>${resLoc} - ${resVis}</b> ${esc(p.equipo)}`;
        return `<div class="item" style="border-left: 4px solid ${miNota >= 7 ? "#4ade80" : (miNota <= 5 ? "#f87171" : "#fbbf24")}; padding-left: 10px;">
          <span>${esc(m.comp)}</span><div style="margin: 4px 0; font-size: 15px;">${textoRes}${m.penales ? ` (pen. ${m.penales.mi}-${m.penales.riv})` : ""}</div>
          <small class="sub">Nota: <b>${miNota}</b> | ⚽ Goles: ${m.statsJugador?.goles ?? 0} | 👟 Asist: ${m.statsJugador?.asistencias ?? 0}</small>
        </div>`;
      }).join("") : "<p class='sub'>Aún no has debutado en la temporada.</p>"}
    </div>

    <div class="panel" style="margin-bottom:16px"><h2>Próximos partidos</h2>
      ${proximos.map(m => `<div class="item"><span>${esc(m.etiqueta)}</span><b>${esc(textoPartido(m, p.equipo))}</b><small class="sub">${esc(m.comp)} · ${sede(m)}</small></div>`).join("") || "<p class='sub'>No quedan partidos en el calendario.</p>"}
      <div class="fila"><button class="btn" id="cal">Ver calendario completo</button></div>
    </div>

    <div class="panel"><h2>Contrato</h2><p class="sub" style="margin:4px 0 0">${usd(p.contrato.salario)} por mes · ${p.contrato.anios} año${p.contrato.anios === 1 ? "" : "s"} restantes · Ahorros ${usd(p.ahorros || 0)}</p></div>

    <div class="fila">
      ${conv ? `<button class="btn main" id="seljugar">🇦🇷 Jugar con la Selección</button>` : fin ? `<button class="btn main" id="fin">Cerrar temporada</button>` : `<button class="btn main" id="jugar">Jugar próximo partido</button>`}
      <button class="btn" id="ges">Entrenamiento y contrato</button>
      <button class="btn" id="cel">📱 Celular${noLeidos(p) ? ` (${noLeidos(p)})` : ""}</button>
      <button class="btn" id="btn-guardar" style="background-color: #3b82f6; color: white; border: none;">Guardar Partida</button>
      <button class="btn" id="menu">Menú</button>
    </div>`;

  const on = (id, fn) => { const b = el.querySelector(id); if (b) b.onclick = fn; };
  on("#menu", () => ir("menu")); on("#cal", () => ir("calendario")); on("#ges", () => ir("gestion")); on("#cel", () => ir("celular"));
  on("#btn-tabla", () => abrirTabla(p));
  on("#jugar", () => ir("partido")); on("#fin", () => ir("fin"));
  on("#seljugar", () => ir("seleccion")); on("#selinfo", () => ir("selinfo"));
  on("#btn-guardar", () => {
    const b = el.querySelector("#btn-guardar");
    if (!(estado.user?.uid && p.id)) return aviso("No hay usuario conectado.");
    b.textContent = "Guardando..."; b.disabled = true;
    guardarTodo(estado.user.uid, p)
      .then(() => aviso("¡Partida guardada correctamente en la nube!"))
      .catch(err => { console.error("Error Firebase:", err); aviso("Error al guardar. Revisá tu conexión a internet."); })
      .finally(() => { b.textContent = "Guardar Partida"; b.disabled = false; });
  });
}