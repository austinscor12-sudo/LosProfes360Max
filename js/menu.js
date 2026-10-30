import { ir, estado, aviso } from "./router.js";
import { salir } from "./firebase.js";

export function pantallaMenu(el) {
  el.innerHTML = `
    <h1>Modo Carrera</h1><p class="sub">Hola, ${estado.user.displayName || estado.user.email}.</p>
    <nav class="menu">
      <button class="btn main" data-a="nueva">Nueva temporada</button>
      <button class="btn" data-a="cargar">Cargar partida</button>
      <button class="btn" data-a="op">Opciones</button>
      <button class="btn" data-a="cred">Créditos</button>
      <button class="btn" data-a="salir">Cerrar sesión</button>
    </nav>`;
  el.querySelector(".menu").onclick = e => {
    const a = e.target.dataset.a;
    if (a === "nueva") { estado.nuevo = {}; ir("jugador"); }
    else if (a === "cargar") ir("cargar");
    else if (a === "salir") salir();
    else if (a) aviso("Próximamente");
  };
}
