import { ir, estado, aviso } from "./router.js";
import { LIGAS } from "./data/equipos.js";
import { POSICIONES } from "./data/competiciones.js";
import { esc } from "./util.js";

export function pantallaCarrera(el) {
  const p = estado.partida, j = p.jugador, pr = p.progreso;
  const pos = POSICIONES.find(x => x.id === p.posicion)?.nombre || p.posicion;
  const rivales = LIGAS.find(l => l.id === p.liga).equipos.filter(n => n !== p.equipo);
  const inicio = [...p.equipo].reduce((a, c) => a + c.charCodeAt(0), 0);
  const fixture = [0, 1, 2, 3, 4].map(i => ({ fecha: i + 1, rival: rivales[(inicio + i * 7) % rivales.length], local: i % 2 === 0 }));
  const stat = (n, v) => `<div class="stat"><b>${v}</b><span>${n}</span></div>`;
  el.innerHTML = `
    <div class="cabecera">
      <div><h2>${esc(j.nombre)} ${esc(j.apellido)}${j.apodo ? ` “${esc(j.apodo)}”` : ""}</h2>
      <p class="sub">${pos} · ${j.edad} años · ${esc(j.nacionalidad)} · pie ${j.pie.toLowerCase()}</p></div>
      <div class="tags"><span>${esc(p.equipo)}</span><span>Temporada ${p.temporada}</span></div>
    </div>
    <div class="stats">${stat("Valoración", pr.overall)}${stat("Partidos", pr.partidos)}${stat("Goles", pr.goles)}${stat("Asistencias", pr.asistencias)}</div>
    <div class="panel" style="margin-bottom:16px"><h2>Próximos partidos</h2>
      <p class="sub">Torneo Apertura (fixture provisional)</p>
      ${fixture.map(f => `<div class="item"><span>Fecha ${f.fecha}</span><b>${f.local ? `${esc(p.equipo)} vs ${esc(f.rival)}` : `${esc(f.rival)} vs ${esc(p.equipo)}`}</b><small class="sub">${f.local ? "Local" : "Visitante"}</small></div>`).join("")}
    </div>
    <div class="panel"><h2>Competiciones</h2><div class="tags">${p.competiciones.map(c => `<span>${esc(c)}</span>`).join("")}</div></div>
    <div class="fila"><button class="btn main" id="jugar">Jugar próximo partido</button><button class="btn" id="menu">Menú principal</button></div>`;
  el.querySelector("#jugar").onclick = () => aviso("La simulación de partidos viene en el próximo paso");
  el.querySelector("#menu").onclick = () => ir("menu");
}
