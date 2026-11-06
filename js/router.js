import { sonar } from "./audio.js";
export const estado = { user: null, nuevo: {} };
export const rutas = {};
export function ir(nombre) {
  const app = document.getElementById("app");
  app.innerHTML = "";
  rutas[nombre](app);
  window.scrollTo(0, 0);
  animar(app);
}
export function aviso(txt) {
  const t = document.getElementById("toast");
  t.textContent = txt; t.classList.add("on"); sonar(/error|no se pudo|no hay/i.test(txt) ? "error" : "ok");
  setTimeout(() => t.classList.remove("on"), 2400);
}

// Una sola animación de entrada: las barras se llenan y los números suben hasta su valor.
function animar(app) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("sin-anim")) return;
  app.querySelectorAll(".barra i").forEach(i => { const w = i.style.width; i.style.width = "0"; requestAnimationFrame(() => requestAnimationFrame(() => { i.style.width = w; })); });
  app.querySelectorAll(".stat b,.fig-ovr,.fig-a b").forEach(b => {
    const t = b.textContent.trim(); if (!/^\d+$/.test(t)) return;
    const n = +t, t0 = performance.now();
    (function f(now) { const k = Math.min(1, (now - t0) / 800); b.textContent = Math.round(n * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(t0);
  });
}
