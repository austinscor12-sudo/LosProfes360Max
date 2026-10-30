import { ir, estado } from "./router.js";
import { esc } from "./util.js";
import { textoPartido, sede } from "./fixture.js";

export function pantallaCalendario(el) {
  const p = estado.partida, cal = p.calendario || [];
  const comps = [...new Set(cal.map(m => m.comp))];
  const proximo = cal.find(m => !m.jugado);
  let sel = comps[0];
  el.innerHTML = `
    <h2>Calendario ${p.temporada}</h2><p class="sub">${esc(p.equipo)} · ${esc(p.ligaNombre)}</p>
    <div class="tabs">${comps.map(c => `<button class="tab" data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div>
    <div class="panel" id="lista"></div>
    <div class="fila"><button class="btn" id="atras">Volver</button></div>`;
  const pintar = () => {
    el.querySelectorAll(".tab").forEach(t => t.classList.toggle("sel", t.dataset.c === sel));
    const nota = sel === "Copa Argentina" ? `<p class="sub">Eliminación directa en cancha neutral. Las próximas rondas se definen según tus resultados.</p>` : "";
    el.querySelector("#lista").innerHTML = nota + cal.filter(m => m.comp === sel).map(m => `
      <div class="item"><span>${esc(m.etiqueta)}</span><b>${esc(textoPartido(m, p.equipo))}</b>
      <small class="sub">${m.jugado ? esc(m.resultado || "Jugado") : sede(m)}${m === proximo ? " · Próximo" : ""}</small></div>`).join("");
  };
  el.querySelector(".tabs").onclick = e => { const t = e.target.closest(".tab"); if (!t) return; sel = t.dataset.c; pintar(); };
  el.querySelector("#atras").onclick = () => ir("carrera");
  pintar();
}