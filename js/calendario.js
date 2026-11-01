import { ir, estado } from "./router.js";
import { esc } from "./util.js";
import { textoPartido, sede } from "./fixture.js";

// Resultado de un partido ya jugado, con el orden local-visitante que usa la simulación.
function textoJugado(m, equipo) {
  const r = m.resultado;
  if (!r || typeof r !== "object") return esc(String(r || "Jugado"));
  const loc = r.local ?? 0, vis = r.visitante ?? 0;
  const nota = m.statsJugador?.nota;
  const marcador = m.local !== false
    ? `${esc(equipo)} <b>${loc} - ${vis}</b> ${esc(m.rival)}`
    : `${esc(m.rival)} <b>${loc} - ${vis}</b> ${esc(equipo)}`;
  const pen = m.penales ? ` (pen. ${m.penales.mi}-${m.penales.riv})` : "";
  return `${marcador}${pen}${nota != null ? ` · Nota ${nota.toFixed(1)}` : ""}`;
}

export function pantallaCalendario(el) {
  const p = estado.partida, cal = p.calendario || [];
  const comps = [...new Set(cal.map(m => m.comp))];
  const proximo = cal.find(m => m.jugado !== true);
  let sel = comps[0];
  el.innerHTML = `
    <h2>Calendario ${p.temporada}</h2><p class="sub">${esc(p.equipo)} · ${esc(p.ligaNombre)}</p>
    <div class="tabs">${comps.map(c => `<button class="tab" data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div>
    <div class="panel" id="lista"></div>
    <div class="fila"><button class="btn" id="atras">Volver</button></div>`;
  const pintar = () => {
    el.querySelectorAll(".tab").forEach(t => t.classList.toggle("sel", t.dataset.c === sel));
    const NOTAS = {
      "Copa Argentina": "Eliminación directa en cancha neutral. Las próximas rondas se definen según tus resultados.",
      "Copa del Rey": "Eliminación directa entre clubes de todas las categorías. Las rondas iniciales son a partido único en la cancha del equipo de menor categoría; las semifinales son a ida y vuelta y la final es en un estadio neutral. Las próximas rondas se definen según tus resultados.",
      "Supercopa de España": "Se juega en enero con formato Final Four (semifinales y final en cancha neutral). Clasifican el campeón y el subcampeón de LaLiga y de la Copa del Rey de la temporada anterior."
    };
    const nota = NOTAS[sel] ? `<p class="sub">${NOTAS[sel]}</p>` : "";
    el.querySelector("#lista").innerHTML = nota + cal.filter(m => m.comp === sel).map(m => m.jugado === true ? `
      <div class="item"><span>${esc(m.etiqueta)}</span><div>${textoJugado(m, p.equipo)}</div></div>` : `
      <div class="item"><span>${esc(m.etiqueta)}</span><b>${esc(textoPartido(m, p.equipo))}</b>
      <small class="sub">${sede(m)}${m === proximo ? " · Próximo" : ""}</small></div>`).join("");
  };
  el.querySelector(".tabs").onclick = e => { const t = e.target.closest(".tab"); if (!t) return; sel = t.dataset.c; pintar(); };
  el.querySelector("#atras").onclick = () => ir("carrera");
  pintar();
}