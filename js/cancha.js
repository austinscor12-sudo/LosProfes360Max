// Cancha en <canvas> que acompaña la simulación de cada partido.
// El resultado NO se decide acá: lo decide simulacion.js. Esta cancha "actúa" cada evento
// (gol, palo, atajada, penal, tarjetas...) para que lo que se ve coincida con el marcador.
// Entre eventos los jugadores juegan solos (se ubican según la formación, buscan la pelota, pasan y roban).
import { coloresEquipo } from "./data/colores.js";

/* ---------- Ajustes ---------- */
const COLORES_CLUB = true; // true = colores del club (si chocan, usa los alternativos); false = siempre azul contra rojo

// Formaciones: cantidad de jugadores por línea, de la defensa al ataque (el arquero va aparte).
export const FORMACIONES = {
  "4-4-2": [4, 4, 2], "4-3-3": [4, 3, 3], "4-2-3-1": [4, 2, 3, 1], "3-5-2": [3, 5, 2], "5-3-2": [5, 3, 2],
  "4-1-4-1": [4, 1, 4, 1], "3-4-3": [3, 4, 3], "4-3-1-2": [4, 3, 1, 2], "5-4-1": [5, 4, 1], "4-5-1": [4, 5, 1],
  "4-4-1-1": [4, 4, 1, 1], "3-4-1-2": [3, 4, 1, 2], "3-4-2-1": [3, 4, 2, 1], "4-2-2-2": [4, 2, 2, 2], "4-1-2-1-2": [4, 1, 2, 1, 2]
};
const NOMBRES = Object.keys(FORMACIONES);
const OFENSIVAS = ["4-3-3", "3-4-3", "4-2-2-2", "3-4-2-1", "4-4-2", "3-5-2"];   // se usan cuando el equipo va perdiendo
const DEFENSIVAS = ["5-4-1", "5-3-2", "4-5-1", "4-1-4-1"];                      // se usan para cuidar una ventaja corta

// Colores de algunas selecciones (el resto usa el color automático de colores.js).
const SEL = {
  Argentina: ["#6cc6f0", "#ffffff"], Brasil: ["#f7d000", "#1f8a3b"], Francia: ["#12306b", "#ffffff"], España: ["#d6202b", "#f7c600"],
  Alemania: ["#f4f4f4", "#111111"], Inglaterra: ["#f4f4f4", "#12306b"], Italia: ["#12408f", "#ffffff"], Uruguay: ["#6cc6f0", "#111111"],
  "Países Bajos": ["#f08a00", "#111111"], Portugal: ["#a3132b", "#1f8a3b"], Colombia: ["#f7d000", "#12408f"], Chile: ["#d6202b", "#12408f"],
  México: ["#1f8a3b", "#ffffff"], Croacia: ["#f4f4f4", "#d6202b"], Bélgica: ["#d6202b", "#111111"], Paraguay: ["#d6202b", "#ffffff"]
};

/* ---------- Medidas (metros) ---------- */
const L = 105, W = 68, GY = W / 2, ARCO = 3.66, MX = 3.8, MY = 2.4, RJ = 1.55, RB = .85;
const V = { 1: [.5], 2: [.34, .66], 3: [.2, .5, .8], 4: [.12, .38, .62, .88], 5: [.08, .29, .5, .71, .92] };

/* ---------- Utilidades ---------- */
const az = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const d2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
const dist = (a, b) => Math.sqrt(d2(a, b));
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

let _k = null;
const norm = c => { _k = _k || document.createElement("canvas").getContext("2d"); _k.fillStyle = "#000000"; _k.fillStyle = c; return _k.fillStyle; };
const rgb = h => { const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(h); return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [128, 128, 128]; };
const difC = (a, b) => { const x = rgb(a), y = rgb(b); return Math.sqrt(2 * (x[0] - y[0]) ** 2 + 4 * (x[1] - y[1]) ** 2 + 3 * (x[2] - y[2]) ** 2); };
const lum = h => { const [r, g, b] = rgb(h); return (.2126 * r + .7152 * g + .0722 * b) / 255; };
const PASTO = "#2e8b4a";
const coloresDe = n => (SEL[n] || coloresEquipo(n).slice(0, 2)).map(norm);

function elegirColores(a, b) {
  const AZ = "#2f6bff", RO = "#ff3b3b";
  if (!COLORES_CLUB) return [AZ, RO];
  const ca = coloresDe(a), cb = coloresDe(b);
  const ok = (x, y) => difC(x, y) > 120 && difC(x, PASTO) > 95 && difC(y, PASTO) > 95;
  for (const [i, j] of [[0, 0], [0, 1], [1, 0], [1, 1]]) if (ok(ca[i], cb[j])) return [ca[i], cb[j]];
  return [AZ, RO];
}
function colorArquero(c1, c2) {
  return ["#f2c14e", "#38d6c8", "#ff9ad5", "#c6ff4a", "#ff8a3d"].find(c => difC(c, c1) > 110 && difC(c, c2) > 110 && difC(c, PASTO) > 95) || "#f2c14e";
}

/* ---------- Formaciones -> posiciones (u: 0 = arco propio, 1 = arco rival; v: 0..1 a lo ancho) ---------- */
function slotsDe(lineas) {
  const n = lineas.length, s = [{ rol: "ARQ", u: .035, v: .5, l: -1 }];
  lineas.forEach((c, k) => {
    const u = n === 1 ? .45 : .2 + .5 * k / (n - 1);
    const rol = k === 0 ? "DEF" : k === n - 1 ? "DEL" : "MED";
    const vs = V[c] || V[4];
    for (let i = 0; i < c; i++) s.push({ rol, u: u + (rol === "DEL" && c === 1 ? .02 : 0), v: vs[i], l: k });
  });
  return s;
}
function nuevoJ(T, s) {
  return {
    eq: T, rol: s.rol, u: s.u, v: s.v, x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, vm: 1, fx: T.dir, fy: 0, cd: 0, prot: 0, dec: 0,
    ph: Math.random() * 6.28, cond: null, yo: false, tarj: null,
    max: (s.rol === "ARQ" ? 6.2 : s.rol === "DEF" ? 8.2 : s.rol === "MED" ? 8.8 : 9.2) * az(.94, 1.06)
  };
}
function crearEq(idx, nombre, color, gk, fnombre, dir) {
  const T = { idx, nombre, color, gk, dir, fnombre, lineas: FORMACIONES[fnombre], jug: [], borde: lum(color) > .75 ? "#2b2b2b" : "#ffffff" };
  slotsDe(T.lineas).forEach(s => T.jug.push(nuevoJ(T, s)));
  return T;
}

/* ---------- Estilos (se inyectan una sola vez) ---------- */
const CSS = `
.cancha{margin:0 0 16px;border:1px solid var(--linea,#2c6a4a);border-radius:16px;overflow:hidden;background:#06140d;box-shadow:0 14px 34px -12px rgba(0,0,0,.7)}
.cancha-top,.cancha-pie{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 12px;font-family:var(--cond,"Arial Narrow",sans-serif);letter-spacing:.06em;text-transform:uppercase}
.cancha-top{background:linear-gradient(180deg,#02070a,#0a1d14)}
.cancha-eq{display:flex;align-items:center;gap:8px;min-width:0;font-weight:700;font-size:1rem}
.cancha-eq b{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cancha-eq i{flex:none;width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.5)}
.cancha-eq em{flex:none;font-style:normal;color:var(--oro,#f2c14e);font-size:.95rem}
.cancha-eq.der{flex-direction:row-reverse;text-align:right}
.cancha canvas{display:block;width:100%;height:auto}
.cancha-pie{background:#0a1d14;font-size:.9rem;color:var(--gris,#9db3a5)}
.cancha-msg{min-height:1.2em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cancha-vel{display:flex;gap:6px;flex:none}
.cancha-vel button{font:inherit;font-weight:700;color:var(--tiza,#f2f5ef);background:rgba(0,0,0,.25);border:1px solid var(--linea,#2c6a4a);border-radius:8px;padding:2px 10px;cursor:pointer}
.cancha.limpia{border:0;border-radius:14px}
.cancha.limpia .cancha-top,.cancha.limpia .cancha-pie{display:none}
.cancha-vel button.on{border-color:var(--oro,#f2c14e);color:var(--oro,#f2c14e)}
`;
const inyectarCss = () => {
  if (document.getElementById("cancha-css")) return;
  const s = document.createElement("style"); s.id = "cancha-css"; s.textContent = CSS; document.head.appendChild(s);
};

/* ---------- Cancha ---------- */
class Cancha {
  constructor(host, o) {
    inyectarCss();
    this.o = o; this.host = host;
    this.velocidad = 1; this.t = 0; this.parado = false;
    this.timers = []; this.espera = []; this.bloq = false;
    this.g = null; this.fest = null; this.red = null; this.cartel = null; this.receptor = null; this.recT = 0;
    this.tandaOn = false; this.marcas = []; this.goles = [0, 0];

    const [cm, cr] = elegirColores(o.equipo, o.rival);
    const fm = pick(NOMBRES), fr = pick(NOMBRES);
    this.eq = [crearEq(0, o.equipo, cm, colorArquero(cm, cr), fm, 1), crearEq(1, o.rival, cr, colorArquero(cm, cr), fr, -1)];
    this.todos = this.eq[0].jug.concat(this.eq[1].jug);
    this.ball = { x: L / 2, y: GY, vx: 0, vy: 0, dueno: null, lastTeam: 0, ult: null };

    // Mi jugador (el del modo carrera): se marca con un anillo dorado si está en cancha.
    this.yoJ = null;
    if (o.pos) {
      const c = this.eq[0].jug.filter(p => p.rol === o.pos).sort((a, b) => Math.abs(a.v - .5) - Math.abs(b.v - .5));
      if (c.length) { this.yoJ = o.pos === "DEF" ? pick(c) : c[Math.floor(Math.random() * Math.min(2, c.length))]; this.yoJ.yo = o.rol === "Titular"; }
    }

    this.nombrar();
    this.armarDom();
    this.kickoff(Math.random() < .5 ? 0 : 1);
    this.ajustar();
    if (typeof ResizeObserver !== "undefined") { this.ro = new ResizeObserver(() => this.ajustar()); this.ro.observe(this.root); }
    this.iniciar();
  }

  /* ----- DOM ----- */
  armarDom() {
    const r = this.root = el("div", "cancha" + (this.o.limpio ? " limpia" : ""));
    const top = el("div", "cancha-top");
    this.chips = this.eq.map((T, i) => {
      const w = el("span", "cancha-eq" + (i ? " der" : "")), pt = el("i"), n = el("b", "", T.nombre), f = el("em");
      pt.style.background = T.color; w.append(pt, n, f); top.appendChild(w); return f;
    });
    this.cv = el("canvas"); this.ctx = this.cv.getContext("2d");
    const pie = el("div", "cancha-pie"); this.msgEl = el("span", "cancha-msg");
    const vel = el("span", "cancha-vel");
    this.btnN = el("button", "", ""); this.btnN.type = "button";
    this.btnN.onclick = () => { this.modoN = (this.modoN + 2) % 3; this.rotularN(); };
    vel.appendChild(this.btnN);
    [1, 2, 4].forEach(v => {
      const b = el("button", v === 1 ? "on" : "", "x" + v); b.type = "button";
      b.onclick = () => { this.velocidad = v; vel.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); };
      vel.appendChild(b);
    });
    pie.append(this.msgEl, vel);
    r.append(top, this.cv, pie);
    this.host.appendChild(r);
    this.actualizarChips();
  }
  rotularN() { this.btnN.textContent = "Nombres: " + ["no", "pelota", "todos"][this.modoN]; }
  actualizarChips() { this.eq.forEach((T, i) => { this.chips[i].textContent = (T.dir === 1 ? "▶ " : "◀ ") + T.fnombre; }); }
  msg(t) { this.msgEl.textContent = t; clearTimeout(this._tm); this._tm = setTimeout(() => { this.msgEl.textContent = ""; }, 4500); }

  ajustar() {
    const w = Math.max(240, Math.floor(this.root.clientWidth || 640)), dpr = Math.min(2, (typeof window !== "undefined" && window.devicePixelRatio) || 1);
    this.dpr = dpr; this.s = w / (L + 2 * MX);
    if (this.modoN === undefined) { this.modoN = w >= 560 ? 2 : 1; this.rotularN(); }
    const h = Math.round(w * (W + 2 * MY) / (L + 2 * MX));
    this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(h * dpr);
    this.fondo = document.createElement("canvas"); this.fondo.width = this.cv.width; this.fondo.height = this.cv.height;
    const k = dpr * this.s, f = this.fondo.getContext("2d");
    f.setTransform(k, 0, 0, k, MX * k, MY * k); this.dibujarFondo(f);
    if (this.parado) this.dibujar();
  }

  /* ----- Bucle ----- */
  iniciar() {
    let ult = performance.now();
    const f = ahora => {
      if (this.parado) return;
      if (!this.host.isConnected) return this.parar();
      const dt = Math.min(.1, (ahora - ult) / 1000); ult = ahora;
      const tot = dt * this.velocidad, n = Math.max(1, Math.ceil(tot / .034));
      for (let i = 0; i < n; i++) this.paso(tot / n);
      this.dibujar();
      this.raf = requestAnimationFrame(f);
    };
    this.raf = requestAnimationFrame(f);
  }
  parar() {
    if (this.parado) return;
    this.parado = true; cancelAnimationFrame(this.raf);
    if (this.ro) this.ro.disconnect();
    const g = this.g; this.g = null; this.fest = null; this.bloq = false;
    if (g && g.listo) g.listo();
    this.timers.forEach(tm => tm.res && tm.fn()); this.timers = [];
    this.despertar();
  }
  despues(seg, fn, res) { this.timers.push({ t: seg, fn, res }); }
  libre() { return this.bloq ? new Promise(r => this.espera.push(r)) : Promise.resolve(); }
  despertar() { const a = this.espera; this.espera = []; a.forEach(r => r()); }

  paso(dt) {
    this.t += dt;
    for (let i = this.timers.length - 1; i >= 0; i--) { const tm = this.timers[i]; tm.t -= dt; if (tm.t <= 0) { this.timers.splice(i, 1); tm.fn(); } }
    if (this.recT > 0 && (this.recT -= dt) <= 0) this.receptor = null;
    for (const p of this.todos) { if (p.cd > 0) p.cd -= dt; if (p.prot > 0) p.prot -= dt; }
    this.objetivos(dt);
    if (this.celeb) this.pasoCeleb(dt);
    for (const T of this.eq) if (T.dtp && !this.celeb) T.dtp.x = L / 2 + (T.idx ? 10 : -10) + Math.sin(this.t * .25 + T.idx * 2) * 8;
    if (this.g) this.pasoAtaque(dt);
    if (this.fest) this.pasoFesta(dt);
    this.mover(dt);
    this.balon(dt);
    if ((!this.g || this.g.quites) && !this.fest && !this.tandaOn && !this.celeb) this.quites(dt);
    if (this.cartel && (this.cartel.t += dt) > this.cartel.dur) this.cartel = null;
    if (this.red && (this.red.t += dt) > 1.3) this.red = null;
    for (let i = this.marcas.length - 1; i >= 0; i--) if ((this.marcas[i].t -= dt) <= 0) this.marcas.splice(i, 1);
  }

  /* ----- Nombres (plantillas de js/data/plantillas/) ----- */
  nombrar() {
    this.eq.forEach((T, i) => {
      const pl = i ? this.o.plRiv : this.o.plMi, lista = pl && pl.jugadores.length ? pl.jugadores : [], usados = new Set();
      T.dt = (pl && pl.dt) || (i === 0 && this.o.dt) || "";
      T.dtp = { x: L / 2 + (i ? 10 : -10), y: i ? W + 1.2 : -1.2 };
      // Los 11 titulares de la plantilla siempre están en cancha: cada uno va al lugar de su puesto o al más parecido.
      const ord = { ARQ: 0, DEF: 1, MED: 2, DEL: 3 }, tit = lista.slice(0, 11);
      for (const p of T.jug) {
        const f = tit.filter(x => !usados.has(x)).sort((a, b) => Math.abs(ord[a.p] - ord[p.rol]) - Math.abs(ord[b.p] - ord[p.rol]))[0];
        if (f) { usados.add(f); p.nom = f.c; p.fijo = true; }
      }
    });
    if (this.yoJ && this.o.yo) { this.yoJ.nom = this.o.yo; this.yoJ.fijo = true; }
  }
  // Jugadores del equipo T nombrados en un texto del relato, en orden de aparición. Si el nombre no está en la cancha, se lo pone a alguien.
  nombresEn(texto, T) {
    const out = [], t = texto || "";
    for (const p of T.jug) if (p.nom && p !== this.yoJ && p.rol !== "ARQ" && t.includes(p.nom)) out.push({ p, i: t.indexOf(p.nom) });
    const re = /[A-ZÁÉÍÓÚÑ]\. [A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ'’-]+/g; let m;
    while ((m = re.exec(t))) {
      if (T.jug.some(q => q.nom === m[0])) continue;
      // Si el nombre no está en cancha (por ejemplo, tu jugador ocupa su lugar) se lo cede alguien que no sea protagonista de este relato.
      let pool = T.jug.filter(q => q.rol !== "ARQ" && !q.fijo && q !== this.yoJ && !out.some(o => o.p === q));
      if (!pool.length) pool = T.jug.filter(q => q.rol !== "ARQ" && q !== this.yoJ && !out.some(o => o.p === q));
      if (!pool.length) continue;
      const pref = pool.filter(q => q.rol !== "DEF"), q = pick(pref.length ? pref : pool);
      q.nom = m[0]; q.fijo = true; out.push({ p: q, i: m.index });
    }
    return out.sort((a, b) => a.i - b.i);
  }

  /* ----- Posiciones de partida ----- */
  casa(p) { const T = p.eq; return { x: (T.dir === 1 ? p.u : 1 - p.u) * L, y: (T.dir === 1 ? p.v : 1 - p.v) * W }; }
  kickoff(saca) {
    for (const p of this.todos) {
      const h = this.casa(p), T = p.eq, lim = L / 2 - 1.2;
      p.x = T.dir === 1 ? Math.min(h.x, lim) : Math.max(h.x, L - lim); p.y = h.y;
      p.vx = p.vy = 0; p.tx = p.x; p.ty = p.y; p.cd = 0; p.prot = 0; p.cond = null; p.dec = 1; p.fx = T.dir; p.fy = 0;
    }
    const T = this.eq[saca], s = T.jug.find(p => p.rol === "DEL") || T.jug.find(p => p.rol !== "ARQ");
    s.x = L / 2 - T.dir * .6; s.y = GY;
    const b = this.ball; b.x = L / 2; b.y = GY; b.vx = b.vy = 0; b.dueno = null; b.lastTeam = saca;
    this.receptor = null; this.dar(s); s.dec = .9;
  }

  /* ----- Inteligencia simple ----- */
  objetivos(dt) {
    const b = this.ball, dueno = b.dueno, tp = dueno ? dueno.eq.idx : b.lastTeam;
    const K = { DEF: .5, MED: .65, DEL: .65 }, A = { DEF: .07, MED: .1, DEL: .09 }, Dn = { DEF: -.04, MED: -.06, DEL: -.1 };
    for (const T of this.eq) {
      const dir = T.dir, bu = dir === 1 ? b.x / L : 1 - b.x / L, tiene = tp === T.idx;
      const out = T.jug.filter(p => p.rol !== "ARQ").sort((a, c) => d2(a, b) - d2(c, b));
      const n = dueno && dueno.eq === T ? 0 : dueno ? 2 : (b.lastTeam === T.idx ? 1 : 2);
      for (const p of T.jug) {
        p.vm = 1;
        if (p.rol === "ARQ") { this.objArquero(p, T, dt); continue; }
        if (p === dueno) { this.decidir(p, dt); const c = p.cond; p.tx = c ? c.x : p.x; p.ty = c ? c.y : p.y; p.vm = .92; continue; }
        if (p === this.receptor && !dueno) { p.tx = b.x + b.vx * .35; p.ty = b.y + b.vy * .35; continue; }
        const k = out.indexOf(p);
        let u = clamp(p.u + (bu - .5) * K[p.rol] + (tiene ? A[p.rol] : Dn[p.rol]), .06, .96);
        let x = dir === 1 ? u * L : (1 - u) * L, y = (dir === 1 ? p.v : 1 - p.v) * W;
        y += (b.y - y) * .2;
        x += Math.sin(this.t * .6 + p.ph) * .9; y += Math.cos(this.t * .5 + p.ph * 1.3) * .9;
        if (k < n) {
          if (k === 0) { p.tx = (dueno || b).x + (dueno ? 0 : b.vx * .25); p.ty = (dueno || b).y + (dueno ? 0 : b.vy * .25); p.vm = 1.02; }
          else { p.tx = ((dueno || b).x + x) / 2; p.ty = ((dueno || b).y + y) / 2; p.vm = .9; }
        } else { p.tx = x; p.ty = y; }
      }
    }
    if (this.tandaOn) {
      const act = this.g;
      for (const T of this.eq) T.jug.forEach((p, i) => {
        if (act && (p === act.F || p === act.gk)) return;
        const a = (i / T.jug.length) * Math.PI + (T.idx ? Math.PI : 0) + Math.PI / 2;
        p.tx = L / 2 + Math.cos(a) * 9; p.ty = GY + Math.sin(a) * 9; p.vm = .8;
      });
    }
    if (this.fest) {
      const f = this.fest;
      for (const p of f.T.jug) if (p.rol !== "ARQ" && p !== f.F) { p.tx = f.F.x - f.T.dir * az(1, 4); p.ty = f.F.y + az(-3, 3); p.vm = .85; }
      f.F.tx = f.F.x + f.T.dir * 5; f.F.ty = f.F.y < GY ? 4 : W - 4; f.F.vm = 1.15;
    }
  }
  objArquero(p, T, dt) {
    const b = this.ball, own = T.dir === 1 ? 0 : L;
    if (b.dueno === p) { this.decidir(p, dt); p.tx = p.x; p.ty = p.y; return; }
    p.tx = own + T.dir * 3.2; p.ty = GY + clamp((b.y - GY) * .25, -5, 5);
    if (!b.dueno && Math.abs(b.x - own) < 13 && Math.abs(b.y - GY) < 16 && Math.hypot(b.vx, b.vy) < 12) { p.tx = b.x; p.ty = b.y; p.vm = 1.15; }
  }
  decidir(p, dt) {
    if (this.g || this.fest || this.tandaOn) return;
    p.dec -= dt; if (p.dec > 0) return;
    p.dec = az(.5, 1.05);
    const T = p.eq, dir = T.dir, rival = this.eq[T.idx ^ 1], gx = dir === 1 ? L : 0;
    let opp = null, od = 1e9;
    for (const q of rival.jug) { const d = dist(p, q); if (d < od) { od = d; opp = q; } }
    const enZona = Math.abs(gx - p.x) < 24;
    let mejor = null, ms = -1e9;
    for (const q of T.jug) {
      if (q === p) continue;
      const d = dist(p, q); if (d < 6 || d > 36) continue;
      let mo = 12; for (const r of rival.jug) mo = Math.min(mo, dist(q, r));
      const s = ((q.x - p.x) * dir / 30) * (enZona ? .2 : 1) + (mo / 12) * 1.2 - d / 60 + Math.random() * .6 - (q.rol === "ARQ" ? 2 : 0);
      if (s > ms) { ms = s; mejor = q; }
    }
    if (mejor && (od < 3.6 || p.rol === "ARQ" || enZona || Math.random() < .45)) this.pasar(p, mejor);
    else {
      let oy = p.y; if (od < 7) oy += Math.sign(p.y - opp.y || 1) * 6;
      p.cond = { x: clamp(p.x + dir * 12, 6, L - 6), y: clamp(oy, 5, W - 5) };
    }
  }
  pasar(p, q) {
    const d = dist(p, q), sp = clamp(10 + d * 1.1, 13, 28), t = d / sp;
    this.patear(p, q.x + q.vx * t * .8, q.y + q.vy * t * .8, sp);
    this.receptor = q; this.recT = 2.2;
  }
  patear(p, tx, ty, sp) {
    const b = this.ball, dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy) || 1;
    b.vx = dx / d * sp; b.vy = dy / d * sp; b.dueno = null; b.ult = p; b.lastTeam = p.eq.idx; p.cd = .35; p.cond = null;
  }
  dar(p) {
    const b = this.ball;
    b.dueno = p; b.lastTeam = p.eq.idx; b.ult = p; b.vx = b.vy = 0;
    if (this.receptor === p) this.receptor = null;
    p.dec = az(.3, .7); p.cond = null; p.prot = .5;
    b.x = clamp(p.x + (p.fx || p.eq.dir) * 1.5, .4, L - .4); b.y = clamp(p.y + (p.fy || 0) * 1.5, .4, W - .4);
  }

  /* ----- Física ----- */
  mover(dt) {
    for (const p of this.todos) {
      const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy);
      const vmax = p.max * p.vm * (p === this.ball.dueno ? .92 : 1), sp = Math.min(vmax, d * 3.2);
      const wx = d > .01 ? dx / d * sp : 0, wy = d > .01 ? dy / d * sp : 0, k = Math.min(1, dt * 7);
      p.vx += (wx - p.vx) * k; p.vy += (wy - p.vy) * k;
    }
    const a = this.todos;
    for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) {
      const p = a[i], q = a[j], dx = p.x - q.x, dy = p.y - q.y, d = Math.hypot(dx, dy);
      if (d < 2.6 && d > .001) { const f = (2.6 - d) * dt * 18 / d; p.vx += dx * f; p.vy += dy * f; q.vx -= dx * f; q.vy -= dy * f; }
    }
    for (const p of a) {
      p.x = clamp(p.x + p.vx * dt, -1, L + 1); p.y = clamp(p.y + p.vy * dt, -1, W + 1);
      const s = Math.hypot(p.vx, p.vy);
      if (s > .6) { p.fx = p.vx / s; p.fy = p.vy / s; }
    }
  }
  balon(dt) {
    const b = this.ball;
    if (this.tandaOn && !this.g) { b.dueno = null; b.vx = b.vy = 0; b.x = L - 11; b.y = GY; return; }
    if (this.celeb) return;
    if (b.dueno) { const p = b.dueno; b.x = clamp(p.x + p.fx * 1.5, .4, L - .4); b.y = clamp(p.y + p.fy * 1.5, .4, W - .4); b.vx = b.vy = 0; return; }
    b.x += b.vx * dt; b.y += b.vy * dt;
    const f = Math.exp(-.8 * dt); b.vx *= f; b.vy *= f;
    if (Math.hypot(b.vx, b.vy) < .3) b.vx = b.vy = 0;
    this.paredes(b);
    this.recoger();
  }
  paredes(b) {
    if (b.y < 0) { b.y = 0; b.vy = Math.abs(b.vy) * .55; } else if (b.y > W) { b.y = W; b.vy = -Math.abs(b.vy) * .55; }
    const g = this.g;
    for (const lx of [0, L]) {
      if (lx === 0 ? b.x >= 0 : b.x <= L) continue;
      if (g && g.abre === lx) {
        const prof = Math.abs(b.x - lx), red = Math.abs(b.y - GY) < ARCO + .3, tope = red ? 2.2 : 5;
        if (prof > tope) { b.x = lx === 0 ? -tope : L + tope; b.vx *= .05; b.vy *= .05; } else if (red) { b.vx *= .94; b.vy *= .94; }
        continue;
      }
      this.saqueMeta(lx); return;   // fuera de juego por el fondo: sale el arquero
    }
  }
  saqueMeta(lx) {
    const T = this.eq.find(e => (e.dir === 1 ? 0 : L) === lx), gk = T.jug.find(p => p.rol === "ARQ"), b = this.ball;
    if (Math.hypot(gk.x - lx, gk.y - b.y) > 12) { gk.x = lx + T.dir * 3; gk.y = clamp(b.y, GY - 8, GY + 8); gk.vx = gk.vy = 0; }
    this.dar(gk);
  }
  puede(p) {
    if (this.fest) return false;
    const g = this.g;
    if (!g) return !this.tandaOn;
    switch (g.fase) {
      case "toma": return p === g.carrier;
      case "recibe": return p === g.F;
      case "cierre": return g.fin !== "gol";
      default: return false;
    }
  }
  recoger() {
    const b = this.ball; if (b.dueno) return;
    const sp = Math.hypot(b.vx, b.vy), r = sp > 22 ? 1.2 : 1.8;
    let mejor = null, md = 1e9;
    for (const p of this.todos) {
      if (p.cd > 0) continue;
      if (!this.puede(p)) continue;
      const d = Math.hypot(p.x - b.x, p.y - b.y);
      if (d < r && d < md) { md = d; mejor = p; }
    }
    if (!mejor) return;
    if (mejor.eq.idx !== b.lastTeam && mejor !== this.receptor && sp > 1 && Math.random() > .25) return;
    this.dar(mejor);
  }
  quites(dt) {
    const b = this.ball, p = b.dueno;
    if (!p || p.prot > 0 || p.rol === "ARQ") return;
    let q = null, md = 1.7;
    for (const r of this.eq[p.eq.idx ^ 1].jug) { if (r.rol === "ARQ" || r.cd > 0) continue; const d = dist(p, r); if (d < md) { md = d; q = r; } }
    if (q && Math.random() < dt * 2.2) { p.cd = .8; this.dar(q); }
  }

  /* ----- Eventos del partido -> jugadas ----- */
  jugada(e, sig) {
    if (this.parado) return Promise.resolve();
    return new Promise(resolve => {
      let hecho = false;
      const fin = () => { if (hecho) return; hecho = true; clearTimeout(wd); resolve(); };
      const wd = setTimeout(() => { this.abortar(); fin(); }, 16000 / this.velocidad);   // seguro: nunca deja colgado el partido
      this.libre().then(() => {
        if (this.parado) return fin();
        try { this.arrancar(e, fin, sig); } catch (err) { console.error(err); this.g = null; fin(); }
      });
    });
  }
  abortar() { this.g = null; this.fest = null; this.bloq = false; this.despertar(); }

  arrancar(e, fin, sig) {
    if (this.g && this.g.fase === "penal-espera") return this.resolverPenal(e, fin);
    this.efectos(e);
    const plan = this.plan(e);
    if (!plan) return fin();
    if (plan.tipo === "ataque") this.iniciarAtaque(plan, fin);
    else if (plan.tipo === "penal") this.armarPenal(plan, fin, sig);
    else this.iniciarTanda(plan, fin);
  }

  plan(e) {
    const X = e.x || "", t = e.t, M = this.o.equipo, yo = !!e.yo;
    if (e.m >= 200 && ["gol", "golR", "tiro", "ataj"].includes(t)) {
      const lado = t === "gol" ? "M" : t === "golR" || t === "ataj" ? "R" : X.startsWith(M) ? "M" : "R";
      const fin = t === "gol" || t === "golR" ? "gol" : t === "ataj" ? "ataj" : (Math.random() < .5 ? "afuera" : "ataj");
      return { tipo: "tanda", lado, fin, yo, tx: X };
    }
    const A = (lado, fin) => ({ tipo: "ataque", lado, fin, yo, tx: X });
    switch (t) {
      case "gol": return A("M", "gol");
      case "golR": return A("R", "gol");
      case "tiro": return A("M", /Bloquean|defensa despeja/i.test(X) ? "bloq" : /arquero|desv|ataja|responde/i.test(X) ? "ataj" : "afuera");
      case "pase": return A("M", /palo/.test(X) ? "palo" : /ataja/.test(X) ? "ataj" : "afuera");
      case "palo": return A(/casi marca/.test(X) ? "R" : "M", "palo");
      case "ataj": return A("R", "ataj");
      case "corte": return A("R", /bloquea el remate/.test(X) ? "bloq" : "corte");
      case "penal": return { tipo: "penal", lado: /^¡Penal para/.test(X) ? "M" : "R", yo, tx: X };
      case "info":
        if (/Atajada del arquero de/.test(X)) return A("M", "ataj");
        if (/intenta el remate/.test(X)) return A("M", "bloq");
        if (/filtrar un pase/.test(X)) return A("M", "corte");
        return null;
      default: return null;
    }
  }

  efectos(e) {
    const X = e.x || "", R = this.o.rival;
    if (e.t === "info" && /Termina el primer tiempo/.test(X)) this.medioTiempo();
    if (e.t === "amarilla") this.tarjeta(e.yo || !X.endsWith(`(${R}).`) ? 0 : 1, "#f5d300", e.yo, X);
    if (e.t === "roja") { const lado = e.yo ? 0 : X.includes(` de ${R}.`) ? 1 : 0; this.tarjeta(lado, "#e53935", e.yo, X); this.expulsar(lado, e.yo, X); }
    if (e.t === "cambio" && e.yo && this.yoJ) this.yoJ.yo = /Ingres/.test(X);
    if (e.t === "lesion" && e.yo && this.yoJ) this.yoJ.yo = false;
    this.tactica(e);
  }
  medioTiempo() {
    for (const T of this.eq) T.dir *= -1;
    this.kickoff(1); this.actualizarChips(); this.msg("Segundo tiempo: los equipos cambian de lado");
  }
  tarjeta(lado, c, yo, X) {
    const T = this.eq[lado], out = T.jug.filter(p => p.rol !== "ARQ"), nm = this.nombresEn(X, T)[0];
    const p = yo && this.yoJ && this.yoJ.eq === T && T.jug.includes(this.yoJ) ? this.yoJ : nm ? nm.p : pick(out);
    this.marcas.push({ p, c, t: 2, x: p.x, y: p.y });
  }
  expulsar(lado, yo, X) {
    const T = this.eq[lado], out = T.jug.filter(p => p.rol !== "ARQ"), nm = this.nombresEn(X, T)[0];
    if (out.length < 8) return;
    let p = yo && this.yoJ && this.yoJ.eq === T && T.jug.includes(this.yoJ) ? this.yoJ : nm ? nm.p : pick(out);
    if (p === this.yoJ) p.yo = false;
    if (p.rol === "ARQ") p = pick(out);   // si echan al arquero, entra otro y el equipo queda con uno menos de campo
    if (this.ball.dueno === p) { this.ball.dueno = null; }
    if (this.receptor === p) this.receptor = null;
    T.jug.splice(T.jug.indexOf(p), 1);
    this.todos = this.eq[0].jug.concat(this.eq[1].jug);
    this.reformar(T);
  }
  tactica(e) {
    if (e.m < 62 || e.m >= 200) return;
    for (const T of this.eq) {
      if (T.cambioT) continue;
      const gf = T.idx === 0 ? e.gm : e.gr, gc = T.idx === 0 ? e.gr : e.gm;
      const pool = gf < gc ? OFENSIVAS : gf === gc + 1 && e.m >= 70 ? DEFENSIVAS : null;
      if (!pool || Math.random() > .75) continue;
      const n = pick(pool.filter(f => f !== T.fnombre)); T.cambioT = true;
      this.reformar(T, n); this.actualizarChips(); this.msg(`${T.nombre} cambia a ${n}`);
    }
  }
  // Reasigna posiciones (cambio de formación o jugador menos por expulsión).
  reformar(T, nombre) {
    if (nombre) { T.fnombre = nombre; T.lineas = FORMACIONES[nombre]; }
    const out = T.jug.filter(p => p.rol !== "ARQ");
    let slots = slotsDe(T.lineas).filter(s => s.rol !== "ARQ");
    while (slots.length > out.length) {
      const cnt = {}; slots.forEach(s => { cnt[s.l] = (cnt[s.l] || 0) + 1; });
      const l = +Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a] || a - b)[0];
      slots.splice(slots.map(s => s.l).lastIndexOf(l), 1);
    }
    slots.sort((a, b) => a.u - b.u || a.v - b.v);
    out.sort((a, b) => a.u - b.u || a.v - b.v).forEach((p, i) => { p.rol = slots[i].rol; p.u = slots[i].u; p.v = slots[i].v; });
  }

  /* ----- Jugadas armadas ----- */
  yoActivo(T) { const y = this.yoJ; return y && y.yo && y.eq === T && T.jug.includes(y) && y.rol !== "ARQ" ? y : null; }
  iniciarAtaque(plan, fin) {
    const T = this.eq[plan.lado === "M" ? 0 : 1], D = this.eq[T.idx ^ 1], b = this.ball;
    const metaX = T.dir === 1 ? L : 0, dirA = T.dir;
    const yoT = this.yoActivo(T), yoD = this.yoActivo(D);
    const out = T.jug.filter(p => p.rol !== "ARQ"), outD = D.jug.filter(p => p.rol !== "ARQ");
    const cerca = (arr, ref) => arr.slice().sort((a, c) => d2(a, ref) - d2(c, ref))[0];
    const elegirFin = excl => {
      const r = Math.random(), pr = a => a.filter(p => p !== excl);
      const arr = pr(out.filter(p => p.rol === (r < .6 ? "DEL" : r < .9 ? "MED" : "DEF")));
      return pick(arr.length ? arr : pr(out));
    };
    const pasa = /pase|filtrar/i.test(plan.tx);
    let carrier, F;
    if (plan.fin === "corte") {
      carrier = plan.yo && yoT ? yoT : cerca(out.filter(p => p.rol !== "DEF"), b) || cerca(out, b); F = carrier;
    } else if (plan.yo && yoT && pasa) { carrier = yoT; F = elegirFin(yoT); }
    else if (plan.yo && yoT) { F = yoT; carrier = b.dueno && b.dueno.eq === T && b.dueno !== F ? b.dueno : cerca(out.filter(p => p !== F), b); }
    else { F = elegirFin(null); carrier = cerca(out.filter(p => p !== F), b); }
    if (plan.fin !== "corte") {
      const ns = this.nombresEn(plan.tx, T).map(o => o.p);
      if (ns.length) {
        const asist = /Asistencia de|pase exquisito/.test(plan.tx);
        if (plan.yo && yoT && !pasa) { if (/Asistencia de/.test(plan.tx) && ns[0] !== yoT) carrier = ns[0]; }
        else if (plan.yo && yoT && pasa) F = ns[0];
        else { F = ns[0]; if (asist && ns[1]) carrier = ns[1]; else if (carrier === F) carrier = cerca(out.filter(p => p !== F), b); }
      }
    }
    const Q = { x: metaX - dirA * az(11, 16), y: GY + az(-8, 8) };
    const zona = { x: metaX - dirA * (plan.fin === "corte" ? az(24, 30) : az(22, 28)), y: clamp(GY + az(-12, 12), 14, 54) };
    const g = this.g = {
      tipo: "ataque", plan, fin: plan.fin, T, D, metaX, dirA, carrier, F, gk: D.jug.find(p => p.rol === "ARQ"),
      fase: "toma", t: 0, tf: 0, zona, Q, espera: 0, listo: fin, quites: false, abre: null, Db: null, Dd: null, resuelto: false
    };
    if (plan.fin === "bloq") g.Db = (plan.lado === "R" && plan.yo && yoD) || cerca(outD, Q);
    if (plan.fin === "corte") g.Dd = (plan.lado === "R" && plan.yo && yoD) || cerca(outD.filter(p => p.rol === "DEF"), zona) || cerca(outD, zona);
  }
  armarPenal(plan, fin, sig) {
    const T = this.eq[plan.lado === "M" ? 0 : 1], D = this.eq[T.idx ^ 1], b = this.ball;
    const metaX = T.dir === 1 ? L : 0, dirA = T.dir, out = T.jug.filter(p => p.rol !== "ARQ"), yoT = this.yoActivo(T);
    const nm = sig ? this.nombresEn(sig.x, T)[0] : null;   // el que patea figura en el evento que sigue
    const F = plan.yo && /Se hace cargo/.test(plan.tx) && yoT ? yoT : nm ? nm.p : (pick(out.filter(p => p.rol === "DEL")) || pick(out));
    const resto = out.filter(p => p !== F), cerca = (arr, ref) => arr.slice().sort((a, c) => d2(a, ref) - d2(c, ref))[0];
    const carrier = cerca(resto.filter(p => p.rol !== "DEF"), b) || cerca(resto, b);   // al que le hacen la falta
    const spot = { x: metaX - dirA * 11, y: GY }, Q = { x: metaX - dirA * az(14, 18), y: GY + az(-6, 6) };
    this.g = {
      tipo: "ataque", plan, fin: null, T, D, metaX, dirA, carrier, F, gk: D.jug.find(p => p.rol === "ARQ"),
      fase: "toma", t: 0, tf: 0, penal: true, pre: true, spot, Q, zona: Q, finPenal: fin, listo: () => {}, quites: false, abre: null, Db: null, Dd: null, resuelto: false
    };
  }
  resolverPenal(e, fin) {
    const g = this.g, X = e.x || "";
    g.fin = e.t === "gol" || e.t === "golR" ? "gol" : e.t === "ataj" || (e.t === "tiro" && /arquero/.test(X)) ? "ataj" : "afuera";
    g.listo = fin; g.fase = "apronte"; g.tf = 0;
  }
  iniciarTanda(plan, fin) {
    const T = this.eq[plan.lado === "M" ? 0 : 1], D = this.eq[T.idx ^ 1], b = this.ball;
    const out = T.jug.filter(p => p.rol !== "ARQ"), yoT = this.yoActivo(T);
    const nm = this.nombresEn(plan.tx, T)[0];
    const F = plan.yo && yoT ? yoT : nm ? nm.p : pick(out), gk = D.jug.find(p => p.rol === "ARQ");
    this.tandaOn = true;
    const spot = { x: L - 11, y: GY };
    b.dueno = null; b.x = spot.x; b.y = spot.y; b.vx = b.vy = 0; b.lastTeam = T.idx;
    F.x = L - 17; F.y = GY + az(-2, 2); F.vx = F.vy = 0;
    gk.x = L - 1.3; gk.y = GY; gk.vx = gk.vy = 0;
    this.g = {
      tipo: "ataque", plan, fin: plan.fin, T, D, metaX: L, dirA: 1, carrier: F, F, gk, fase: "apronte", t: 0, tf: -.2, penal: true, spot,
      listo: fin, quites: false, abre: null, resuelto: false
    };
  }

  pasoAtaque(dt) {
    const g = this.g, b = this.ball, { T, D, F, carrier, gk, metaX, dirA } = g;
    g.t += dt; g.tf += dt;
    switch (g.fase) {
      case "toma": {
        // El que va a atacar recupera la pelota jugando (no aparece de la nada).
        if (b.dueno === carrier) { g.fase = "avance"; g.t = 0; break; }
        if (!g.pedido) {
          g.pedido = true;
          const k = b.dueno;
          if (k && dist(k, carrier) > 5) { this.patear(k, carrier.x, carrier.y, 26); this.receptor = carrier; this.recT = 2.5; }
          else if (k || dist(b, carrier) < 3) this.dar(carrier);
        }
        carrier.tx = b.x + b.vx * .3; carrier.ty = b.y + b.vy * .3; carrier.vm = 1.25;
        if (g.tf > 1.8) this.dar(carrier);
        break;
      }
      case "falta": {
        carrier.tx = carrier.x; carrier.ty = carrier.y;
        if (g.tf > .7) {
          b.dueno = null; b.x = g.spot.x; b.y = g.spot.y; b.vx = b.vy = 0; b.lastTeam = T.idx;
          g.fase = "penal-espera"; g.tf = 0;
          this.despues(.9, g.finPenal, true);
        }
        break;
      }
      case "avance": {
        if (b.dueno !== carrier) this.dar(carrier);
        const dest = F === carrier || g.pre ? g.Q : g.zona;
        carrier.tx = dest.x; carrier.ty = dest.y; carrier.vm = 1.05;
        if (F !== carrier) { F.tx = g.Q.x; F.ty = g.Q.y; F.vm = 1.1; }
        if (g.Db) { g.Db.tx = g.Q.x + dirA * 3; g.Db.ty = g.Q.y; g.Db.vm = 1.1; }
        const lleg = F === carrier || g.pre ? dist(carrier, g.Q) < 2.5 : (g.zona.x - carrier.x) * dirA <= 3.5;
        if (lleg || g.t > 2.4) {
          if (g.pre) { g.fase = "falta"; g.tf = 0; this.cartel = { txt: "¡PENAL!", col: T.color, t: 0, dur: 1.6 }; }
          else if (g.fin === "corte") { g.fase = "quite"; g.tf = 0; }
          else if (F === carrier) { g.fase = "apronte"; g.tf = 0; }
          else { this.pasar(carrier, F); g.fase = "recibe"; g.tf = 0; }
        }
        break;
      }
      case "quite": {
        const Dd = g.Dd; Dd.tx = b.x; Dd.ty = b.y; Dd.vm = 1.4;
        carrier.tx = carrier.x + dirA * 2; carrier.ty = carrier.y; carrier.vm = .6;
        if (dist(Dd, b) < 1.9 || g.tf > 1.3) { carrier.cd = 1; this.dar(Dd); g.fase = "cierre"; g.espera = .45; }
        break;
      }
      case "recibe": {
        F.tx = b.x; F.ty = b.y; F.vm = 1.1;
        if (g.Db) { g.Db.tx = F.x + dirA * 3; g.Db.ty = F.y; }
        if (b.dueno === F) { g.fase = "apronte"; g.tf = 0; }
        else if (g.tf > 1.2) { this.dar(F); g.fase = "apronte"; g.tf = 0; }
        break;
      }
      case "penal-espera": {
        F.tx = g.spot.x - dirA * 2.2; F.ty = g.spot.y; F.vm = 1.2;
        gk.tx = metaX - dirA * 1.1; gk.ty = GY; gk.vm = 1.2;
        const resto = this.todos.filter(p => p !== F && p !== gk && p.rol !== "ARQ");
        resto.forEach((p, i) => { p.tx = metaX - dirA * (21 + (i % 2) * 1.6); p.ty = GY + (i - resto.length / 2) * 2.9; p.vm = 1.3; });
        b.x = g.spot.x; b.y = g.spot.y; b.vx = b.vy = 0; b.dueno = null;
        break;
      }
      case "apronte": {
        if (g.penal) { F.tx = g.spot.x - dirA * .9; F.ty = g.spot.y; gk.tx = metaX - dirA * 1.2; gk.ty = GY; }
        else { F.tx = F.x; F.ty = F.y; }
        if (g.tf >= (g.penal ? .5 : .3)) this.disparar();
        break;
      }
      case "tiro": this.pasoTiro(); break;
      case "cierre": {
        if ((g.espera -= dt) <= 0) { if (g.fin === "afuera") this.dar(gk); this.terminar(); }
        break;
      }
    }
  }
  disparar() {
    const g = this.g, { F, gk, metaX, dirA, fin, D } = g, lado = Math.random() < .5 ? -1 : 1, vel = az(27, 32);
    let yT, ky;
    if (fin === "gol") { const o = az(1.9, 3.2); yT = GY + lado * o; ky = Math.random() < .5 ? GY - lado * az(.5, 1.6) : GY + lado * Math.max(0, o - 2.9); }
    else if (fin === "ataj") { yT = GY + lado * az(0, 2.6); ky = yT; }
    else if (fin === "palo") { yT = GY + lado * ARCO; ky = GY + lado * 1.6; }
    else if (fin === "afuera") { yT = GY + lado * (ARCO + az(1.5, 4.5)); ky = GY + lado * 1.6; }
    else { yT = GY + lado * az(0, 2.5); ky = yT; }
    if (fin === "bloq" && g.Db) {
      const Db = g.Db, d = Math.max(6, Math.abs(metaX - this.ball.x));
      Db.tx = this.ball.x + dirA * 4; Db.ty = this.ball.y + (yT - this.ball.y) * (4 / d); Db.vm = 1.5;
    }
    this.patear(F, metaX, yT, vel);
    g.yT = yT; g.ky = ky; g.lado = lado; g.fase = "tiro"; g.tf = 0; g.abre = metaX; gk.vm = 1.9;
  }
  pasoTiro() {
    const g = this.g, b = this.ball, { gk, metaX, dirA, fin, D } = g;
    gk.tx = metaX - dirA * 1.3; gk.ty = clamp(g.ky, GY - ARCO - 1, GY + ARCO + 1); gk.vm = 1.9;
    const cruzo = dirA === 1 ? b.x >= metaX : b.x <= metaX, cierre = esp => { g.fase = "cierre"; g.espera = esp; g.abre = null; };
    if (fin === "bloq" && g.Db) {
      const Db = g.Db; Db.vm = 1.5;
      if (dist(b, Db) < 1.9 || (b.x - Db.x) * dirA > 1 || cruzo) {
        const a = (Math.random() < .5 ? 1 : -1) * az(.9, 1.9), c = Math.cos(a), s = Math.sin(a), vx = b.vx, vy = b.vy;
        b.vx = (vx * c - vy * s) * .3; b.vy = (vx * s + vy * c) * .3; b.lastTeam = D.idx; b.ult = Db; Db.cd = .3;
        if (cruzo) { b.x = metaX - dirA * 1; }
        cierre(.5);
      }
    } else if (fin === "gol") {
      if (cruzo) return this.golHecho();
    } else if (fin === "ataj") {
      if (dist(b, gk) < 2.1 || cruzo) { this.dar(gk); this.cartel = { txt: "¡ATAJADA!", col: D.color, t: 0, dur: 1.1 }; cierre(.6); }
    } else if (fin === "palo") {
      if (cruzo || Math.abs(b.x - metaX) < .5) {
        b.x = metaX - dirA * .7; b.vx = -dirA * az(7, 11); b.vy = (Math.random() < .5 ? -1 : 1) * az(3, 8);
        this.cartel = { txt: "¡PALO!", col: "#ffffff", t: 0, dur: 1.1 }; cierre(.9);
      }
    } else if (fin === "afuera") {
      if (cruzo && Math.abs(b.x - metaX) > 2.2) { b.vx *= .1; b.vy *= .1; cierre(.8); }
    }
    if (g.tf > 2.6 && g.fase === "tiro") {
      if (fin === "gol") { b.x = metaX + dirA; b.y = GY + g.lado * 1.5; this.golHecho(); }
      else { this.dar(gk); cierre(.3); }
    }
  }
  golHecho() {
    const g = this.g; if (!g || g.resuelto) return;
    g.resuelto = true;
    this.goles[g.T.idx]++;
    this.red = { x: g.metaX, t: 0 };
    this.cartel = { txt: "¡GOL!", col: g.T.color, t: 0, dur: 1.7 };
    if (!this.tandaOn) { this.fest = { T: g.T, D: g.D, F: g.F, t: 0 }; this.bloq = true; }
    this.g = null;
    g.listo();
  }
  pasoFesta(dt) {
    const f = this.fest;
    if ((f.t += dt) > 1.9) { this.fest = null; this.kickoff(f.D.idx); this.bloq = false; this.despertar(); }
  }
  terminar() {
    const g = this.g; if (!g) return;
    this.g = null;
    for (const p of this.todos) if (p.cd > .5) p.cd = .5;
    g.listo();
  }

  // Festejo de campeón (lo usa la cinemática): el equipo corre al centro y salta, el rival se va, cae papel picado.
  celebrar(idx = 0) {
    const T = this.eq[idx];
    this.g = null; this.fest = null; this.bloq = false; this.tandaOn = false; this.modoN = 2; this.rotularN();
    this.celeb = { T, t: 0, conf: Array.from({ length: 160 }, () => ({ x: az(-2, L + 2), y: az(-W, W), vx: az(-2, 2), vy: az(7, 15), r: az(.5, 1), c: pick([T.color, "#ffffff", "#f2c14e", T.borde]), rot: az(0, 6), w: az(-7, 7) })) };
    for (const p of this.todos) { p.cond = null; p.prot = 0; }
  }
  pasoCeleb(dt) {
    const f = this.celeb; f.t += dt;
    const b = this.ball; b.dueno = null; b.vx = b.vy = 0; b.x = L / 2; b.y = GY;
    const n = f.T.jug.length, dentro = Math.ceil(n / 2);
    f.T.jug.forEach((p, i) => {   // dos ruedas alrededor de la copa
      const ext = i % 2, k = Math.floor(i / 2), a = k / (ext ? n - dentro : dentro) * Math.PI * 2 + ext * .5, r = ext ? 11 : 5.8;
      p.tx = L / 2 + Math.cos(a) * r * 1.25; p.ty = GY + Math.sin(a) * r * .85; p.vm = 1.2;
    });
    for (const p of this.eq[f.T.idx ^ 1].jug) { p.tx = p.x; p.ty = p.y < GY ? -5 : W + 5; p.vm = .55; }
    f.T.dtp.x += (L / 2 - f.T.dtp.x) * Math.min(1, dt * 1.2); f.T.dtp.y += (GY + 2 - f.T.dtp.y) * Math.min(1, dt * 1.2);
    for (const c of f.conf) { c.x += c.vx * dt; c.y += c.vy * dt; c.rot += c.w * dt; if (c.y > W + 3) { c.y = -3; c.x = az(-2, L + 2); } }
  }

  /* ----- Dibujo ----- */
  dibujarFondo(c) {
    c.fillStyle = "#1a5a32"; c.fillRect(-MX, -MY, L + 2 * MX, W + 2 * MY);
    const n = 14, w = L / n;
    for (let i = 0; i < n; i++) { c.fillStyle = i % 2 ? "#2a8444" : "#2f8f4a"; c.fillRect(i * w, 0, w + .02, W); }
    c.strokeStyle = "rgba(255,255,255,.92)"; c.fillStyle = "rgba(255,255,255,.92)"; c.lineWidth = .28;
    c.strokeRect(0, 0, L, W);
    c.beginPath(); c.moveTo(L / 2, 0); c.lineTo(L / 2, W); c.stroke();
    c.beginPath(); c.arc(L / 2, GY, 9.15, 0, 7); c.stroke();
    c.beginPath(); c.arc(L / 2, GY, .35, 0, 7); c.fill();
    for (const s of [0, 1]) {
      const x0 = s ? L : 0, dr = s ? -1 : 1;
      c.strokeRect(s ? L - 16.5 : 0, GY - 20.16, 16.5, 40.32);
      c.strokeRect(s ? L - 5.5 : 0, GY - 9.16, 5.5, 18.32);
      c.beginPath(); c.arc(x0 + dr * 11, GY, .3, 0, 7); c.fill();
      const a = Math.acos(5.5 / 9.15);
      c.beginPath(); c.arc(x0 + dr * 11, GY, 9.15, s ? Math.PI - a : -a, s ? Math.PI + a : a); c.stroke();
      // arco con red
      c.save(); c.lineWidth = .2; c.fillStyle = "rgba(255,255,255,.14)";
      const gx = s ? L : -2.2; c.fillRect(gx, GY - ARCO, 2.2, 2 * ARCO); c.strokeRect(gx, GY - ARCO, 2.2, 2 * ARCO);
      c.lineWidth = .08; c.strokeStyle = "rgba(255,255,255,.35)"; c.beginPath();
      for (let y = GY - ARCO + .8; y < GY + ARCO; y += .8) { c.moveTo(gx, y); c.lineTo(gx + 2.2, y); }
      for (let x = .55; x < 2.2; x += .55) { c.moveTo(gx + x, GY - ARCO); c.lineTo(gx + x, GY + ARCO); }
      c.stroke(); c.restore();
      c.beginPath(); c.arc(x0, GY - ARCO, .3, 0, 7); c.arc(x0, GY + ARCO, .3, 0, 7); c.fill();
    }
    for (const [x, y, a0] of [[0, 0, 0], [L, 0, Math.PI / 2], [L, W, Math.PI], [0, W, Math.PI * 1.5]]) { c.beginPath(); c.arc(x, y, 1, a0, a0 + Math.PI / 2); c.stroke(); }
  }
  dibujar() {
    const c = this.ctx, k = this.dpr * this.s;
    c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(this.fondo, 0, 0);
    c.setTransform(k, 0, 0, k, MX * k, MY * k);
    if (this.red) {
      const x = this.red.x === 0 ? -2.2 : L;
      c.fillStyle = `rgba(255,255,255,${.5 * (1 - this.red.t / 1.3)})`; c.fillRect(x, GY - ARCO, 2.2, 2 * ARCO);
    }
    const ord = this.todos.slice().sort((a, b) => a.y - b.y), ce = this.celeb;
    for (const T of this.eq) if (T.dt) {
      const q = T.dtp;
      c.fillStyle = T.color; c.strokeStyle = T.borde; c.lineWidth = .25; c.beginPath(); c.roundRect(q.x - 1, q.y - 1, 2, 2, .6); c.fill(); c.stroke();
      c.font = "700 2px 'Barlow Condensed','Arial Narrow',sans-serif"; c.textAlign = "left"; c.lineJoin = "round"; c.lineWidth = .45;
      const t = "DT " + T.dt.split(/\s+/).slice(-1)[0]; c.strokeStyle = "rgba(0,0,0,.8)"; c.strokeText(t, q.x + 1.6, q.y + .7); c.fillStyle = "#fff"; c.fillText(t, q.x + 1.6, q.y + .7);
    }
    for (const p0 of ord) {
      const T = p0.eq, salto = ce && T === ce.T ? -Math.abs(Math.sin(this.t * 5 + p0.ph)) * 1.4 * Math.min(1, ce.t / 2) : 0;
      const p = salto ? { ...p0, y: p0.y + salto } : p0;
      c.fillStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.ellipse(p0.x + .25, p0.y + .4, RJ, RJ * .85, 0, 0, 7); c.fill();
      c.beginPath(); c.arc(p.x, p.y, RJ, 0, 7);
      c.fillStyle = p.rol === "ARQ" ? T.gk : T.color; c.fill();
      c.lineWidth = .28; c.strokeStyle = T.borde; c.stroke();
      if (p.yo) {
        c.beginPath(); c.arc(p.x, p.y, RJ + .75, 0, 7); c.lineWidth = .35; c.strokeStyle = "#f2c14e"; c.stroke();
        c.font = "700 2.3px 'Barlow Condensed','Arial Narrow',sans-serif"; c.textAlign = "center"; c.fillStyle = "#f2c14e";
        c.strokeStyle = "rgba(0,0,0,.7)"; c.lineWidth = .35; c.strokeText("VOS", p.x, p.y - RJ - 1.4); c.fillText("VOS", p.x, p.y - RJ - 1.4);
      } else if (p0.nom && this.modoN && (this.modoN === 2 || p0 === this.ball.dueno || p0 === this.receptor || (this.g && (p0 === this.g.F || p0 === this.g.carrier)))) {
        const t = p0.nom.replace(/^[A-ZÁÉÍÓÚÑ]\.\s*/, "");
        c.font = "600 2.1px 'Barlow Condensed','Arial Narrow',sans-serif"; c.textAlign = "center"; c.lineJoin = "round"; c.lineWidth = .5;
        c.strokeStyle = "rgba(0,0,0,.8)"; c.strokeText(t, p.x, p.y + RJ + 2.4); c.fillStyle = "#fff"; c.fillText(t, p.x, p.y + RJ + 2.4);
      }
    }
    if (ce) {
      for (const f of ce.conf) { c.save(); c.translate(f.x, f.y); c.rotate(f.rot); c.fillStyle = f.c; c.fillRect(-f.r, -f.r * .5, f.r * 2, f.r); c.restore(); }
      c.font = "8px 'Apple Color Emoji','Segoe UI Emoji',sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "#fff";
      c.fillText("🏆", L / 2, GY - 3 + Math.sin(this.t * 3) * .8); c.textBaseline = "alphabetic";
      return;
    }
    for (const m of this.marcas) {
      if (m.p && (m.p.eq.jug.includes(m.p))) { m.x = m.p.x; m.y = m.p.y; }
      c.fillStyle = m.c; c.fillRect(m.x - .6, m.y - RJ - 2.6, 1.2, 1.7); c.lineWidth = .12; c.strokeStyle = "rgba(0,0,0,.6)"; c.strokeRect(m.x - .6, m.y - RJ - 2.6, 1.2, 1.7);
    }
    const b = this.ball;
    c.fillStyle = "rgba(0,0,0,.3)"; c.beginPath(); c.ellipse(b.x + .3, b.y + .45, RB, RB * .8, 0, 0, 7); c.fill();
    c.beginPath(); c.arc(b.x, b.y, RB, 0, 7); c.fillStyle = "#fff"; c.fill(); c.lineWidth = .2; c.strokeStyle = "#1a1a1a"; c.stroke();
    c.beginPath(); c.arc(b.x, b.y, .3, 0, 7); c.fillStyle = "#1a1a1a"; c.fill();
    const ct = this.cartel;
    if (ct) {
      const a = Math.min(1, ct.t / .15) * Math.min(1, (ct.dur - ct.t) / .4), big = ct.txt.length <= 5;
      c.save(); c.globalAlpha = Math.max(0, a); c.textAlign = "center"; c.textBaseline = "middle";
      c.font = `400 ${big ? 12 : 7}px Anton,Impact,'Arial Narrow Bold',sans-serif`;
      c.lineWidth = .9; c.lineJoin = "round"; c.strokeStyle = "rgba(0,0,0,.75)"; c.strokeText(ct.txt, L / 2, GY);
      c.fillStyle = lum(ct.col) < .3 ? "#ffffff" : ct.col; c.fillText(ct.txt, L / 2, GY); c.restore();
    }
  }
}

export function crearCancha(host, opciones) { return new Cancha(host, opciones); }