import { ir, estado, aviso } from "./router.js";
import { POSICIONES } from "./data/competiciones.js";
import { esc } from "./util.js";
import { ETIQUETAS, generarAtributos, calcularOverall } from "./atributos.js";
import { generarCalendario, textoPartido, sede } from "./fixture.js";
import { actualizarPartida } from "./firebase.js";

export function pantallaCarrera(el) {
  const p = estado.partida, j = p.jugador, pr = p.progreso;

  // Completa las partidas viejas a las que les falta algo (atributos, calendario).
  const faltantes = {};
  if (!p.atributos) {
    p.atributos = generarAtributos(p.posicion, j, p.liga);
    pr.overall = calcularOverall(p.posicion, p.atributos);
    faltantes.atributos = p.atributos;
    faltantes["progreso.overall"] = pr.overall;
  }
  if (!p.calendario) {
    p.calendario = generarCalendario(p.equipo, p.liga);
    faltantes.calendario = p.calendario;
  }
  if (Object.keys(faltantes).length) actualizarPartida(estado.user.uid, p.id, faltantes).catch(() => {});

  const pos = POSICIONES.find(x => x.id === p.posicion)?.nombre || p.posicion;
  const proximos = p.calendario.filter(m => !m.jugado).slice(0, 5);
  const stat = (n, v) => `<div class="stat"><b>${v}</b><span>${n}</span></div>`;
  el.innerHTML = `
    <div class="cabecera">
      <div><h2>${esc(j.nombre)} ${esc(j.apellido)}${j.apodo ? ` “${esc(j.apodo)}”` : ""}</h2>
      <p class="sub">${pos} · ${j.edad} años · ${esc(j.nacionalidad)} · pie ${j.pie.toLowerCase()}</p></div>
      <div class="tags"><span>${esc(p.equipo)}</span><span>Temporada ${p.temporada}</span></div>
    </div>
    <div class="stats">${stat("Valoración", pr.overall)}${stat("Partidos", pr.partidos)}${stat("Goles", pr.goles)}${stat("Asistencias", pr.asistencias)}</div>
    <div class="panel" style="margin-bottom:16px"><h2>Atributos</h2>
      <div class="attrs">${Object.entries(p.atributos).map(([k, v]) => `<div class="attr"><span>${ETIQUETAS[k]}</span><div class="barra"><i style="width:${v}%"></i></div><b>${v}</b></div>`).join("")}</div>
    </div>
    <div class="panel" style="margin-bottom:16px"><h2>Próximos partidos</h2>
      ${proximos.map(m => `<div class="item"><span>${esc(m.etiqueta)}</span><b>${esc(textoPartido(m, p.equipo))}</b><small class="sub">${esc(m.comp)} · ${sede(m)}</small></div>`).join("") || "<p class='sub'>No quedan partidos en el calendario.</p>"}
      <div class="fila"><button class="btn" id="cal">Ver calendario completo</button></div>
    </div>
    <div class="panel"><h2>Competiciones</h2><div class="tags">${p.competiciones.map(c => `<span>${esc(c)}</span>`).join("")}</div></div>
    <div class="fila"><button class="btn main" id="jugar">Jugar próximo partido</button><button class="btn" id="menu">Menú principal</button></div>`;
  el.querySelector("#cal").onclick = () => ir("calendario");
  el.querySelector("#jugar").onclick = () => aviso("La simulación de partidos viene en el próximo paso");
  el.querySelector("#menu").onclick = () => ir("menu");
}