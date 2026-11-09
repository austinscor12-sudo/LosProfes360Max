// Pantallas de la Selección Argentina: día de partido, ficha de la carrera con la Celeste y Blanca y el panel de la pantalla principal.
import { ir, estado, aviso } from "./router.js";
import { esc } from "./util.js";
import { sede } from "./fixture.js";
import { fuerzaEquipo } from "./data/fuerza.js";
import { DT_SELECCION } from "./data/selecciones.js";
import { simularPartido } from "./simulacion.js";
import { precargar } from "./plantillas.js";
import { reproducir } from "./partido.js";
import { guardarTodo } from "./firebase.js";
import { SELECCION, asegurar, decidirRolSeleccion, aplicarResultadoSeleccion, hayPendientes, resumenSeleccion, tablaElim, posicionElim } from "./seleccion.js";

const barra = (v, malo) => `<div class="barra ${malo ? "mala" : ""}"><i style="width:${v}%"></i></div>`;
const dato = (l, v) => `<div class="dato"><span>${l}</span><b>${v}</b></div>`;
const MENSAJE_ROL = {
  Titular: `${DT_SELECCION} te pone de titular.`,
  Suplente: "Empezás en el banco: puede que entres en el segundo tiempo.",
  Lesionado: "Estás lesionado: no podés jugar este partido."
};

/* ---------- Panel para la pantalla principal ---------- */
export function panelSeleccion(p) {
  const s = asegurar(p), r = resumenSeleccion(p), pend = s.pendientes[0];
  const estadoTxt = pend
    ? `<p class="nota">🇦🇷 Estás convocado: <b>${esc(pend.comp)} · ${esc(pend.etiqueta)}</b> vs ${esc(pend.rival)}${s.pendientes.length > 1 ? ` (${s.pendientes.length} partidos pendientes)` : ""}.</p>`
    : s.lista ? `<p class="sub" style="margin:0 0 8px">${esc(s.lista.texto)}</p>`
    : `<p class="sub" style="margin:0 0 8px">Todavía no te convocaron. ${DT_SELECCION} mira a los que tienen buen nivel, mucho potencial o una gran temporada.</p>`;
  const el = s.elim && !s.elim.final ? `<p class="sub" style="margin:8px 0 0">Eliminatorias ${s.elim.ciclo}: ${posicionElim(s.elim)}° con ${s.elim.tabla[SELECCION].pts} pts tras ${s.elim.jugados} fecha${s.elim.jugados === 1 ? "" : "s"}.</p>` : "";
  const t = s.torneo && s.torneo.convocado && s.torneo.estado === "activo" ? `<p class="sub" style="margin:8px 0 0">${esc(s.torneo.id)}: ${esc(s.torneo.fase)}.</p>` : "";
  return `<div class="panel" style="margin-bottom:16px"><h2>🇦🇷 Selección Argentina</h2>
    ${estadoTxt}
    <div class="stats" style="margin:12px 0 0">
      <div class="stat"><b>${r.partidos}</b><span style="font-size:12px">Partidos</span></div><div class="stat"><b>${r.goles}</b><span style="font-size:12px">Goles</span></div>
      <div class="stat"><b>${r.asist}</b><span style="font-size:12px">Asistencias</span></div><div class="stat"><b>${r.titulos}</b><span style="font-size:12px">Títulos</span></div></div>
    ${el}${t}
    <div class="fila"><button class="btn" id="selinfo">Ver carrera en la Selección</button></div></div>`;
}

/* ---------- Día de partido ---------- */
export function pantallaSeleccion(el) {
  const p = estado.partida, s = asegurar(p), m = s.pendientes[0];
  if (!m) return ir("carrera");
  if (!estado.sesion || estado.sesion.id !== m.id) estado.sesion = { id: m.id, rol: decidirRolSeleccion(p, m) };
  const rol = estado.sesion.rol, sinJugar = rol === "Lesionado", les = p.lesion;
  const extra = m.tipo === "elim" && s.elim ? `<p class="sub" style="margin-top:10px">Eliminatorias ${s.elim.ciclo}: vas ${posicionElim(s.elim)}° con ${s.elim.tabla[SELECCION].pts} puntos.</p>`
    : m.copa ? `<p class="sub" style="margin-top:10px">Eliminación directa: si hay empate se define por penales.</p>` : "";
  el.innerHTML = `
    <h2>🇦🇷 Día de partido</h2><p class="sub">${esc(m.comp)} · ${esc(m.etiqueta)} · ${sede(m)}</p>
    <div class="marcador"><div class="eq">${SELECCION}<small>Fuerza ${fuerzaEquipo(SELECCION)}</small></div><div class="res">vs</div><div class="eq">${esc(m.rival)}<small>Fuerza ${fuerzaEquipo(m.rival)}</small></div></div>
    <div class="panel"><h2>Tu situación</h2>
      ${dato("Para este partido", rol)}
      <p class="sub" style="margin:8px 0">${MENSAJE_ROL[rol]}${les ? ` (${esc(les.nombre)}: ${les.restantes} partido${les.restantes === 1 ? "" : "s"} más con tu club)` : ""}</p>
      <div class="attr"><span>Fatiga</span>${barra(p.fatiga, p.fatiga > 60)}<b>${p.fatiga}</b></div>
      <div class="attr"><span>Forma</span>${barra(p.forma)}<b>${p.forma}</b></div>
      ${extra}
    </div>
    <div class="fila"><button class="btn main" id="jugar">${sinJugar ? "Simular partido" : "Jugar partido"}</button><button class="btn" id="info">Ver carrera en la Selección</button><button class="btn" id="atras">Volver</button></div>`;
  el.querySelector("#atras").onclick = () => ir("carrera");
  el.querySelector("#info").onclick = () => ir("selinfo");
  el.querySelector("#jugar").onclick = async e => {
    e.target.disabled = true;
    await precargar(SELECCION, m.rival);
    const res = simularPartido({ equipo: SELECCION, rival: m.rival, local: m.local, p, rol, copa: !!m.copa, copaNombre: m.comp });
    const ap = aplicarResultadoSeleccion(p, m, res);
    estado.sesion = null;
    guardarTodo(estado.user.uid, p).catch(err => aviso("No se pudo guardar: " + (err.code || err.message)));
    reproducir(el, m, res, ap, { equipo: SELECCION, sinTabla: true, siguiente: () => ir(hayPendientes(p) ? "seleccion" : "carrera") });
  };
}

/* ---------- Ficha: carrera con la Selección ---------- */
export function pantallaSelInfo(el) {
  const p = estado.partida, s = asegurar(p), r = resumenSeleccion(p);
  const stat = (n, v) => `<div class="stat"><b>${v}</b><span>${n}</span></div>`;
  const elim = s.elim ? (() => {
    const filas = tablaElim(s.elim);
    return `<div class="panel" style="margin-bottom:16px"><h2>Eliminatorias ${s.elim.ciclo}</h2>
      ${s.elim.final ? `<p class="nota">${s.elim.final.clasificado ? "✅ Clasificada al Mundial" : "❌ No clasificó al Mundial"} · terminó ${s.elim.final.pos}°.</p>` : `<p class="sub">${s.elim.jugados} de 18 fechas jugadas.</p>`}
      ${filas.map((f, i) => dato(`${i + 1}. ${f.n === SELECCION ? `<b>${SELECCION}</b>` : esc(f.n)}`, `${f.pts} pts · ${f.pj} PJ`)).join("")}</div>`;
  })() : "";
  const t = s.torneo ? `<div class="panel" style="margin-bottom:16px"><h2>${esc(s.torneo.id)}</h2>
      <p class="sub">${s.torneo.estado === "activo" ? `En juego: ${esc(s.torneo.fase)}.` : esc(s.torneo.resultado)}${s.torneo.convocado ? " · Fuiste parte del plantel." : " · No estuviste en el plantel."}</p>
      ${s.torneo.tabla ? `<p class="sub" style="margin:6px 0">Grupo: ${s.torneo.tabla.map(f => `${esc(f.n)} ${f.pts}`).join(" · ")}</p>` : ""}</div>` : "";
  const hist = [...s.historial].reverse().slice(0, 20);
  el.innerHTML = `
    <h2>🇦🇷 Selección Argentina</h2><p class="sub">DT: ${DT_SELECCION}${s.debut ? ` · Debut: ${s.debut.temporada} vs ${esc(s.debut.rival)}` : ""}</p>
    <div class="stats">${stat("Partidos", r.partidos)}${stat("Goles", r.goles)}${stat("Asistencias", r.asist)}${stat("Nota media", r.nota != null ? r.nota.toFixed(1) : "-")}</div>
    <div class="panel" style="margin-bottom:16px">${dato("Convocatorias", r.convocatorias)}${dato("Minutos", r.minutos)}${dato("Títulos con la Selección", r.titulos)}
      ${s.lista ? `<p class="sub" style="margin-top:10px">${esc(s.lista.texto)}</p>` : ""}</div>
    ${elim}${t}
    <div class="panel" style="margin-bottom:16px"><h2>Últimos partidos</h2>
      ${hist.length ? hist.map(h => `<div class="item"><span>${h.temporada} · ${esc(h.comp)} · ${esc(h.etiqueta)}</span><div>${SELECCION} <b>${h.gf} - ${h.gc}</b> ${esc(h.rival)}${h.pen ? ` (pen. ${h.pen.mi}-${h.pen.riv})` : ""}</div>
        <small class="sub">${h.minutos ? `Nota ${h.nota?.toFixed(1)} · ${h.minutos}' · ⚽ ${h.goles} · 👟 ${h.asist}` : "Sin minutos"}</small></div>`).join("") : `<p class="sub">Todavía no jugaste con la Selección.</p>`}</div>
    <div class="fila"><button class="btn" id="atras">Volver</button></div>`;
  el.querySelector("#atras").onclick = () => ir(hayPendientes(p) ? "seleccion" : "carrera");
}