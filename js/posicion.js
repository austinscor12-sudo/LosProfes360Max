import { ir, estado } from "./router.js";
import { POSICIONES } from "./data/competiciones.js";

export function pantallaPosicion(el) {
  const actual = estado.nuevo.posicion;
  el.innerHTML = `
    <h2>Elegí tu posición</h2><p class="sub">Define cómo evoluciona tu jugador.</p>
    <div class="grid">${POSICIONES.map(p => `<button class="card ${actual === p.id ? "sel" : ""}" data-id="${p.id}"><b>${p.nombre}</b><small>${p.desc}</small></button>`).join("")}</div>
    <div class="fila"><button class="btn" id="atras">Volver</button><button class="btn main" id="sig" ${actual ? "" : "disabled"}>Continuar</button></div>`;
  el.querySelector(".grid").onclick = e => {
    const c = e.target.closest(".card"); if (!c) return;
    estado.nuevo.posicion = c.dataset.id;
    el.querySelectorAll(".card").forEach(x => x.classList.toggle("sel", x === c));
    el.querySelector("#sig").disabled = false;
  };
  el.querySelector("#atras").onclick = () => ir("jugador");
  el.querySelector("#sig").onclick = () => ir("equipo");
}
