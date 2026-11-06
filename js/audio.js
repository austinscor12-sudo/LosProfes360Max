// Música de fondo, sonidos y fondo animado.
// Música: poné tus .mp3 en la carpeta musica/ y escribí sus nombres en musica/lista.json.
// Sonidos: poné archivos en sonidos/ y asignalos en sonidos/lista.json (click, ok, gol, golR, pito, error).
// Fondos: poné imágenes en img/fondos/ y escribí sus nombres en img/fondos/lista.json.
// Si no hay archivos, los sonidos se generan solos y el fondo animado usa luces y césped.
const CLAVE = "audioOpc";
const def = { musica: true, efectos: true, vol: .5 };
const leer = () => { try { return { ...def, ...JSON.parse(localStorage.getItem(CLAVE) || "{}") }; } catch { return { ...def }; } };
let o = leer(), ctx = null, lista = [], pista = null, idx = 0, archivos = {}, arrancó = false;
export const opcionesAudio = () => ({ ...o });

const ac = () => ctx || (ctx = new (window.AudioContext || window.webkitAudioContext)());
function tono(seq, tipo, vol) {
  try {
    const a = ac(); if (a.state === "suspended") a.resume();
    let t = a.currentTime;
    seq.forEach(([f, d]) => {
      const os = a.createOscillator(), g = a.createGain();
      os.type = tipo; os.frequency.value = f;
      g.gain.setValueAtTime(Math.max(.0002, vol * o.vol * 2), t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      os.connect(g); g.connect(a.destination); os.start(t); os.stop(t + d); t += d * .9;
    });
  } catch {}
}
const SINT = {
  click: () => tono([[820, .035], [560, .05]], "square", .035),
  ok: () => tono([[523, .07], [784, .12]], "triangle", .09),
  error: () => tono([[220, .12], [170, .16]], "sawtooth", .05),
  gol: () => tono([[523, .09], [659, .09], [784, .09], [1047, .32]], "sawtooth", .06),
  golR: () => tono([[330, .14], [262, .14], [196, .3]], "triangle", .08),
  pito: () => tono([[2600, .12], [2900, .3]], "sine", .1)
};
export function sonar(nombre) {
  if (!o.efectos) return;
  const f = archivos[nombre];
  if (f) { const a = f.cloneNode(); a.volume = Math.min(1, o.vol); a.play().catch(() => SINT[nombre]?.()); return; }
  SINT[nombre]?.();
}

async function json(url) { try { const r = await fetch(url, { cache: "no-cache" }); return r.ok ? JSON.parse(await r.text()) : null; } catch { return null; } }

function siguiente() {
  if (!lista.length) return;
  pista?.pause(); pista = new Audio("musica/" + lista[idx++ % lista.length]);
  pista.volume = o.vol * .6; pista.onended = siguiente; pista.onerror = () => { lista.splice((idx - 1) % lista.length, 1); siguiente(); };
  if (o.musica) pista.play().catch(() => {});
}
function arrancarMusica() {
  if (arrancó || !lista.length) return; arrancó = true;
  idx = Math.floor(Math.random() * lista.length); siguiente();
}
export function setAudio(cambio) {
  o = { ...o, ...cambio }; try { localStorage.setItem(CLAVE, JSON.stringify(o)); } catch {}
  if (pista) { pista.volume = o.vol * .6; o.musica ? pista.play().catch(() => {}) : pista.pause(); }
  else if (o.musica) arrancarMusica();
  const b = document.getElementById("btn-audio"); if (b) b.textContent = o.musica ? "🔊" : "🔇";
}

export async function iniciarAudio() {
  const m = await json("musica/lista.json"); lista = Array.isArray(m) ? m.filter(x => typeof x === "string") : [];
  const s = await json("sonidos/lista.json");
  if (s && typeof s === "object") for (const [k, v] of Object.entries(s)) { if (typeof v === "string") { const a = new Audio("sonidos/" + v); a.onerror = () => delete archivos[k]; archivos[k] = a; } }
  const b = document.createElement("button");
  b.id = "btn-audio"; b.type = "button"; b.setAttribute("aria-label", "Música"); b.textContent = o.musica ? "🔊" : "🔇";
  b.onclick = e => { e.stopPropagation(); setAudio({ musica: !o.musica }); };
  document.body.appendChild(b);
  document.addEventListener("click", e => { if (e.target.closest("button:not(#btn-audio),.card,.tab,.opt,.interruptor")) sonar(e.target.closest("button:disabled") ? "error" : "click"); }, true);
  const arranque = () => { if (o.musica) arrancarMusica(); document.removeEventListener("pointerdown", arranque); };
  document.addEventListener("pointerdown", arranque);
}

// ---- Fondo animado: luces de estadio + césped que se desplaza; si hay imágenes propias, se alternan ----
export async function iniciarFondo() {
  const f = document.createElement("div"); f.id = "fondo";
  f.innerHTML = `<div class="f-cesped"></div><div class="f-luz a"></div><div class="f-luz b"></div><div class="f-img"></div><div class="f-vela"></div>`;
  document.body.prepend(f);
  const l = await json("img/fondos/lista.json"); const imgs = Array.isArray(l) ? l.filter(x => typeof x === "string") : [];
  if (!imgs.length) return;
  const cap = f.querySelector(".f-img"); let i = 0;
  const poner = () => { cap.style.opacity = 0; setTimeout(() => { cap.style.backgroundImage = `url("img/fondos/${imgs[i++ % imgs.length]}")`; cap.style.opacity = 1; }, 900); };
  poner(); if (imgs.length > 1) setInterval(poner, 14000);
}
