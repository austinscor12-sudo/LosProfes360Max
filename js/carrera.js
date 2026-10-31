import { ir, estado } from "./router.js";
import { POSICIONES } from "./data/competiciones.js";
import { esc } from "./util.js";
import { ETIQUETAS } from "./atributos.js";
import { textoPartido, sede, temporadaTerminada } from "./fixture.js";
import { completarPartida, rolEstimado, usd } from "./evolucion.js";
import { guardarTodo } from "./firebase.js";

export function pantallaCarrera(el) {
  const p = estado.partida;
  // Completa las partidas viejas a las que les falta algo (atributos, calendario, contrato, etc.).
  if (completarPartida(p)) guardarTodo(estado.user.uid, p).catch(() => {});
  const j = p.jugador, pr = p.progreso, t = p.temp, les = p.lesion;
  const pos = POSICIONES.find(x => x.id === p.posicion)?.nombre || p.posicion;
  const proximos = p.calendario.filter(m => !m.jugado).slice(0, 5);
  const fin = temporadaTerminada(p.calendario);
  const stat = (n, v) => `<div class="stat"><b>${v}</b><span>${n}</span></div>`;
  const nota = t.partidos ? (t.notaSuma / t.partidos).toFixed(1) : "-";
  el.innerHTML = `
    <div class="cabecera">
      <div><h2>${esc(j.nombre)} ${esc(j.apellido)}${j.apodo ? ` “${esc(j.apodo)}”` : ""}</h2>
      <p class="sub">${pos} · ${j.edad} años · ${esc(j.nacionalidad)} · pie ${j.pie.toLowerCase()}</p></div>
      <div class="tags"><span>${esc(p.equipo)}</span><span>Temporada ${p.temporada}</span><span>${rolEstimado(p)}</span>${les ? `<span class="lesion">🩹 ${esc(les.nombre)} · ${les.restantes} partidos</span>` : ""}</div>
    </div>
    <div class="stats">${stat("Valoración", pr.overall)}${stat("Partidos (carrera)", pr.partidos)}${stat("Goles (carrera)", pr.goles)}${stat("Asistencias (carrera)", pr.asistencias)}</div>
    <div class="panel" style="margin-bottom:16px"><h2>Temporada ${p.temporada}</h2>
      <div class="stats" style="margin:12px 0 0">${stat("Partidos", t.partidos)}${stat("Goles", t.goles)}${stat("Asistencias", t.asist)}${stat("Nota media", nota)}</div>
      ${t.copa ? `<p class="sub" style="margin:10px 0 0">Copa Argentina: ${esc(t.copa)}</p>` : ""}</div>
    <div class="panel" style="margin-bottom:16px"><h2>Atributos</h2>
      <div class="attrs">${Object.entries(p.atributos).map(([k, v]) => `<div class="attr"><span>${ETIQUETAS[k]}</span><div class="barra"><i style="width:${v}%"></i></div><b>${v}</b></div>`).join("")}</div>
      <div class="attrs"><div class="attr"><span>Fatiga</span><div class="barra ${p.fatiga > 60 ? "mala" : ""}"><i style="width:${p.fatiga}%"></i></div><b>${p.fatiga}</b></div><div class="attr"><span>Forma</span><div class="barra"><i style="width:${p.forma}%"></i></div><b>${p.forma}</b></div></div>
    </div>
    <div class="panel" style="margin-bottom:16px"><h2>Próximos partidos</h2>
      ${proximos.map(m => `<div class="item"><span>${esc(m.etiqueta)}</span><b>${esc(textoPartido(m, p.equipo))}</b><small class="sub">${esc(m.comp)} · ${sede(m)}</small></div>`).join("") || "<p class='sub'>No quedan partidos en el calendario.</p>"}
      <div class="fila"><button class="btn" id="cal">Calendario completo</button><button class="btn" id="tab">Tabla de posiciones</button></div>
    </div>
    <div class="panel"><h2>Contrato</h2><p class="sub" style="margin:4px 0 0">${usd(p.contrato.salario)} por mes · ${p.contrato.anios} año${p.contrato.anios === 1 ? "" : "s"} restantes · Ahorros ${usd(p.ahorros || 0)}</p></div>
    <div class="fila">${fin ? `<button class="btn main" id="fin">Cerrar temporada</button>` : `<button class="btn main" id="jugar">Jugar próximo partido</button>`}<button class="btn" id="ges">Entrenamiento y contrato</button><button class="btn" id="menu">Menú principal</button></div>`;
  const on = (id, fn) => { const b = el.querySelector(id); if (b) b.onclick = fn; };
  on("#cal", () => ir("calendario")); on("#tab", () => ir("tabla")); on("#ges", () => ir("gestion"));
  on("#jugar", () => ir("partido")); on("#fin", () => ir("fin")); on("#menu", () => ir("menu"));
}