import { ir, estado } from "./router.js";
import { salir, listarPartidas } from "./firebase.js";
import { esc } from "./util.js";

const opcion = (a, ico, titulo, desc, extra = "", attrs = "") =>
  `<button class="btn opt ${extra}" data-a="${a}" ${attrs}><span class="m-ico" aria-hidden="true">${ico}</span><span class="m-txt"><b>${titulo}</b><small>${desc}</small></span></button>`;

export function pantallaMenu(el) {
  el.innerHTML = `
    <header class="hero">
      <p class="hero-tag">Simulador de carrera</p>
      <h1>Modo <span>Carrera</span></h1>
      <p class="sub">Hola, ${esc(estado.user.displayName || estado.user.email)}.</p>
      <div class="rueda" aria-hidden="true"><span class="balon">⚽</span></div>
    </header>
    <nav class="menu">
      ${opcion("cont", "🎽", "Continuar", "", "", "hidden")}
      ${opcion("nueva", "⚽", "Nueva temporada", "Creá tu jugador y empezá tu historia", "main")}
      ${opcion("cargar", "📂", "Cargar partida", "Retomá una carrera guardada")}
      ${opcion("op", "⚙️", "Opciones", "Velocidad, texto y más")}
      ${opcion("cred", "🏆", "Créditos", "Quién armó todo esto")}
      ${opcion("salir", "🚪", "Cerrar sesión", "Hasta la próxima, crack", "sale")}
    </nav>`;
  let ultima = null;
  listarPartidas(estado.user.uid).then(l => {
    if (!l.length || !el.isConnected) return;
    ultima = l[0];
    const b = el.querySelector('[data-a="cont"]');
    b.querySelector(".m-txt b").textContent = "Continuar";
    b.querySelector(".m-txt small").textContent = `${ultima.jugador.nombre} ${ultima.jugador.apellido} · ${ultima.equipo}`;
    b.hidden = false; b.classList.add("main");
    el.querySelector('[data-a="nueva"]').classList.remove("main");
  }).catch(() => {});
  el.querySelector(".menu").onclick = e => {
    const a = e.target.closest("[data-a]")?.dataset.a;
    if (a === "cont" && ultima) { estado.partida = ultima; ir("carrera"); }
    else if (a === "nueva") { estado.nuevo = {}; ir("jugador"); }
    else if (a === "cargar") ir("cargar");
    else if (a === "salir") { if (confirm("¿Cerrar sesión?")) salir(); }
    else if (a === "op") ir("opciones");
    else if (a === "cred") ir("creditos");
  };
}