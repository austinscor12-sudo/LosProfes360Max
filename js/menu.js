import { ir, estado, aviso } from "./router.js";
import { salir, listarPartidas } from "./firebase.js";
import { esc } from "./util.js";

export function pantallaMenu(el) {
  el.innerHTML = `
    <h1>Modo Carrera</h1><p class="sub">Hola, ${esc(estado.user.displayName || estado.user.email)}.</p>
    <nav class="menu">
      <button class="btn" data-a="cont" hidden></button>
      <button class="btn main" data-a="nueva">Nueva temporada</button>
      <button class="btn" data-a="cargar">Cargar partida</button>
      <button class="btn" data-a="op">Opciones</button>
      <button class="btn" data-a="cred">Créditos</button>
      <button class="btn" data-a="salir">Cerrar sesión</button>
    </nav>`;
  let ultima = null;
  listarPartidas(estado.user.uid).then(l => {
    if (!l.length || !el.isConnected) return;
    ultima = l[0];
    const b = el.querySelector('[data-a="cont"]');
    b.textContent = `Continuar: ${ultima.jugador.nombre} ${ultima.jugador.apellido} (${ultima.equipo})`;
    b.hidden = false; b.classList.add("main");
    el.querySelector('[data-a="nueva"]').classList.remove("main");
  }).catch(() => {});
  el.querySelector(".menu").onclick = e => {
    const a = e.target.dataset.a;
    if (a === "cont" && ultima) { estado.partida = ultima; ir("carrera"); }
    else if (a === "nueva") { estado.nuevo = {}; ir("jugador"); }
    else if (a === "cargar") ir("cargar");
    else if (a === "salir") { if (confirm("¿Cerrar sesión?")) salir(); }
    else if (a) aviso("Próximamente");
  };
}
