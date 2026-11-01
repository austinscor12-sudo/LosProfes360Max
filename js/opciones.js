import { ir, aviso } from "./router.js";

// Las opciones se guardan en este dispositivo (localStorage), no en la cuenta.
const CLAVE = "modocarrera_opciones";
const DEF = { velocidad: "normal", texto: "normal", anim: "si", barra: "si" };

const CAMPOS = [
  { k: "velocidad", t: "Velocidad de los partidos", d: "Qué tan rápido pasan los minutos", o: [["lenta", "Lenta"], ["normal", "Normal"], ["rapida", "Rápida"]] },
  { k: "texto", t: "Tamaño del texto", d: "Más grande se lee mejor en pantallas chicas", o: [["normal", "Normal"], ["grande", "Grande"]] },
  { k: "anim", t: "Animaciones", d: "La pelota rodando, los efectos y las transiciones", o: [["si", "Sí"], ["no", "No"]] },
  { k: "barra", t: "Botones fijos abajo", d: "Los botones principales siempre a la vista", o: [["si", "Sí"], ["no", "No"]] }
];

function leer() {
  try { return { ...DEF, ...JSON.parse(localStorage.getItem(CLAVE) || "{}") }; } catch { return { ...DEF }; }
}
function guardar(o) {
  try { localStorage.setItem(CLAVE, JSON.stringify(o)); } catch { /* sin almacenamiento: se aplican igual en esta sesión */ }
}

// Se llama al arrancar el juego y cada vez que se cambia una opción.
export function aplicarOpciones(o = leer()) {
  const r = document.documentElement;
  r.classList.toggle("texto-grande", o.texto === "grande");
  r.classList.toggle("sin-anim", o.anim === "no");
  r.classList.toggle("sin-barra", o.barra === "no");
}

// Multiplicador del tiempo entre jugadas del partido en vivo (menor = más rápido).
export const velocidadPartido = () => ({ lenta: 1.7, normal: 1, rapida: .4 })[leer().velocidad] ?? 1;

export function pantallaOpciones(el) {
  let o = leer();
  el.innerHTML = `
    <h2>Opciones</h2><p class="sub">Se guardan en este dispositivo.</p>
    <div class="panel">${CAMPOS.map(c => `
      <div class="item"><div><b>${c.t}</b><br><small class="sub">${c.d}</small></div>
        <div class="tabs" data-k="${c.k}" style="margin:0">${c.o.map(([v, t]) => `<button class="tab" data-v="${v}">${t}</button>`).join("")}</div></div>`).join("")}
    </div>
    <div class="fila"><button class="btn" id="atras">Volver</button><button class="btn" id="reset">Restablecer</button></div>`;
  const marcar = () => el.querySelectorAll(".tabs").forEach(g => g.querySelectorAll(".tab").forEach(b => b.classList.toggle("sel", b.dataset.v === o[g.dataset.k])));
  el.querySelector(".panel").onclick = e => {
    const b = e.target.closest(".tab"); if (!b) return;
    o = { ...o, [b.parentElement.dataset.k]: b.dataset.v };
    guardar(o); aplicarOpciones(o); marcar(); aviso("Guardado");
  };
  el.querySelector("#reset").onclick = () => { o = { ...DEF }; guardar(o); aplicarOpciones(o); marcar(); aviso("Opciones restablecidas"); };
  el.querySelector("#atras").onclick = () => ir("menu");
  marcar();
}

export function pantallaCreditos(el) {
  el.innerHTML = `
    <header class="hero">
      <p class="hero-tag">Créditos</p>
      <h1>Modo <span>Carrera</span></h1>
      <p class="sub">Ficha técnica del juego.</p>
      <div class="rueda" aria-hidden="true"><span class="balon">⚽</span></div>
    </header>
    <div class="panel" style="margin-top:22px">
      <div class="dato"><span>🧢 DT, diseño y programación</span><b>Ezequiel Agustín Medina</b></div>
      <div class="dato"><span>🏟️ Tecnología</span><b>Firebase · Cloudflare Pages</b></div>
      <div class="dato"><span>🛡️ Escudos</span><b>Armados con los colores de cada club</b></div>
      <div class="dato"><span>📣 Hinchada oficial</span><b>Vos, por jugar</b></div>
    </div>
    <div class="panel" style="margin-top:14px">
      <p class="sub" style="margin:0">Modo Carrera es un juego de simulación hecho por un fan. Los clubes, selecciones y ligas se nombran solo como referencia: no es un producto oficial ni está afiliado a ninguna institución. Las fuerzas, los resultados y los jugadores son valores propios, no oficiales.</p>
    </div>
    <div class="fila"><button class="btn" id="atras">Volver</button></div>`;
  el.querySelector("#atras").onclick = () => ir("menu");
}