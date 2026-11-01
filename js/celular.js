// Celular del jugador: mensajes, noticias e Instagram. La fama (seguidores) crece según cómo te vaya.
import { LIGAS } from "./data/equipos.js";
import { ir, estado, aviso } from "./router.js";
import { esc } from "./util.js";
import { guardarTodo } from "./firebase.js";
import { tiene } from "./finanzas.js";
import { equiposLigaEsp } from "./espana.js";

const ent = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = a => a[Math.floor(Math.random() * a.length)];
const NIVELES = [[0, "Desconocido"], [10000, "Promesa"], [50000, "Conocido"], [250000, "Figura"], [1000000, "Estrella"], [5000000, "Ídolo"]];
const HITOS = [10000, 50000, 100000, 250000, 500000, 1000000, 2500000, 5000000];
const MEDIOS = ["ESPN", "TyC Sports", "Olé", "Fox Sports", "TNT Sports"];
const lim = (n, a, b) => Math.max(a, Math.min(b, n));
const ICONO_OP = { prensa: "🎙️", hinchada: "👥", familia: "👪" };
export const nivelFama = s => { let i = 0; NIVELES.forEach(([m], k) => { if (s >= m) i = k; }); return { nombre: NIVELES[i][1], min: NIVELES[i][0], sig: NIVELES[i + 1]?.[0] || null }; };
export const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(1).replace(".", ",") + " M" : n >= 1e4 ? Math.round(n / 1000) + " K" : n.toLocaleString("es-AR");
export const nuevoCelular = p => { const s = Math.round(800 * Math.pow(1.12, Math.max(0, p.progreso.overall - 40))); return { seguidores: s, sem: 0, publicado: -1, equipo: p.equipo, hito: 0, prensa: 50, msgs: [], noticias: [], posts: [], ops: [], hist: [s] }; };
export const noLeidos = p => (p.celular?.msgs || []).filter(m => !m.leido).length;
const cel = p => p.celular || (p.celular = nuevoCelular(p));

// Se llama después de cada partido: genera mensajes, noticias y posts, y hace crecer (o no) tu fama.
export function generarCelular(p, m, res, out) {
  const c = cel(p), j = res.jug, gm = res.golesMi, gr = res.golesRiv, ap = p.jugador.apellido, rival = m.rival;
  const jugo = j.minutos > 0, gano = gm > gr, perdio = gm < gr, azar = n => Math.random() < n;
  const titulo = out.cierres.some(x => x.includes("Campeón")) || (out.copa || "").includes("Campeón");
  c.sem++;
  const msg = (de, icono, txt) => c.msgs.unshift({ de, icono, txt, sem: c.sem, leido: false });
  const nota = (txt, tipo = "tuyo") => c.noticias.unshift({ medio: pick(MEDIOS), txt, tipo, sem: c.sem });

  // Mensajes
  if (jugo && (j.figura || j.nota >= 8)) msg("Entrenador", "🧢", pick([`Gran partido, ${ap}. Así se juega.`, "Partidazo. Te ganaste la confianza, seguí así."]));
  else if (!jugo && azar(.4)) msg("Entrenador", "🧢", "Hoy no entraste, pero te vi bien en los entrenamientos. Tu momento va a llegar.");
  else if (jugo && j.nota < 5.5) msg("Entrenador", "🧢", "No fue tu tarde. Mañana a trabajar y a levantar cabeza.");
  if (j.roja) msg("Entrenador", "🧢", "Esa roja nos costó caro. Mañana hablamos.");
  if (j.goles >= 2) msg("Plantel", "👥", "¡Doblete! Esta semana el asado lo invitás vos 🥩");
  else if (j.goles === 1) msg("Plantel", "👥", `🔥 ¡Qué golazo, ${ap}!`);
  else if (gano && azar(.3)) msg("Plantel", "👥", "¡Ganamos! Todos al asado 🍖");
  else if (perdio && azar(.3)) msg("Plantel", "👥", "No bajemos los brazos, chicos. Vamos que sigue.");
  if (out.lesion) { msg("Plantel", "👥", `Recuperate rápido, ${ap}. Te esperamos 🙏`); msg("Mamá", "👩", "Hijo, cuidate mucho. ¿Necesitás algo?"); }
  else if (azar(.12)) msg("Mamá", "👩", pick(["¿Comiste bien? Te vi muy flaco en la tele.", "Lo vimos toda la familia. Estamos muy orgullosos."]));
  if (titulo) { msg("Plantel", "👥", "¡¡CAMPEONES!! 🏆🏆"); msg("Representante", "💼", "Con este título tu pase vale mucho más. Hay que aprovecharlo."); }

  // Noticias sobre vos
  if (j.goles >= 2) nota(`${ap} la rompió: ${j.goles} goles ante ${rival}`);
  else if (j.figura) nota(`${ap}, figura de la cancha en el duelo con ${rival}`);
  else if (jugo && j.nota < 5) nota(`Cuestionan a ${ap} tras su floja actuación frente a ${rival}`);
  if (out.lesion) nota(`Mala noticia para ${p.equipo}: ${ap} se pierde ${out.lesion.total} partido${out.lesion.total === 1 ? "" : "s"} por ${out.lesion.nombre.toLowerCase()}`);
  if (titulo) nota(`${p.equipo} festeja: ${ap} levantó la copa`);
  const t = p.temp; if (t.partidos >= 5 && t.notaSuma / t.partidos >= 7 && azar(.25)) nota(`Los analistas coinciden: ${ap} vive su mejor momento`);
  // Noticias de otros equipos
  const eqs = (equiposLigaEsp(p) || LIGAS.find(l => l.id === p.liga)?.equipos || []).filter(e => e !== p.equipo);
  if (eqs.length > 2) for (let i = 0; i < 2; i++) {
    const A = pick(eqs), B = pick(eqs.filter(e => e !== A));
    nota(pick([`${A} golea y se ilusiona con pelear arriba`, `Crisis en ${A}: el DT, en la cuerda floja`, `${A} refuerza el plantel con un delantero de 22 años`, `Polémica en ${A}: los hinchas piden cambios`, `${A} y ${B} se miden en un clásico caliente`, `Los periodistas debaten: ¿es ${A} candidato este año?`, `Mercado de pases: ${B} sigue de cerca a figuras de la liga`]), "liga");
  }

  // Opiniones de periodistas, hinchas y familia
  if (!c.ops) { c.ops = []; c.prensa = 50; }
  const prom = t.partidos ? t.notaSuma / t.partidos : 6.2;
  const bien = jugo && (j.goles > 0 || j.figura || j.nota >= 7.5), mal = (jugo && j.nota < 5.5) || j.roja, tono = bien ? 1 : mal ? -1 : 0;
  const op = (tipo, fuente, txt, tn = tono) => c.ops.unshift({ tipo, fuente, txt, tono: tn, sem: c.sem });
  const prensa = pick(MEDIOS), hincha = pick(["@lahinchada", "@el_tribunero", "@pasion_del_tablon", "@bombo_y_trapo", "@socio_de_toda_la_vida"]);
  if (azar(.85)) {
    if (!jugo) op("prensa", prensa, `${ap} sigue esperando su oportunidad: ¿por qué no juega?`, 0);
    else if (bien) op("prensa", prensa, pick([`Hoy el mejor de ${p.equipo} fue ${ap}, sin discusión`, `Cada vez que la toca ${ap}, se le ilumina el juego a ${p.equipo}`, `${ap} está en un gran momento y empieza a hacer ruido`]));
    else if (mal) op("prensa", prensa, pick([`${ap} no estuvo a la altura y el equipo lo sintió`, `Preocupa el nivel de ${ap}: ¿convendrá darle un descanso?`, `Tarde para el olvido de ${ap} frente a ${rival}`]));
    else op("prensa", prensa, pick([`Partido discreto de ${ap}, sin pena ni gloria`, `${ap} cumplió, pero el equipo necesita más de él`]), 0);
  }
  if (t.partidos >= 5 && azar(.2)) op("prensa", pick(MEDIOS), prom >= 7 ? `${ap} es, por ahora, uno de los jugadores de la temporada` : prom < 6 ? `${ap} lleva varios partidos por debajo de lo esperado` : `${ap} alterna buenas y malas: ¿le falta regularidad?`, prom >= 7 ? 1 : prom < 6 ? -1 : 0);
  if (nivelFama(c.seguidores).min >= 250000 && azar(.2)) op("prensa", pick(MEDIOS), `El debate de la mesa: ¿${ap} ya es de los mejores de la liga?`, 1);
  if (p.jugador.edad <= 21 && bien && azar(.4)) op("prensa", pick(MEDIOS), `La joya que todos quieren: ${ap} ilusiona a ${p.equipo}`, 1);
  if (azar(.9)) op("hinchada", hincha, bien ? pick([`¡Que no se vaya nunca ${ap}! 👏`, `Este pibe es el futuro del club`, `${ap} hoy jugó un partidazo 🔥`]) : mal ? pick([`${ap} está para el banco, no da más`, `Cada partido peor, ${ap} no me convence`, `Hay que bancarlo, el hincha está en las buenas y en las malas`]) : gano ? "Ganamos y es lo que importa 🙌" : perdio ? "Muy flojo el equipo hoy, qué bronca" : "Un puntito y a seguir");
  if (azar(.6)) op("familia", pick(["Papá", "Hermano", "Abuela", "Mamá"]), bien ? pick([`Hoy te vi en la tele y me emocioné 🥹`, `Sos un crack, ya le conté a todo el barrio que sos mi familia 😎`, `¡Qué orgullo, ${p.jugador.nombre}!`]) : mal ? pick([`Un mal día lo tiene cualquiera. Mañana será otro.`, `No les hagas caso a los que critican. Seguí trabajando.`, `Comé bien y descansá, que ya vas a levantar.`]) : pick([`Lo vimos toda la familia. ¡Te queremos!`, `Cuidate mucho, ¿sí?`]));
  c.prensa = lim(Math.round(c.prensa + tono * 4 + (50 - c.prensa) * .05), 0, 100);
  c.ops.length = Math.min(c.ops.length, 60);

  // Fama: crecimiento de seguidores según tu rendimiento
  let g = (jugo ? (j.nota - 6.3) * .6 : -.2) + j.goles * 1.2 + j.asist * .6 + (j.figura ? 2 : 0) + (gano ? .4 : perdio ? -.2 : 0) + (titulo ? 15 : 0) + (j.roja ? -1 : 0) + ((c.prensa ?? 50) - 50) * .02;
  if (c.equipo !== p.equipo) { g += 12; msg("Representante", "💼", `Nuevo club, nuevos desafíos: ${p.equipo}. Tus seguidores están creciendo.`); nota(`${ap} ya es jugador de ${p.equipo}`); c.equipo = p.equipo; }
  c.seguidores = Math.max(200, Math.round(c.seguidores * (1 + g / 100)) + ent(0, 30));
  while (c.hito < HITOS.length && c.seguidores >= HITOS[c.hito]) { msg("Representante", "💼", `¡Pasaste los ${fmt(HITOS[c.hito])} de seguidores! Las marcas empiezan a mirarte.`); c.hito++; }
  if (j.goles || j.figura || titulo) c.posts.unshift({ de: p.equipo + " oficial", txt: titulo ? `🏆 ¡CAMPEONES! Gracias ${ap}` : `${j.goles ? "⚽".repeat(Math.min(j.goles, 3)) + " " : "⭐ "}${ap}, protagonista ante ${rival}`, likes: Math.round(c.seguidores * (.04 + Math.random() * .03)), sem: c.sem, club: true });
  c.hist.push(c.seguidores);
  c.msgs.length = Math.min(c.msgs.length, 40); c.noticias.length = Math.min(c.noticias.length, 30); c.posts.length = Math.min(c.posts.length, 30); c.hist = c.hist.slice(-40);
}

const PUBS = {
  partido: { icono: "📸", nombre: "Foto del partido", txt: "Gran equipo. A seguir creciendo 💪" },
  entreno: { icono: "🏋️", nombre: "Entrenando", txt: "Trabajando duro, sin descanso 🔥" },
  hinchas: { icono: "🙏", nombre: "Agradecer a los hinchas", txt: "Gracias por el aguante de siempre ❤️" },
  auto: { icono: "🚗", nombre: "Mostrar el auto", txt: "Cumpliendo sueños 🚗✨", req: p => tiene(p, "auto") },
  casa: { icono: "🏡", nombre: "Mostrar la casa", txt: "Home sweet home 🏡", req: p => tiene(p, "casa") },
  chicana: { icono: "😈", nombre: "Chicanear al rival", txt: "Se vienen cosas lindas… 😏", riesgo: true }
};
function publicar(p, id) {
  const c = cel(p), b = PUBS[id];
  if (c.publicado === c.sem) return "Ya publicaste esta semana: esperá al próximo partido";
  let likes = Math.round(c.seguidores * (.03 + Math.random() * .05) * Math.max(.5, 1 + (p.forma - 60) / 100)), g = ent(2, 8) / 10, txt = b.txt;
  if (b.riesgo) {
    if (Math.random() < .5) { g = ent(15, 35) / 10; likes = Math.round(likes * 1.6); }
    else { g = -ent(5, 15) / 10; likes = Math.round(likes * .6); c.msgs.unshift({ de: "Entrenador", icono: "🧢", txt: "Dejá las polémicas para afuera de la cancha, ¿sí?", sem: c.sem, leido: false }); }
  }
  c.seguidores = Math.max(200, Math.round(c.seguidores * (1 + g / 100)));
  c.posts.unshift({ de: "Vos", txt, likes, sem: c.sem, club: false }); c.publicado = c.sem; c.hist[c.hist.length - 1] = c.seguidores;
  return null;
}

export function pantallaCelular(el) {
  const p = estado.partida, c = cel(p);
  let tab = estado.tabCel || "msgs";
  const guardar = () => guardarTodo(estado.user.uid, p).catch(e => aviso("No se pudo guardar: " + (e.code || e.message)));
  const item = (t, s, d) => `<div class="item"><div><b>${t}</b><br><small class="sub">${s}</small></div><span class="sub">${d}</span></div>`;
  const msgs = () => c.msgs.length ? c.msgs.map(m => item(`${m.icono} ${esc(m.de)}${m.leido ? "" : " 🔵"}`, esc(m.txt), "Sem " + m.sem)).join("") : `<p class="sub">Todavía no tenés mensajes. Jugá partidos y vas a empezar a recibirlos.</p>`;
  const noticias = () => c.noticias.length ? c.noticias.map(n => item(esc(n.txt), `${esc(n.medio)}${n.tipo === "liga" ? " · Liga" : ""}`, "Sem " + n.sem)).join("") : `<p class="sub">Sin noticias por ahora.</p>`;
  const ops = () => {
    const pr = c.prensa ?? 50, lab = pr >= 65 ? "Elogiosa" : pr <= 35 ? "Crítica" : "Dividida";
    return `<div class="panel" style="margin-bottom:12px"><h2>Imagen en la prensa: ${lab}</h2><div class="barra ${pr <= 35 ? "mala" : ""}"><i style="width:${pr}%"></i></div><small class="sub">Lo que se dice de vos también influye en cuánto crece tu fama.</small></div>`
      + ((c.ops || []).length ? c.ops.map(o => item(`${ICONO_OP[o.tipo]} ${esc(o.fuente)} ${o.tono > 0 ? "👍" : o.tono < 0 ? "👎" : ""}`, esc(o.txt), "Sem " + o.sem)).join("") : `<p class="sub">Todavía nadie opina de vos. Jugá partidos y vas a empezar a escuchar a la prensa, los hinchas y tu familia.</p>`);
  };
  const insta = () => {
    const nf = nivelFama(c.seguidores), mn = Math.min(...c.hist), mx = Math.max(...c.hist), prog = nf.sig ? Math.round((c.seguidores - nf.min) / (nf.sig - nf.min) * 100) : 100;
    const libre = c.publicado !== c.sem;
    return `<div class="stats"><div class="stat"><b>${fmt(c.seguidores)}</b><span>Seguidores</span></div><div class="stat"><b>${nf.nombre}</b><span>Fama</span></div><div class="stat"><b>${c.posts.filter(x => !x.club).length}</b><span>Posts tuyos</span></div></div>
      <div class="panel" style="margin-bottom:12px"><div class="barra"><i style="width:${prog}%"></i></div><small class="sub">${nf.sig ? `Próximo nivel: ${fmt(nf.sig)} seguidores` : "Máximo nivel de fama"}</small>
        <div style="display:flex;align-items:flex-end;gap:2px;height:48px;margin-top:8px">${c.hist.map(v => `<i style="flex:1;background:#4ade80;height:${Math.round((v - mn) / ((mx - mn) || 1) * 80 + 20)}%"></i>`).join("")}</div></div>
      <div class="panel" style="margin-bottom:12px"><h2>Publicar</h2><p class="sub">${libre ? "Podés subir una publicación por semana." : "Ya publicaste esta semana."}</p>
        <div class="grid" id="pubs">${Object.entries(PUBS).filter(([, b]) => !b.req || b.req(p)).map(([id, b]) => `<button class="card" data-p="${id}" ${libre ? "" : "disabled"}><b>${b.icono} ${b.nombre}</b>${b.riesgo ? "<small>Arriesgado: puede salir bien o mal</small>" : ""}</button>`).join("")}</div></div>
      ${c.posts.length ? c.posts.map(x => item(`${esc(x.de)}`, esc(x.txt), `❤️ ${fmt(x.likes)}`)).join("") : `<p class="sub">Todavía no hay publicaciones.</p>`}`;
  };
  const pintar = () => {
    const html = tab === "msgs" ? msgs() : tab === "noticias" ? noticias() : tab === "ops" ? ops() : insta();
    el.innerHTML = `<h2>📱 Celular</h2><p class="sub">${esc(p.jugador.nombre)} ${esc(p.jugador.apellido)} · ${esc(p.equipo)}</p>
      <div class="tabs"><button class="tab" data-t="msgs">💬 Mensajes</button><button class="tab" data-t="noticias">📰 Noticias</button><button class="tab" data-t="ops">🗣️ Opiniones</button><button class="tab" data-t="insta">📷 Instagram</button></div>${html}
      <div class="fila"><button class="btn" id="atras">Volver</button></div>`;
    if (tab === "msgs" && c.msgs.some(m => !m.leido)) { c.msgs.forEach(m => m.leido = true); guardar(); }
    el.querySelectorAll(".tab").forEach(t => t.classList.toggle("sel", t.dataset.t === tab));
    el.querySelector(".tabs").onclick = e => { const t = e.target.closest(".tab"); if (!t) return; tab = estado.tabCel = t.dataset.t; pintar(); };
    el.querySelector("#atras").onclick = () => ir("carrera");
    const pubs = el.querySelector("#pubs");
    if (pubs) pubs.onclick = e => { const b = e.target.closest("[data-p]"); if (!b || b.disabled) return; const err = publicar(p, b.dataset.p); aviso(err || "Publicado"); if (!err) guardar(); pintar(); };
  };
  pintar();
}
