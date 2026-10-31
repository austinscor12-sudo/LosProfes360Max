import { ir, estado, aviso } from "./router.js";
import { esc } from "./util.js";
import { sede } from "./fixture.js";
import { ETIQUETAS } from "./atributos.js";
import { fuerzaEquipo } from "./data/fuerzas.js";
import { simularPartido, decidirRol, fmtMin } from "./simulacion.js";
import { aplicarResultado } from "./resultado.js";
import { rolEstimado } from "./evolucion.js";
import { temporadaTerminada } from "./fixture.js";
import { guardarTodo } from "./firebase.js";

const ICONOS = { info: "⏱️", gol: "⚽", golR: "⚽", tiro: "🎯", palo: "🥅", pase: "🅰️", corte: "🛡️", ataj: "🧤", penal: "⚠️", amarilla: "🟨", roja: "🟥", lesion: "🩹", cambio: "🔄", fin: "🏁" };
const MENSAJE_ROL = {
  Titular: "El DT te pone de titular.", Suplente: "Empezás en el banco: puede que entres en el segundo tiempo.",
  "No convocado": "No entraste en la lista de convocados.", Lesionado: "Estás lesionado y no podés jugar."
};
const barra = (v, malo) => `<div class="barra ${malo ? "mala" : ""}"><i style="width:${v}%"></i></div>`;
const dato = (l, v) => `<div class="dato"><span>${l}</span><b>${v}</b></div>`;

export function pantallaPartido(el) {
  const p = estado.partida, m = p.calendario.find(x => !x.jugado);
  if (!m) return ir("carrera");
  if (!estado.sesion || estado.sesion.id !== m.id) estado.sesion = { id: m.id, rol: decidirRol(p) };
  const rol = estado.sesion.rol, copa = m.comp === "Copa Argentina", sinJugar = rol === "Lesionado" || rol === "No convocado";
  const les = p.lesion;
  el.innerHTML = `
    <h2>Día de partido</h2><p class="sub">${esc(m.comp)} · ${esc(m.etiqueta)} · ${sede(m)}</p>
    <div class="marcador"><div class="eq">${esc(p.equipo)}<small>Fuerza ${fuerzaEquipo(p.equipo)}</small></div><div class="res">vs</div><div class="eq">${esc(m.rival)}<small>Fuerza ${fuerzaEquipo(m.rival)}</small></div></div>
    <div class="panel"><h2>Tu situación</h2>
      <div class="dato"><span>Rol en el plantel</span><b>${rolEstimado(p)}</b></div>
      <div class="dato"><span>Para este partido</span><b>${rol}</b></div>
      <p class="sub" style="margin:8px 0">${MENSAJE_ROL[rol]}${les ? ` (${esc(les.nombre)}: ${les.restantes} partido${les.restantes === 1 ? "" : "s"} más)` : ""}</p>
      <div class="attr"><span>Fatiga</span>${barra(p.fatiga, p.fatiga > 60)}<b>${p.fatiga}</b></div>
      <div class="attr"><span>Forma</span>${barra(p.forma)}<b>${p.forma}</b></div>
      ${copa ? `<p class="sub" style="margin-top:10px">Copa Argentina: si hay empate se define por penales.</p>` : ""}
    </div>
    <p class="error" id="err"></p>
    <div class="fila"><button class="btn main" id="jugar">${sinJugar ? "Simular partido" : "Jugar partido"}</button><button class="btn" id="gest">Entrenamiento y contrato</button><button class="btn" id="atras">Volver</button></div>`;
  el.querySelector("#atras").onclick = () => ir("carrera");
  el.querySelector("#gest").onclick = () => ir("gestion");
  el.querySelector("#jugar").onclick = async e => {
    e.target.disabled = true;
    const res = simularPartido({ equipo: p.equipo, rival: m.rival, local: m.local, p, rol, copa });
    const ap = aplicarResultado(p, m, res);
    estado.sesion = null;
    // Se guarda antes de mostrar el partido: si cerrás la pestaña a mitad, el resultado ya cuenta.
    guardarTodo(estado.user.uid, p).catch(err => aviso("No se pudo guardar: " + (err.code || err.message)));
    reproducir(el, m, res, ap);
  };
}

const fila = e => `<div class="ev ${e.yo ? "yo" : ""} t-${e.t}"><span class="min">${fmtMin(e.m)}</span><span class="ico">${ICONOS[e.t] || "•"}</span><p>${esc(e.x)}</p></div>`;

function reproducir(el, m, res, ap) {
  const p = estado.partida;
  el.innerHTML = `
    <h2>${esc(m.comp)} · ${esc(m.etiqueta)}</h2><p class="sub">${sede(m)}</p>
    <div class="marcador"><div class="eq">${esc(p.equipo)}</div><div class="res" id="res">0 - 0</div><div class="eq">${esc(m.rival)}</div></div>
    <p class="minuto" id="min">Previa</p>
    <div id="resumen"></div>
    <div class="panel" id="feed"></div>
    <div class="fila"><button class="btn" id="saltar">Saltar al final</button></div>`;
  const feed = el.querySelector("#feed"), marc = el.querySelector("#res"), min = el.querySelector("#min");
  let i = 0, timer = 0;
  const mostrar = () => {
    const e = res.eventos[i++];
    feed.insertAdjacentHTML("afterbegin", fila(e));
    marc.textContent = `${e.gm} - ${e.gr}`; min.textContent = e.t === "fin" ? "Final" : `Minuto ${fmtMin(e.m)}`;
  };
  const terminar = () => {
    clearTimeout(timer);
    el.querySelector("#saltar").hidden = true;
    marc.textContent = `${res.golesMi} - ${res.golesRiv}`; min.textContent = res.penales ? `Final · penales ${res.penales.mi}-${res.penales.riv}` : "Final";
    el.querySelector("#resumen").innerHTML = resumen(p, m, res, ap);
    const r = el.querySelector("#resumen");
    r.querySelector("#sig").onclick = () => ir(temporadaTerminada(p.calendario) ? "fin" : "carrera");
    r.querySelector("#tab").onclick = () => ir("tabla");
    r.querySelector("#ges").onclick = () => ir("gestion");
    window.scrollTo(0, 0);
  };
  const paso = () => {
    if (!el.isConnected) return;
    if (i >= res.eventos.length) return terminar();
    const e = res.eventos[i]; mostrar();
    timer = setTimeout(paso, e.t === "gol" || e.t === "golR" ? 1300 : 650);
  };
  el.querySelector("#saltar").onclick = () => { while (i < res.eventos.length) mostrar(); terminar(); };
  paso();
}

function resumen(p, m, res, ap) {
  const j = res.jug, pos = p.posicion, arq = pos === "ARQ", gm = res.golesMi, gr = res.golesRiv, q = res.equipos;
  const jugador = j.minutos ? `
    <div class="panel" style="margin-bottom:16px"><h2>Tu actuación${j.figura ? " · ⭐ Figura del partido" : ""}</h2>
      <div class="stats" style="margin-top:12px">
        <div class="stat"><b>${j.nota.toFixed(1)}</b><span>Nota</span></div><div class="stat"><b>${j.minutos}'</b><span>Minutos</span></div>
        ${arq ? `<div class="stat"><b>${j.atajadas}</b><span>Atajadas</span></div><div class="stat"><b>${j.golesContra}</b><span>Goles recibidos</span></div>`
        : `<div class="stat"><b>${j.goles}</b><span>Goles</span></div><div class="stat"><b>${j.asist}</b><span>Asistencias</span></div>`}
      </div>
      ${arq ? "" : dato("Remates (al arco)", `${j.remates} (${j.alArco})`)}${arq ? "" : dato("Pases clave", j.pasesClave)}
      ${dato("Pases completos", `${j.pasesOk}/${j.pases}${j.pases ? ` (${Math.round(j.pasesOk / j.pases * 100)}%)` : ""}`)}
      ${arq ? "" : dato("Regates exitosos", `${j.regatesOk}/${j.regates}`)}
      ${arq ? "" : dato("Recuperaciones", j.recuperaciones)}${j.bloqueos ? dato("Bloqueos", j.bloqueos) : ""}
      ${pos === "DEF" ? dato("Goles recibidos (en cancha)", j.golesContra) : ""}
      ${dato("Faltas cometidas / recibidas", `${j.faltas} / ${j.faltasRec}`)}
      ${dato("Tarjetas", j.roja ? "🟥 Roja" : j.amarilla ? "🟨 Amarilla" : "Ninguna")}${j.errores ? dato("Errores que terminaron en gol", j.errores) : ""}
    </div>` : `<div class="panel" style="margin-bottom:16px"><h2>Tu actuación</h2><p class="sub">No sumaste minutos en este partido.</p></div>`;
  const cambios = [
    ...ap.mejoras.map(x => `📈 ${ETIQUETAS[x.k]} sube a ${x.a}`),
    ap.lesion ? `🩹 Lesión: ${ap.lesion.nombre} (${ap.lesion.gravedad}), baja ${ap.lesion.total} partidos.${ap.lesion.secuela ? ` Secuelas: ${ap.lesion.secuela}.` : ""}` : "",
    ap.lesionEntreno ? `🩹 Te lesionaste entrenando: ${ap.lesionEntreno.nombre}, baja ${ap.lesionEntreno.total} partidos.` : "",
    ap.recuperado ? `✅ Te recuperaste de: ${ap.recuperado.nombre}.` : "", ap.copa, ...ap.cierres,
    ap.tabla ? `Posición en ${ap.tabla.comp}: ${ap.tabla.pos}° de ${ap.tabla.total} (${ap.tabla.pts} pts).` : ""
  ].filter(Boolean);
  return `
    <div class="panel" style="margin-bottom:16px"><h2>${gm > gr ? "Victoria" : gm < gr ? "Derrota" : "Empate"} · ${esc(p.equipo)} ${gm}-${gr} ${esc(m.rival)}</h2>
      ${dato("Posesión", `${q.posesion}% - ${100 - q.posesion}%`)}${dato("Remates (al arco)", `${q.remM} (${q.arcoM}) - ${q.remR} (${q.arcoR})`)}</div>
    ${jugador}
    <div class="panel" style="margin-bottom:16px"><h2>Después del partido</h2>
      ${cambios.map(c => `<p class="nota">${esc(c)}</p>`).join("")}
      <div class="attr"><span>Fatiga</span>${barra(p.fatiga, p.fatiga > 60)}<b>${p.fatiga}</b></div>
      <div class="attr"><span>Forma</span>${barra(p.forma)}<b>${p.forma}</b></div></div>
    <div class="fila"><button class="btn main" id="sig">${temporadaTerminada(p.calendario) ? "Cerrar temporada" : "Continuar"}</button><button class="btn" id="tab">Ver tabla</button><button class="btn" id="ges">Entrenamiento</button></div>
    <h2 style="margin-top:28px">Minuto a minuto</h2>`;
}