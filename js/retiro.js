// Resumen de la carrera cuando el jugador se retira.
import { ir, estado } from "./router.js";
import { esc } from "./util.js";
import { POSICIONES } from "./data/competiciones.js";
import { usd } from "./evolucion.js";
import { esArgentino, asegurar } from "./seleccion.js";

const dato = (l, v) => `<div class="dato"><span>${l}</span><b>${v}</b></div>`;

export function pantallaRetiro(el) {
  const p = estado.partida, j = p.jugador, r = p.retirado || {}, pr = p.progreso;
  const pos = POSICIONES.find(x => x.id === p.posicion)?.nombre || p.posicion;
  const hist = p.historial || [];
  const desde = hist.length ? hist[0].temporada : p.temporada;
  const clubes = [...new Set(hist.map(h => h.equipo))];
  const titulos = p.palmares || [];
  const mejor = hist.reduce((m, h) => (h.goles + h.asist > (m ? m.goles + m.asist : -1) ? h : m), null);
  const pico = Math.max(p.pico || 0, pr.overall);

  el.innerHTML = `
    <h1>Retiro</h1>
    <p class="sub">${esc(j.nombre)} ${esc(j.apellido)}${j.apodo ? ` “${esc(j.apodo)}”` : ""} · ${pos} · ${esc(j.nacionalidad)}</p>
    <div class="panel" style="margin-bottom:16px"><p>${r.motivo === "voluntario" ? "Decidiste retirarte" : "Colgaste los botines"} a los ${r.edad} años, después de la temporada ${r.temporada}, jugando en ${esc(r.equipo)}.</p></div>
    <div class="stats">
      <div class="stat"><b>${hist.length}</b><span>Temporadas</span></div><div class="stat"><b>${pr.partidos}</b><span>Partidos</span></div>
      <div class="stat"><b>${pr.goles}</b><span>Goles</span></div><div class="stat"><b>${pr.asistencias}</b><span>Asistencias</span></div>
    </div>
    <div class="panel" style="margin-bottom:16px"><h2>Carrera</h2>
      ${dato("Años de carrera", `${desde} – ${r.temporada}`)}${dato("Mejor valoración", pico)}
      ${dato("Clubes", clubes.length ? clubes.map(esc).join(" · ") : esc(r.equipo))}
      ${dato("Transferencias", (p.traspasos || []).length)}${dato("Ahorros", usd(p.ahorros || 0))}
      ${mejor ? dato("Mejor temporada", `${mejor.temporada} (${mejor.goles} goles, ${mejor.asist} asist.)`) : ""}</div>
    ${esArgentino(p) && asegurar(p).convocatorias ? `<div class="panel" style="margin-bottom:16px"><h2>🇦🇷 Selección Argentina</h2>${dato("Partidos", asegurar(p).partidos)}${dato("Goles", asegurar(p).goles)}${dato("Asistencias", asegurar(p).asist)}${dato("Títulos", asegurar(p).titulos)}${asegurar(p).debut ? dato("Debut", `${asegurar(p).debut.temporada} vs ${esc(asegurar(p).debut.rival)}`) : ""}</div>` : ""}
    <div class="panel" style="margin-bottom:16px"><h2>Palmarés</h2>${titulos.length ? titulos.map(x => `<div class="item"><b>🏆 ${esc(x.titulo)}</b><span>${x.temporada}</span></div>`).join("") : `<p class="sub">No ganaste títulos.</p>`}</div>
    <div class="panel"><h2>Temporadas</h2>${hist.map(h => `<div class="item"><b>${h.temporada} · ${esc(h.equipo)}</b><small class="sub">${h.partidos} PJ · ${h.goles} goles · ${h.asist} asist. · nota ${h.nota}</small></div>`).join("")}</div>
    <div class="fila"><button class="btn main" id="menu">Volver al menú</button></div>`;
  el.querySelector("#menu").onclick = () => ir("menu");
}