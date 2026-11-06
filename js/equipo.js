import { ir, estado, aviso } from "./router.js";
import { LIGAS } from "./data/equipos.js";
import { nivelPlantel, fuerzaDe } from "./data/fuerza.js";
import { COMPETICIONES, TEMPORADA_INICIAL } from "./data/competiciones.js";
import { guardarPartida } from "./firebase.js";
import { generarAtributos, calcularOverall } from "./atributos.js";
import { rolSegun } from "./evolucion.js";
import { generarCalendario } from "./fixture.js";
import { crearLiga } from "./liga.js";

const color = n => `hsl(${[...n].reduce((a, c) => a + c.charCodeAt(0) * 7, 0) % 360} 55% 38%)`;
const sigla = n => n.replace(/\(.*?\)/g, "").trim().split(/\s+/).map(w => w[0]).join("").slice(0, 3).toUpperCase();

export function pantallaEquipo(el) {
  let liga = LIGAS[0], busca = "", elegido = null, atributos = null;
  // Los atributos se sortean una sola vez por liga elegida, así el rol que ves acá es el mismo con el que arrancás.
  const atributosIniciales = () => atributos ||= generarAtributos(estado.nuevo.posicion, estado.nuevo.jugador, liga.id);
  el.innerHTML = `
    <h2>Elegí tu equipo</h2><p class="sub">Elegí liga y club. Podés arrancar en Argentina o directo en Europa.</p>
    <div class="tabs">${LIGAS.map(l => `<button class="tab" data-id="${l.id}">${l.nombre}</button>`).join("")}</div>
    <label style="max-width:320px;margin-bottom:14px">Buscar equipo<input id="q"></label>
    <div class="grid" id="lista"></div>
    <div class="panel" id="resumen" style="margin-top:20px;display:none"></div>
    <p class="error" id="err"></p>
    <div class="fila"><button class="btn" id="atras">Volver</button><button class="btn main" id="ok" disabled>Comenzar carrera</button></div>`;
  const pintar = () => {
    el.querySelectorAll(".tab").forEach(t => t.classList.toggle("sel", t.dataset.id === liga.id));
    el.querySelector("#lista").innerHTML = liga.equipos.filter(n => n.toLowerCase().includes(busca))
      .map(n => `<button class="card ${n === elegido ? "sel" : ""}" data-n="${n}"><div class="escudo" style="background:${color(n)}">${sigla(n)}</div><b>${n}</b></button>`).join("") || "<p class='sub'>Sin resultados.</p>";
    const r = el.querySelector("#resumen");
    r.style.display = elegido ? "block" : "none";
    if (elegido) {
      const rol = rolSegun(calcularOverall(estado.nuevo.posicion, atributosIniciales()) - nivelPlantel(elegido));
      r.innerHTML = `<b>${elegido}</b><div class="tags">${COMPETICIONES[liga.id].map(c => `<span>${c}</span>`).join("")}</div>
        <p class="sub" style="margin:10px 0 0">Nivel del club: ${fuerzaDe(elegido)} · Rol con el que arrancarías: <b>${rol}</b></p>`;
    }
    el.querySelector("#ok").disabled = !elegido;
  };
  el.querySelector(".tabs").onclick = e => { const t = e.target.closest(".tab"); if (!t) return; liga = LIGAS.find(l => l.id === t.dataset.id); elegido = null; atributos = null; pintar(); };
  el.querySelector("#q").oninput = e => { busca = e.target.value.toLowerCase(); pintar(); };
  el.querySelector("#lista").onclick = e => { const c = e.target.closest(".card"); if (!c) return; elegido = c.dataset.n; pintar(); };
  el.querySelector("#atras").onclick = () => ir("posicion");
  el.querySelector("#ok").onclick = async () => {
    const ok = el.querySelector("#ok"); ok.disabled = true; ok.textContent = "Guardando…";
    try {
      const attrs = atributosIniciales();
      // Liga Profesional: liga real (zonas + fixture de los 30 equipos). Primera Nacional: calendario simple.
      let extra;
      if (liga.id === "AR1") {
        const lg = crearLiga(elegido);
        extra = { zona: lg.zona, equiposLiga: lg.equipos, fixture: lg.fixture, calendario: lg.calendario };
      } else extra = { calendario: generarCalendario(elegido, liga.id) };
      const datos = {
        jugador: estado.nuevo.jugador, posicion: estado.nuevo.posicion,
        equipo: elegido, liga: liga.id, ligaNombre: liga.nombre,
        temporada: TEMPORADA_INICIAL, competiciones: COMPETICIONES[liga.id],
        atributos: attrs,
        ...extra,
        progreso: { partidos: 0, goles: 0, asistencias: 0, overall: calcularOverall(estado.nuevo.posicion, attrs) }
      };
      const ref = await guardarPartida(estado.user.uid, datos);
      estado.partida = { id: ref.id, ...datos }; aviso("Partida guardada"); ir("carrera");
    } catch (e) { ok.disabled = false; ok.textContent = "Comenzar carrera"; el.querySelector("#err").textContent = "No se pudo guardar: " + (e.code || e.message); }
  };
  pintar();
}