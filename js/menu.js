import { ir, estado, aviso } from "./router.js";
import { salir, listarPartidas } from "./firebase.js";
import { esc } from "./util.js";
import { opcionesAudio, setAudio, sonar } from "./audio.js";

// ---- Opciones de accesibilidad (se guardan en el navegador) ----
const CLASES = { grande: "texto-grande", anim: "sin-anim", barra: "sin-barra" };
const leer = () => { try { return JSON.parse(localStorage.getItem("opciones") || "{}"); } catch { return {}; } };
export function aplicarOpciones() {
  const o = leer();
  for (const [k, c] of Object.entries(CLASES)) document.documentElement.classList.toggle(c, !!o[k]);
}
const guardarOpcion = (k, v) => { try { localStorage.setItem("opciones", JSON.stringify({ ...leer(), [k]: v })); } catch {} aplicarOpciones(); };

const ITEMS = [
  { a: "nueva", ico: "⚽", t: "Nueva carrera", s: "Creá a tu jugador y debutá" },
  { a: "cargar", ico: "💾", t: "Cargar partida", s: "Tus carreras guardadas en la nube" },
  { a: "op", ico: "⚙️", t: "Opciones", s: "Texto grande y animaciones" },
  { a: "cred", ico: "🏆", t: "Créditos", s: "Quién hizo el juego" },
  { a: "salir", ico: "🚪", t: "Cerrar sesión", s: "", cls: "sale" }
];
const optHtml = i => `<button class="btn opt ${i.cls || ""}" data-a="${i.a}"><span class="m-ico">${i.ico}</span><span class="m-txt"><b>${i.t}</b>${i.s ? `<small>${i.s}</small>` : ""}</span></button>`;

// ---- Opciones de accesibilidad (se guardan en el navegador) ----
const CLASES = { grande: "texto-grande", anim: "sin-anim", barra: "sin-barra" };
const leer = () => { try { return JSON.parse(localStorage.getItem("opciones") || "{}"); } catch { return {}; } };
export function aplicarOpciones() {
  const o = leer();
  for (const [k, c] of Object.entries(CLASES)) document.documentElement.classList.toggle(c, !!o[k]);
}
const guardarOpcion = (k, v) => { try { localStorage.setItem("opciones", JSON.stringify({ ...leer(), [k]: v })); } catch {} aplicarOpciones(); };

const ITEMS = [
  { a: "nueva", ico: "⚽", t: "Nueva carrera", s: "Creá a tu jugador y debutá" },
  { a: "cargar", ico: "💾", t: "Cargar partida", s: "Tus carreras guardadas en la nube" },
  { a: "op", ico: "⚙️", t: "Opciones", s: "Texto grande y animaciones" },
  { a: "cred", ico: "🏆", t: "Créditos", s: "Quién hizo el juego" },
  { a: "salir", ico: "🚪", t: "Cerrar sesión", s: "", cls: "sale" }
];
const optHtml = i => `<button class="btn opt ${i.cls || ""}" data-a="${i.a}"><span class="m-ico">${i.ico}</span><span class="m-txt"><b>${i.t}</b>${i.s ? `<small>${i.s}</small>` : ""}</span></button>`;

export function pantallaMenu(el) {
  el.innerHTML = `
    <header class="hero">
      <span class="hero-tag">Modo Carrera</span>
      <h1>Del potrero <span>a la gloria</span></h1>
      <p class="sub">Hola, ${esc(estado.user.displayName || estado.user.email)}. Tu carrera empieza a los 18 y puede llegar hasta los 40.</p>
      <div class="rueda" aria-hidden="true"><span class="balon">⚽</span></div>
    </header>
    <nav class="menu">
      <button class="btn opt main" data-a="cont" hidden><span class="m-ico">▶️</span><span class="m-txt"><b>Continuar</b><small></small></span></button>
      ${ITEMS.map(optHtml).join("")}
    </nav>`;
  let ultima = null;
  listarPartidas(estado.user.uid).then(l => {
    if (!l.length || !el.isConnected) return;
    ultima = l[0];
    const b = el.querySelector('[data-a="cont"]');
    b.querySelector("b").textContent = `${ultima.jugador.nombre} ${ultima.jugador.apellido}`;
    b.querySelector("small").textContent = `${ultima.equipo} · temporada ${ultima.temporada ?? ""}`.trim();
    b.hidden = false;
    el.querySelector('[data-a="nueva"]').classList.add("sec");
  }).catch(() => {});
  el.querySelector(".menu").onclick = e => {
    const a = e.target.closest("[data-a]")?.dataset.a;
    if (a === "cont" && ultima) { estado.partida = ultima; ir("carrera"); }
    else if (a === "nueva") { estado.nuevo = {}; ir("jugador"); }
    else if (a === "cargar") ir("cargar");
    else if (a === "op") opciones(el);
    else if (a === "cred") creditos(el);
    else if (a === "salir") { if (confirm("¿Cerrar sesión?")) salir(); }
  };
}

function opciones(el) {
  const o = leer(), au = opcionesAudio();
  const fila = (k, t, s, on, attr = "data-k") => `<label class="interruptor"><input type="checkbox" ${attr}="${k}" ${on ? "checked" : ""}><span><b>${t}</b><small>${s}</small></span></label>`;
  el.innerHTML = `<h2>Opciones</h2><p class="sub">Se guardan en este dispositivo.</p>
    <div class="panel opciones"><h2>Sonido</h2>
      ${fila("musica", "Música de fondo", "Los temas de la carpeta musica.", au.musica, "data-au")}
      ${fila("efectos", "Efectos de sonido", "Toques, goles y avisos.", au.efectos, "data-au")}
      <label class="volumen"><b>Volumen</b><input type="range" id="vol" min="0" max="100" value="${Math.round(au.vol * 100)}"></label>
    </div>
    <div class="panel opciones"><h2>Pantalla</h2>
      ${fila("grande", "Texto grande", "Agranda las letras de todo el juego.", o.grande)}
      ${fila("anim", "Sin animaciones", "Quita fondos animados, barras que se llenan y números que suben.", o.anim)}
      ${fila("barra", "Botones sin fijar abajo", "Los botones dejan de quedarse pegados al borde inferior.", o.barra)}
    </div>
    <div class="fila"><button class="btn main" id="volver">Volver al menú</button></div>`;
  el.querySelectorAll("input[data-k]").forEach(i => i.onchange = () => { guardarOpcion(i.dataset.k, i.checked); aviso("Guardado"); });
  el.querySelectorAll("input[data-au]").forEach(i => i.onchange = () => setAudio({ [i.dataset.au]: i.checked }));
  el.querySelector("#vol").oninput = e => setAudio({ vol: e.target.value / 100 });
  el.querySelector("#vol").onchange = () => sonar("ok");
  el.querySelector("#volver").onclick = () => ir("menu");
}

function creditos(el) {
  el.innerHTML = `<h2>Créditos</h2>
    <div class="panel"><p><b>Modo Carrera</b> — un juego de carrera de futbolista hecho por Ezequiel Medina.</p>
    <p class="sub" style="margin-top:10px">Los niveles de equipos y jugadores son estimaciones propias, no datos oficiales.</p></div>
    <div class="fila"><button class="btn main" id="volver">Volver al menú</button></div>`;
  el.querySelector("#volver").onclick = () => ir("menu");
}
