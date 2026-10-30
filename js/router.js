export const estado = { user: null, nuevo: {} };
export const rutas = {};
export function ir(nombre) {
  const app = document.getElementById("app");
  app.innerHTML = "";
  rutas[nombre](app);
  window.scrollTo(0, 0);
}
export function aviso(txt) {
  const t = document.getElementById("toast");
  t.textContent = txt; t.classList.add("on");
  setTimeout(() => t.classList.remove("on"), 2400);
}
