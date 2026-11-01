import { ir, estado } from "./router.js";
import { esc } from "./util.js";
import { calcularTabla, torneoActual } from "./liga.js";
import { tablaOrdenada } from "./simulacion.js";
import { ZONAS, zonaDe } from "./espana.js";

// Abre la tabla que corresponda: la real de la Liga Profesional (zonas) o la simple de las demás ligas.
export function abrirTabla(p) { if (p.fixture) mostrarTabla(p); else ir("tabla"); }

// Tabla de posiciones real: zona A, zona B o tabla anual (Apertura + Clausura).
export function mostrarTabla(p) {
  const miIdx = p.equiposLiga.indexOf(p.equipo);
  let torneo = torneoActual(p), vista = p.zona;

  const modal = document.createElement("div");
  modal.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,.95);color:#fff;z-index:9999;padding:20px;overflow-y:auto;box-sizing:border-box;font-family:sans-serif;";
  document.body.appendChild(modal);

  const chip = (attr, val, texto, activo) =>
    `<button class="tab ${activo ? "sel" : ""}" data-${attr}="${val}">${texto}</button>`;

  const pintar = () => {
    const anual = vista === "ANUAL";
    const base = vista === "B" ? 15 : 0;
    const idxs = anual ? Array.from({ length: 30 }, (_, k) => k) : Array.from({ length: 15 }, (_, k) => base + k);
    const filas = calcularTabla(p, anual ? ["AP", "CL"] : [torneo], idxs);
    const cuerpo = filas.map((f, k) => {
      const yo = f.i === miIdx;
      const fondo = yo ? "background:#3b82f6;font-weight:bold;" : (k % 2 ? "background:#1a1a1a;" : "background:#222;");
      const corte = !anual && k === 7 ? "border-bottom:2px dashed #f2c14e;" : "";
      const dif = f.gf - f.gc;
      return `<tr style="${fondo}${corte}text-align:center;">
        <td style="padding:8px;">${k + 1}</td><td style="text-align:left;padding:8px;">${esc(f.nombre)}</td>
        <td><b>${f.pts}</b></td><td>${f.pj}</td><td>${f.pg}</td><td>${f.pe}</td><td>${f.pp}</td><td>${f.gf}</td><td>${f.gc}</td><td>${dif > 0 ? "+" : ""}${dif}</td></tr>`;
    }).join("");
    const nota = anual
      ? "Suma de las fases regulares del Apertura y el Clausura. El 1.º es el Campeón de Liga; el último desciende (el otro descenso sale de los promedios, que todavía no están)."
      : "Los 8 primeros de cada zona clasifican a los playoffs (los playoffs llegan en el próximo paso). Los interzonales cuentan para la tabla de cada zona.";
    modal.innerHTML = `
      <div style="background:#111;padding:20px;border-radius:12px;max-width:680px;width:100%;margin:auto;border:1px solid #444;">
        <h2 style="text-align:center;margin-top:0;">Tabla de posiciones</h2>
        <div class="tabs" style="justify-content:center;flex-wrap:wrap;">${chip("v", "A", "Zona A", vista === "A")}${chip("v", "B", "Zona B", vista === "B")}${chip("v", "ANUAL", "Anual", anual)}</div>
        ${anual ? "" : `<div class="tabs" style="justify-content:center;">${chip("t", "AP", "Apertura", torneo === "AP")}${chip("t", "CL", "Clausura", torneo === "CL")}</div>`}
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <thead style="background:#333;color:#aaa;"><tr><th style="padding:10px;">Pos</th><th style="text-align:left;padding:10px;">Equipo</th><th>Pts</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>DIF</th></tr></thead>
            <tbody>${cuerpo}</tbody>
          </table>
        </div>
        <p style="font-size:12px;opacity:.7;margin-top:12px;">${nota}</p>
        <button data-cerrar style="width:100%;padding:12px;margin-top:12px;background:#f87171;color:#000;font-weight:bold;border:none;border-radius:8px;cursor:pointer;">Cerrar tabla</button>
      </div>`;
  };

  modal.onclick = e => {
    if (e.target.closest("[data-cerrar]")) return modal.remove();
    const v = e.target.closest("[data-v]"), t = e.target.closest("[data-t]");
    if (v) { vista = v.dataset.v; pintar(); }
    else if (t) { torneo = t.dataset.t; pintar(); }
  };
  pintar();
}

// Tabla simple para Primera Nacional (o un club recién ascendido) que no tiene el fixture de zonas.
export function pantallaTabla(el) {
  const p = estado.partida, comps = Object.keys(p.tablas || {});
  let sel = comps.find(c => c === estado.tabTabla) || comps[comps.length - 1];
  el.innerHTML = `<h2>Tabla de posiciones</h2><p class="sub">${esc(p.equipo)} · Temporada ${p.temporada}</p>
    ${comps.length ? `<div class="tabs">${comps.map(c => `<button class="tab" data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div><div class="panel" id="t" style="overflow-x:auto"></div>` : `<div class="panel"><p class="sub">Todavía no se jugó ninguna fecha.</p></div>`}
    <div class="fila"><button class="btn" id="atras">Volver</button></div>`;
  const pintar = () => {
    el.querySelectorAll(".tab").forEach(t => t.classList.toggle("sel", t.dataset.c === sel));
    el.querySelector("#t").innerHTML = `<table class="tabla"><tr><th>#</th><th>Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>DG</th><th>Pts</th></tr>
      ${tablaOrdenada(p.tablas[sel]).map((x, i) => `<tr class="${x.equipo === p.equipo ? "mi" : ""}"><td${zonaDe(sel, i + 1) ? ` style="box-shadow:inset 4px 0 0 ${zonaDe(sel, i + 1)[2]}"` : ""}>${i + 1}</td><td>${esc(x.equipo)}</td><td>${x.pj}</td><td>${x.g}</td><td>${x.e}</td><td>${x.p}</td><td>${x.gf - x.gc}</td><td><b>${x.pts}</b></td></tr>`).join("")}</table>
      ${ZONAS[sel] ? `<div style="margin-top:12px;font-size:13px">${ZONAS[sel].z.map(([a, b, c, t]) => `<p style="margin:3px 0"><span style="display:inline-block;width:10px;height:10px;background:${c};margin-right:6px"></span>${a === b ? a + ".º" : a + ".º al " + b + ".º"}: ${t}</p>`).join("")}${ZONAS[sel].nota ? `<p class="sub" style="margin-top:8px">${ZONAS[sel].nota}</p>` : ""}</div>` : ""}`;
  };
  if (comps.length) { el.querySelector(".tabs").onclick = e => { const t = e.target.closest(".tab"); if (!t) return; sel = estado.tabTabla = t.dataset.c; pintar(); }; pintar(); }
  el.querySelector("#atras").onclick = () => ir("carrera");
}