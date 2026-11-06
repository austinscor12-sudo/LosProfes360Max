import { ir, estado, aviso } from "./router.js";
import { salir, listarPartidas } from "./firebase.js";
import { esc } from "./util.js";

const OPC = [
  ["nueva", "⚽", "Nueva temporada", "Creá un jugador y empezá desde cero", "main"],
  ["cargar", "📂", "Cargar partida", "Seguí con una carrera guardada", ""],
  ["op", "⚙️", "Opciones", "Ajustes del juego", ""],
  ["cred", "🏆", "Créditos", "Quién hizo este juego", ""],
  ["salir", "🚪", "Cerrar sesión", "Tu progreso queda guardado en la nube", "sale"]
];
const boton = ([a, i, t, s, c]) => `<button class="btn opt ${c}" data-a="${a}"><span class="m-ico">${i}</span><span class="m-txt"><b>${t}</b><small>${s}</small></span></button>`;

export function pantallaMenu(el) {
  el.innerHTML = `
    <header class="hero"><h1>Modo <span>Carrera</span></h1>
      <p class="sub">Hola, ${esc(estado.user.displayName || estado.user.email)}. Del barrio a la Selección: cada partido cuenta.</p>
      <div class="rueda"><span class="balon">⚽</span></div></header>
    <nav class="menu"><button class="btn opt" data-a="cont" hidden><span class="m-ico">▶</span><span class="m-txt"><b></b><small></small></span></button>${OPC.map(boton).join("")}</nav>`;
  let ultima = null;
  listarPartidas(estado.user.uid).then(l => {
    if (!l.length || !el.isConnected) return;
    ultima = l[0];
    const b = el.querySelector('[data-a="cont"]');
    b.querySelector("b").textContent = `Continuar: ${ultima.jugador.nombre} ${ultima.jugador.apellido}`;
    b.querySelector("small").textContent = `${ultima.equipo} · Temporada ${ultima.temporada} · ${ultima.progreso.partidos} partidos`;
    b.hidden = false; b.classList.add("main");
    el.querySelector('[data-a="nueva"]').classList.remove("main");
  }).catch(() => {});
  el.querySelector(".menu").onclick = e => {
    const a = e.target.closest("[data-a]")?.dataset.a;
    if (a === "cont" && ultima) { estado.partida = ultima; ir("carrera"); }
    else if (a === "nueva") { estado.nuevo = {}; ir("jugador"); }
    else if (a === "cargar") ir("cargar");
    else if (a === "salir") { if (confirm("¿Cerrar sesión?")) salir(); }
    else if (a) aviso("Próximamente");
  };
}
