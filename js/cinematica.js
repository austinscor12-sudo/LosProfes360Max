// Cinemática de campeón: festejo en la cancha (con los nombres de la plantilla) y entrevistas de TV al DT, a un compañero y a vos.
// Se llama desde partido.js cuando el resultado te corona campeón (Copa Argentina, liga, Selección).
import { crearCancha } from "./cancha.js";
import { INICIALES, APELLIDOS } from "./data/fuerza.js";
import { colorEquipo } from "./data/colores.js";

const pick = a => a[Math.floor(Math.random() * a.length)];
const esc = t => String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const MEDIOS = ["ESPN", "TyC Sports", "Fox Sports", "TNT Sports", "Olé"];
const PERIODISTAS = ["Martín Acosta", "Lucía Ferrero", "Diego Salvatierra", "Carolina Benítez", "Nicolás Ibarra", "Julieta Montes", "Federico Lagos", "Valeria Cortés"];

const CSS = `
.cine{position:fixed;inset:0;z-index:999;display:flex;flex-direction:column;background:radial-gradient(120% 90% at 50% 0%,#14281d,#050a07 70%);color:var(--tiza,#f2f5ef);font-family:inherit;animation:cineIn .35s ease}
@keyframes cineIn{from{opacity:0}to{opacity:1}}
.cine-top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 14px;font-family:var(--cond,"Arial Narrow",sans-serif);letter-spacing:.08em;text-transform:uppercase;font-size:.9rem}
.cine-live{color:#ff4b4b;font-weight:700}.cine-live::before{content:"";display:inline-block;width:9px;height:9px;border-radius:50%;background:#ff4b4b;margin-right:7px;animation:cineP 1s infinite}
@keyframes cineP{50%{opacity:.25}}
.cine-skip{font:inherit;color:inherit;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.25);border-radius:999px;padding:4px 14px;cursor:pointer}
.cine-stage{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:8px 14px 12px}
.cine-cancha{position:relative;width:min(100%,820px)}
.cine-cartel{position:absolute;inset:0;display:grid;place-content:center;text-align:center;pointer-events:none;text-shadow:0 3px 18px rgba(0,0,0,.85)}
.cine-cartel small{font-family:var(--cond,"Arial Narrow",sans-serif);letter-spacing:.14em;text-transform:uppercase;font-size:clamp(.8rem,2.4vw,1.1rem);color:var(--oro,#f2c14e)}
.cine-cartel b{font-family:Anton,Impact,var(--cond,sans-serif);font-weight:400;font-size:clamp(2.2rem,9vw,5.2rem);line-height:1;color:#fff;animation:cinePop .9s cubic-bezier(.2,1.6,.4,1) both}
.cine-cartel span{font-size:clamp(.9rem,2.8vw,1.3rem);margin-top:6px}
@keyframes cinePop{from{transform:scale(.2);opacity:0}to{transform:scale(1);opacity:1}}
.cine-set{display:flex;justify-content:center;gap:clamp(18px,8vw,70px);width:min(100%,640px)}
.cine-av{display:grid;justify-items:center;gap:4px;text-align:center;opacity:.45;transition:opacity .2s,transform .2s;min-width:0;max-width:44%}
.cine-av.on{opacity:1;transform:translateY(-4px)}
.cine-av i{display:grid;place-items:center;width:clamp(64px,18vw,96px);height:clamp(64px,18vw,96px);border-radius:50%;font-style:normal;font-size:clamp(1.8rem,7vw,2.8rem);background:var(--c,#243b2f);border:3px solid rgba(255,255,255,.85);box-shadow:0 8px 24px rgba(0,0,0,.5)}
.cine-av b{font-size:.95rem}.cine-av small{color:var(--gris,#9db3a5);font-size:.78rem}
.cine-burbuja{width:min(100%,640px);min-height:120px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);border-radius:18px;padding:14px 18px;box-sizing:border-box}
.cine-burbuja .quien{display:block;font-family:var(--cond,"Arial Narrow",sans-serif);letter-spacing:.08em;text-transform:uppercase;font-size:.82rem;color:var(--oro,#f2c14e);margin-bottom:4px}
.cine-burbuja p{margin:0;font-size:1.08rem;line-height:1.45}
.cine-banner{width:min(100%,640px);background:linear-gradient(90deg,var(--c,#d6202b),#0b1410);padding:6px 14px;border-radius:8px;font-family:var(--cond,"Arial Narrow",sans-serif);letter-spacing:.07em;text-transform:uppercase;font-size:.9rem;box-sizing:border-box}
.cine-bottom{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;padding:10px 14px 18px;min-height:56px}
.cine-bottom button{font:inherit;font-weight:700;color:#14110a;background:var(--oro,#f2c14e);border:0;border-radius:12px;padding:10px 20px;cursor:pointer}
.cine-bottom button.cine-op{background:rgba(255,255,255,.1);color:inherit;border:1px solid rgba(255,255,255,.3);flex:1 1 210px;max-width:320px}
.cine-fin{display:grid;gap:8px;justify-items:center;text-align:center}
.cine-fin .copa{font-size:clamp(4rem,18vw,7rem);animation:cinePop .9s cubic-bezier(.2,1.6,.4,1) both}
.cine-fin h2{margin:0;font-size:clamp(1.6rem,6vw,2.6rem)}
`;

// Detecta si el resultado te coronó campeón y devuelve { nombre: "Copa Argentina", de: "de la Copa Argentina" } (o null).
export const tituloDe = ap => {
  const t = [ap && ap.copa, ...((ap && ap.cierres) || []), ...((ap && ap.seleccion) || [])].find(x => /campe[oó]n/i.test(x || ""));
  if (!t) return null;
  const m = /campe[oó]n\s+(de(?:l)?\s+.+?)[.!]*$/i.exec(t.replace(/[¡🏆]/g, "").trim());
  if (!m) return { nombre: "el torneo", de: "del torneo" };
  const de = m[1].trim();
  return { nombre: de.replace(/^del?\s+(?:la\s+|el\s+)?/i, ""), de };
};

// o = { res, eq, rival, torneo: tituloDe(ap), plMi, plRiv, dt, yo, pos }
export function cinematica(o) {
  return new Promise(resolve => {
    if (!document.getElementById("cine-css")) { const s = document.createElement("style"); s.id = "cine-css"; s.textContent = CSS; document.head.appendChild(s); }
    const color = colorEquipo(o.eq), j = o.res.jug, gm = o.res.golesMi, gr = o.res.golesRiv, pen = o.res.penales;
    const medio = pick(MEDIOS), per = pick(PERIODISTAS), yo = o.yo;
    const root = document.createElement("div"); root.className = "cine"; root.style.setProperty("--c", color);
    root.innerHTML = `<div class="cine-top"><span class="cine-live">En vivo · ${esc(medio)}</span><button class="cine-skip" type="button">Saltar ⏭</button></div><div class="cine-stage"></div><div class="cine-bottom"></div>`;
    document.body.appendChild(root);
    const stage = root.querySelector(".cine-stage"), bottom = root.querySelector(".cine-bottom");
    let saltado = false, esperaClic = null, tipeo = null, cancha = null;

    const cerrar = () => {
      saltado = true; if (tipeo) tipeo.fin(); if (cancha) cancha.parar();
      document.removeEventListener("keydown", tecla); root.remove(); resolve();
    };
    const avanzar = () => {
      if (tipeo) return tipeo.fin();
      if (esperaClic) { const r = esperaClic; esperaClic = null; r(); }
    };
    const tecla = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); avanzar(); } else if (e.key === "Escape") cerrar(); };
    document.addEventListener("keydown", tecla);
    root.querySelector(".cine-skip").onclick = cerrar;
    root.addEventListener("click", e => { if (!e.target.closest(".cine-skip, .cine-bottom button")) avanzar(); });

    const clic = (txt = "Siguiente ▶") => new Promise(r => {
      bottom.innerHTML = `<button type="button">${txt}</button>`;
      esperaClic = r; bottom.firstChild.onclick = avanzar;
    });
    const esperar = ms => new Promise(r => setTimeout(r, ms));
    const escribir = (el, texto) => new Promise(r => {
      let i = 0; const iv = setInterval(() => { el.textContent = texto.slice(0, ++i); if (i >= texto.length) fin(); }, 16);
      const fin = () => { clearInterval(iv); el.textContent = texto; tipeo = null; r(); };
      tipeo = { fin };
    });

    // ---- Escena de entrevista ----
    const entrevista = async ({ banner, ent, lineas }) => {
      stage.innerHTML = `<div class="cine-banner">${esc(banner)}</div>
        <div class="cine-set">
          <div class="cine-av per"><i>🎤</i><b>${esc(per)}</b><small>${esc(medio)}</small></div>
          <div class="cine-av ent" style="--c:${ent.color || color}"><i>${ent.emoji}</i><b>${esc(ent.nombre)}</b><small>${esc(ent.rol)}</small></div>
        </div>
        <div class="cine-burbuja"><span class="quien"></span><p></p></div>`;
      const avs = stage.querySelectorAll(".cine-av"), quien = stage.querySelector(".quien"), txt = stage.querySelector("p");
      const decir = async (de, texto) => {
        avs[0].classList.toggle("on", de === "P"); avs[1].classList.toggle("on", de === "E");
        quien.textContent = de === "P" ? `${per} · ${medio}` : ent.nombre;
        await escribir(txt, texto); bottom.innerHTML = "";
        if (!saltado) await clic();
      };
      for (const l of lineas) {
        if (saltado) return;
        if (l.opciones) {
          avs[0].classList.remove("on"); avs[1].classList.add("on"); quien.textContent = ent.nombre; txt.textContent = "Elegí qué responder…";
          const op = await new Promise(r => {
            bottom.innerHTML = l.opciones.map((x, i) => `<button type="button" class="cine-op" data-i="${i}">${esc(x.t)}</button>`).join("");
            bottom.querySelectorAll("button").forEach(b => { b.onclick = () => r(l.opciones[+b.dataset.i]); });
          });
          if (saltado) return;
          await decir("E", op.t); if (saltado) return; await decir("P", op.r);
        } else await decir(l.de, l.t);
      }
    };

    const marcador = `${gm}-${gr}${pen ? ` (${pen.mi}-${pen.riv} en los penales)` : ""}`;
    const dtN = o.dt || "Profe", dtDe = o.dt ? o.dt : "el DT";
    const juega = j.minutos > 0;
    const hechos = j.goles > 0 ? `metió ${j.goles === 1 ? "un gol" : j.goles + " goles"}` : j.asist > 0 ? `dio ${j.asist === 1 ? "una asistencia" : j.asist + " asistencias"}` : j.figura ? "fue figura del partido" : `jugó ${j.minutos} minutos`;

    const escenas = [
      // 1) Festejo en la cancha
      async () => {
        stage.innerHTML = `<div class="cine-cancha"></div>`;
        const host = stage.querySelector(".cine-cancha");
        try { cancha = crearCancha(host, { equipo: o.eq, rival: o.rival, plMi: o.plMi, plRiv: o.plRiv, dt: o.dt, yo: o.yo, pos: o.pos, rol: juega ? "Titular" : "Suplente", limpio: true }); cancha.celebrar(0); }
        catch (err) { console.error(err); cancha = null; }
        const c = document.createElement("div"); c.className = "cine-cartel";
        c.innerHTML = `<small>${esc(o.torneo.nombre)}</small><b>¡CAMPEONES!</b><span>${esc(o.eq)}</span>`;
        host.appendChild(c);
        await Promise.race([esperar(9000), clic("Ir a las entrevistas ▶")]);
        if (cancha) { cancha.parar(); cancha = null; }
      },
      // 2) El DT
      () => entrevista({
        banner: `Entrevista · ${o.dt || "El DT"} · ${o.eq}`, ent: { nombre: o.dt || "El DT", rol: `DT de ${o.eq}`, emoji: "🧢" },
        lineas: [
          { de: "P", t: `${dtN}, ¡campeones ${o.torneo.de}! ¿Qué se siente?` },
          { de: "E", t: pick(["Una felicidad enorme. Este grupo trabajó todo el año para esto y hoy se lo lleva la gente.", "Estoy muy orgulloso de los muchachos. Nunca dejaron de creer, ni en los momentos difíciles.", "Es un día para disfrutar. Se lo dedico a toda la institución, que lo esperaba hace mucho."]) },
          { de: "P", t: `${o.rival} no lo puso fácil. ¿Cómo se vivió ese ${marcador} desde afuera?` },
          { de: "E", t: pen ? pick(["Los penales son una lotería, pero lo trabajamos. Confié en los chicos y en el arquero, y respondieron.", "Se sufre muchísimo desde el banco. Después de los penales, el abrazo es lo único que importa."])
            : Math.abs(gm - gr) >= 3 ? "Fue un partido contundente, pero no nos relajamos nunca. Respeto mucho a " + o.rival + "."
            : pick(["Fue un partido de mucho carácter. Cuando se juega una final, lo importante es llegar con la cabeza fría.", "Sufrimos, claro, pero el equipo supo sostener el resultado. Eso habla de este plantel."]) },
          juega
            ? { de: "P", t: `Hablemos de ${yo}: hoy ${hechos}. ¿Qué le dice?` }
            : { de: "P", t: `Hubo chicos que hoy no tuvieron minutos, como ${yo}. ¿Qué les dice?` },
          { de: "E", t: juega
            ? (j.figura || j.goles > 0 ? `${yo} fue determinante. Tiene hambre y personalidad, y los chicos así se ganan un lugar.` : j.nota >= 6.8 ? `${yo} cumplió con lo que le pedimos. Está creciendo y eso me pone contento.` : `A ${yo} le costó, pero es parte del grupo y lo banco. Una final no le quita nada.`)
            : `${yo} es parte de esto. En un campeonato se gana entre todos, y los que no juegan sostienen al grupo en la semana.` },
          { de: "P", t: "Último mensaje para la gente." },
          { de: "E", t: pick(["Gracias por el aguante. Esta copa es de ustedes. ¡A seguir trabajando!", "A disfrutar esta noche. Mañana nos vemos de nuevo, porque queremos más."]) }
        ]
      }),
      // 3) Un compañero
      () => {
        const nom = (o.plMi && o.plMi.jugadores.length ? pick(o.plMi.jugadores.slice(0, 11).filter(x => x.p !== "ARQ")).c : `${pick(INICIALES)}. ${pick(APELLIDOS)}`);
        return entrevista({
          banner: `Entrevista · ${nom} · ${o.eq}`, ent: { nombre: nom, rol: `Jugador de ${o.eq}`, emoji: "⚽" },
          lineas: [
            { de: "P", t: `Estamos con ${nom}, uno de los pilares de este plantel. ¿Cómo te sentís?` },
            { de: "E", t: pick(["Todavía no lo puedo creer. Veníamos soñando con esto desde que arrancó el año.", "Estoy feliz, muy feliz. Se lo debíamos a la gente.", "Es increíble. Hay que disfrutarlo, porque estas cosas no pasan todos los días."]) },
            { de: "P", t: "¿Qué fue lo clave para llegar hasta acá?" },
            { de: "E", t: pick(["El grupo. Acá nadie se cree más que nadie, y eso se nota en la cancha.", "Trabajar todos los días. El DT nos pidió humildad y sacrificio y lo cumplimos.", "Nunca dejamos de creer, ni cuando el partido se puso cuesta arriba."]) }
          ]
        });
      },
      // 4) Vos
      () => entrevista({
        banner: `Entrevista · ${yo} · ${o.eq}`, ent: { nombre: yo, rol: "Tu jugador", emoji: "⭐", color: "#8a6a10" },
        lineas: [
          { de: "P", t: `Y con nosotros, ${yo}, ${juega ? "que fue parte de la final" : "que acompañó desde el plantel"}. ¿Cómo te sentís?` },
          { opciones: [
            { t: "Muy feliz. Es un sueño cumplido.", r: "¡Se te nota en la cara! Un sueño de pibe, sin dudas." },
            { t: "Esto es de todo el grupo.", r: "Humildad ante todo. Eso habla muy bien de vos." },
            { t: "Quiero más. Esto recién empieza.", r: "¡Ambición! Así se construyen las carreras grandes." }
          ] },
          { de: "P", t: "¿A quién se lo dedicás?" },
          { opciones: [
            { t: "A mi familia, que siempre estuvo.", r: "Seguro están llorando frente al televisor. ¡Un abrazo grande para ellos!" },
            { t: "A la gente que nos bancó todo el año.", r: "La hinchada se lo merece, no hay dudas." },
            { t: "A los que dudaron.", r: "¡Con picante! Mañana vas a dar que hablar en todos los programas." }
          ] },
          { de: "P", t: `Gracias, ${yo}. ¡Felicitaciones, campeón!` }
        ]
      }),
      // 5) Cierre
      async () => {
        stage.innerHTML = `<div class="cine-fin"><div class="copa">🏆</div><h2>${esc(o.eq)}</h2><p>Campeón ${esc(o.torneo.de)}</p></div>`;
        await clic("Ver resumen del partido ▶");
      }
    ];

    (async () => {
      try { for (const e of escenas) { if (saltado) break; await e(); } }
      catch (err) { console.error(err); }
      if (!saltado) cerrar();
    })();
  });
}