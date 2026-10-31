import { ir, estado } from "./router.js";
import { esc } from "./util.js";
import { tablaOrdenada } from "./simulacion.js";

export function pantallaTabla(el) {
  const p = estado.partida, comps = Object.keys(p.tablas || {});
  let sel = comps.find(c => c === estado.tabTabla) || comps[comps.length - 1];
  el.innerHTML = `<h2>Tabla de posiciones</h2><p class="sub">${esc(p.equipo)} · Temporada ${p.temporada}</p>
    ${comps.length ? `<div class="tabs">${comps.map(c => `<button class="tab" data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div><div class="panel" id="t" style="overflow-x:auto"></div>` : `<div class="panel"><p class="sub">Todavía no se jugó ninguna fecha.</p></div>`}
    <div class="fila"><button class="btn" id="atras">Volver</button></div>`;
  const pintar = () => {
    el.querySelectorAll(".tab").forEach(t => t.classList.toggle("sel", t.dataset.c === sel));
    el.querySelector("#t").innerHTML = `<table class="tabla"><tr><th>#</th><th>Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>DG</th><th>Pts</th></tr>
      ${tablaOrdenada(p.tablas[sel]).map((x, i) => `<tr class="${x.equipo === p.equipo ? "mi" : ""}"><td>${i + 1}</td><td>${esc(x.equipo)}</td><td>${x.pj}</td><td>${x.g}</td><td>${x.e}</td><td>${x.p}</td><td>${x.gf - x.gc}</td><td><b>${x.pts}</b></td></tr>`).join("")}</table>`;
  };
  if (comps.length) { el.querySelector(".tabs").onclick = e => { const t = e.target.closest(".tab"); if (!t) return; sel = estado.tabTabla = t.dataset.c; pintar(); }; pintar(); }
  el.querySelector("#atras").onclick = () => ir("carrera");
}