// Vida personal: vivienda, vínculos, tarde libre y eventos con decisiones (vestuario, DT, prensa, agentes, inversiones).
import { ir, estado, aviso } from "./router.js";
import { esc } from "./util.js";
import { guardarTodo } from "./firebase.js";

const usd = n => "USD " + Math.round(n).toLocaleString("es-AR");
const azar = n => Math.random() < n;
const pick = a => a[Math.floor(Math.random() * a.length)];
const lim = n => Math.max(0, Math.min(100, n));
const ajustar = (v, d) => { for (const k in d) v[k] = lim(v[k] + d[k]); };
const base = p => Math.max(1500, p.contrato?.salario || 0);
const prensa = (p, n) => { if (p.celular) p.celular.prensa = lim((p.celular.prensa ?? 50) + n); };
const seguidores = (p, pct) => { if (p.celular) p.celular.seguidores = Math.max(200, Math.round(p.celular.seguidores * (1 + pct / 100))); };
const msg = (p, de, icono, txt) => { const c = p.celular; if (c) c.msgs.unshift({ de, icono, txt, sem: c.sem, leido: false }); };

export const nuevaVida = () => ({ felicidad: 60, vestuario: 60, dt: 50, amigos: 60, pareja: null, vivienda: "pension", agente: "papá", evento: null, tarde: 0, sem: 0, novatada: false, tiburon: false, capitan: false, log: [] });
export const asegurarVida = p => p.vida || (p.vida = nuevaVida());
export const vidaPendiente = p => { const v = asegurarVida(p); return (v.evento ? 1 : 0) + (v.tarde < v.sem ? 1 : 0); };

// Eventos: cada opción es [texto, función(p, v) → resultado].
const EVENTOS = {
  novatada: { t: "🎤 La novatada del debut", d: () => "Es tu debut y los veteranos te hacen cantar en la cena y te cortan el pelo. ¿Cómo reaccionás?", o: [
    ["Reírte y cantar con ganas", (p, v) => { ajustar(v, { vestuario: 12, felicidad: 3 }); return "Te ganaste a los veteranos. ¡Buena química en el vestuario!"; }],
    ["Enojarte y negarte", (p, v) => { ajustar(v, { vestuario: -12, felicidad: -5 }); return "Los veteranos te miraron mal. Primer roce en el vestuario."; }]] },
  charla_dt: { t: "🧢 Charla con el DT", d: () => "El DT te llama a su oficina: «En el segundo tiempo entrás y congelás el partido. ¿Me entendés?»", o: [
    ["Cumplir lo que te pide", (p, v) => { ajustar(v, { dt: 10, vestuario: 2 }); return "El DT valora tu disciplina."; }],
    ["Hacer lo tuyo igual", (p, v) => { if (azar(.4)) { ajustar(v, { dt: 4 }); seguidores(p, 1.5); return "Te salió bien y hasta el DT sonrió."; } ajustar(v, { dt: -12 }); return "Desobedeciste y al DT no le gustó nada."; }]] },
  prensa_mal: { t: "🎙️ Rueda de prensa", d: () => "Después del mal partido, los periodistas te esperan con preguntas difíciles. ¿Qué respondés?", o: [
    ["Asumir la responsabilidad", (p, v) => { prensa(p, 6); ajustar(v, { vestuario: 3, dt: 2 }); return "Valoraron tu humildad."; }],
    ["Culpar al árbitro", (p, v) => { prensa(p, -8); ajustar(v, { vestuario: 4 }); return "La hinchada quedó dividida."; }],
    ["Culpar a tus compañeros", (p, v) => { prensa(p, -3); ajustar(v, { vestuario: -14 }); return "Tus compañeros se enteraron. Clima pesado."; }]] },
  agente: { t: "🦈 Un agente poderoso", d: () => "Un agente de peso te promete contratos millonarios si presionás para irte del club. Hoy te maneja tu papá.", o: [
    ["Escucharlo y presionar al club", (p, v) => { p.ahorros = (p.ahorros || 0) + base(p) * 2; v.agente = "tiburón"; ajustar(v, { dt: -15, vestuario: -8 }); return "Cobraste un adelanto, pero en el club no cayó bien."; }],
    ["Quedarte con tu viejo", (p, v) => { ajustar(v, { felicidad: 4, dt: 3 }); return "Confianza total, aunque con pocos contactos."; }]] },
  estafa: { t: "💸 Negocio «seguro»", d: () => "Un conocido te propone invertir en un negocio que «te duplica la plata».", o: [
    ["Invertir el 30% de tus ahorros", p => { const m = Math.round((p.ahorros || 0) * .3); if (azar(.5)) { p.ahorros += m; return `¡Salió bien! Ganaste ${usd(m)}.`; } p.ahorros -= m; return `Era una estafa. Perdiste ${usd(m)}.`; }],
    ["Consultarlo con tu contador", (p, v) => { ajustar(v, { felicidad: 1 }); return "Tu contador te advirtió que era muy riesgoso. Te la salvaste."; }],
    ["Rechazarlo", () => "Mejor no mezclar el fútbol con negocios dudosos."]] },
  fiesta: { t: "🥂 Fiesta en la mansión", d: () => "Tus compañeros quieren hacer una fiesta en tu mansión.", o: [
    ["Hacerla", (p, v) => { ajustar(v, { felicidad: 10, vestuario: 8, amigos: 4 }); if (azar(.3)) { prensa(p, -10); return "Fiestón épico… pero la prensa se enteró."; } return "Fiestón épico. Nadie se enteró."; }],
    ["Mejor no", (p, v) => { ajustar(v, { dt: 2 }); return "El DT valoró tu profesionalismo."; }]] },
  amigos: { t: "🍖 Asado en el barrio", d: () => "Tus amigos de la infancia te invitan a un asado, como siempre.", o: [
    ["Ir", (p, v) => { ajustar(v, { amigos: 12, felicidad: 6 }); p.fatiga = Math.min(100, p.fatiga + 5); return "Te mantienen con los pies en la tierra. ¡Gran asado!"; }],
    ["Excusarte con el entrenamiento", (p, v) => { ajustar(v, { amigos: -10, dt: 2 }); return "Tus amigos se sintieron un poco dejados de lado."; }]] },
  pareja: { t: "💘 Conocés a alguien", d: () => "Tu vida social cambió con la fama. ¿Con quién te vinculás?", o: [
    ["Tu novia de toda la vida", (p, v) => { v.pareja = "novia"; ajustar(v, { felicidad: 8, amigos: 4 }); return "Te apoya en todo y te mantiene con los pies en la tierra."; }],
    ["Una modelo que te escribió", (p, v) => { v.pareja = "modelo"; seguidores(p, 8); ajustar(v, { felicidad: 4, dt: -3 }); return "Tu fama explotó, pero la agenda se complica y perdés algo de foco."; }],
    ["Seguir solo", (p, v) => { ajustar(v, { dt: 2 }); return "Te concentrás en tu carrera."; }]] }
};

export function generarVida(p, m, res) {
  const v = asegurarVida(p), j = res.jug, jugo = j.minutos > 0, c = p.celular, gm = res.golesMi, gr = res.golesRiv;
  v.sem++;
  if (v.vivienda === "alquiler") p.ahorros = Math.max(0, (p.ahorros || 0) - Math.round(base(p) * .1));
  ajustar(v, { felicidad: (v.vivienda === "pension" ? -.4 : v.vivienda === "mansion" ? .4 : 0) + (gm > gr ? .6 : gm < gr ? -.6 : 0) + (v.pareja === "novia" ? .3 : 0), vestuario: (60 - v.vestuario) * .03 });
  if (v.pareja === "modelo" && azar(.08)) { msg(p, "Representante", "💼", "Tu relación con la modelo salió en una tapa. Más fama, menos foco."); seguidores(p, 1.5); ajustar(v, { dt: -2 }); }
  if (v.vestuario < 35 && azar(.3)) msg(p, "Plantel", "👥", "Nadie te pasa la pelota… algo pasa en el vestuario.");
  if (v.dt <= 20 && azar(.3)) msg(p, "Entrenador", "🧢", "Por ahora no estás en mis planes. Tenés que demostrarlo.");
  if (!v.capitan && v.dt >= 85 && v.vestuario >= 70 && p.progreso.partidos >= 15 && azar(.3)) { v.capitan = true; msg(p, "Entrenador", "🧢", "Desde hoy sos el capitán del equipo."); c?.noticias.unshift({ medio: "ESPN", txt: `${p.jugador.apellido}, nuevo capitán de ${p.equipo}`, tipo: "tuyo", sem: c.sem }); }
  if (v.evento) return;
  const mal = (jugo && j.nota < 5.5) || j.roja, ah = p.ahorros || 0, seg = c?.seguidores || 0;
  if (!v.novatada && jugo && p.progreso.partidos === 1) { v.novatada = true; v.evento = "novatada"; }
  else if (mal && azar(.5)) v.evento = "prensa_mal";
  else if (azar(.12)) {
    const ok = ["charla_dt", "amigos"];
    if (!v.pareja && seg >= 15000) ok.push("pareja");
    if (!v.tiburon && seg >= 30000) ok.push("agente");
    if (ah > base(p) * 20) ok.push("estafa");
    if (v.vivienda === "mansion") ok.push("fiesta");
    v.evento = pick(ok); if (v.evento === "agente") v.tiburon = true;
  }
}

const TARDES = {
  entreno: { icono: "🏋️", nombre: "Entrenar extra", desc: "Más experiencia en tu atributo de foco, pero cansa.", f: (p, v) => { p.xp[p.plan.foco] = (p.xp[p.plan.foco] || 0) + 12; p.fatiga = Math.min(100, p.fatiga + 8); return "Sumaste experiencia de entrenamiento."; } },
  descanso: { icono: "😴", nombre: "Descansar", desc: "Recuperás energía.", f: (p, v) => { p.fatiga = Math.max(0, p.fatiga - 15); ajustar(v, { felicidad: 2 }); return "Te sentís recuperado."; } },
  fiesta: { icono: "🎉", nombre: "Salir de fiesta con amigos", desc: "Sube la felicidad, pero la prensa puede descubrirte.", f: (p, v) => { ajustar(v, { felicidad: 12, amigos: 3 }); p.fatiga = Math.min(100, p.fatiga + 10); if (azar(.35)) { prensa(p, -10); ajustar(v, { dt: -4 }); msg(p, "Entrenador", "🧢", "Vi las fotos de anoche. Hablamos."); return "Te sacaron fotos saliendo de un boliche. Escándalo."; } return "Noche inolvidable y sin cámaras."; } },
  benefico: { icono: "❤️", nombre: "Evento benéfico", desc: "Sube tu reputación y tus seguidores.", f: (p, v) => { prensa(p, 6); seguidores(p, 1.5); ajustar(v, { felicidad: 3 }); return "La prensa elogió tu gesto solidario."; } }
};
const VIVIENDAS = { pension: ["🛏️", "Pensión del club", "Gratis, pero sin privacidad: la felicidad baja de a poco."], alquiler: ["🏢", "Departamento alquilado", "Pagás el 10% de tu sueldo por semana."], mansion: ["🏰", "Mansión", "Sube la felicidad y desbloquea las fiestas."] };
const costoMansion = p => Math.round(base(p) * 80 / 100) * 100;

export function pantallaVida(el) {
  const p = estado.partida, v = asegurarVida(p);
  const guardar = () => guardarTodo(estado.user.uid, p).catch(e => aviso("No se pudo guardar: " + (e.code || e.message)));
  const barra = (n, val, malo) => `<div class="attr"><span>${n}</span><div class="barra ${malo ? "mala" : ""}"><i style="width:${Math.round(val)}%"></i></div><b>${Math.round(val)}</b></div>`;
  const item = (t, s, b) => `<div class="item"><div><b>${t}</b><br><small class="sub">${s}</small></div>${b}</div>`;
  const pintar = () => {
    const ev = v.evento && EVENTOS[v.evento], libre = v.tarde < v.sem, viv = VIVIENDAS[v.vivienda];
    el.innerHTML = `<h2>🏠 Vida personal</h2><p class="sub">${esc(p.jugador.nombre)} ${esc(p.jugador.apellido)} · ${esc(p.equipo)}${v.capitan ? " · Capitán 🎖️" : ""}</p>
      ${ev ? `<div class="panel" style="margin-bottom:16px"><h2>${ev.t}</h2><p>${esc(ev.d(p))}</p><div class="grid" id="ev">${ev.o.map((o, i) => `<button class="card" data-o="${i}"><b>${esc(o[0])}</b></button>`).join("")}</div></div>` : ""}
      <div class="panel" style="margin-bottom:16px"><h2>Cómo estás</h2>${barra("Felicidad", v.felicidad, v.felicidad < 35)}${barra("Vestuario", v.vestuario, v.vestuario < 35)}${barra("Confianza del DT", v.dt, v.dt < 30)}${barra("Amigos de la infancia", v.amigos, v.amigos < 30)}
        <p class="sub" style="margin:8px 0 0">Pareja: ${v.pareja === "novia" ? "tu novia de toda la vida 💞" : v.pareja === "modelo" ? "una modelo 📸 (sube tu fama, pero te quita foco)" : "soltero"} · Agente: ${v.agente}</p></div>
      <div class="panel" style="margin-bottom:16px"><h2>Tarde libre</h2><p class="sub">${libre ? "Elegí qué hacer esta semana." : "Ya usaste tu tarde libre: se renueva con el próximo partido."}</p>
        <div class="grid" id="tarde">${Object.entries(TARDES).map(([k, t]) => `<button class="card" data-t="${k}" ${libre ? "" : "disabled"}><b>${t.icono} ${t.nombre}</b><small>${t.desc}</small></button>`).join("")}</div></div>
      <div class="panel" style="margin-bottom:16px"><h2>Vivienda</h2>${item(`${viv[0]} ${viv[1]}`, viv[2], "")}
        ${v.vivienda === "pension" ? `<div class="fila"><button class="btn" data-v="alquiler">Mudarte a un departamento alquilado</button></div>` : v.vivienda === "alquiler" ? `<div class="fila"><button class="btn" data-v="mansion">Comprar una mansión · ${usd(costoMansion(p))}</button></div>` : ""}</div>
      <div class="panel"><h2>Últimas decisiones</h2>${v.log.length ? v.log.map(l => item(esc(l.t), esc(l.r), "")).join("") : `<p class="sub">Todavía no tomaste decisiones importantes.</p>`}</div>
      <div class="fila"><button class="btn" id="atras">Volver</button></div>`;
    el.querySelector("#atras").onclick = () => ir("carrera");
    const hecho = (t, r) => { v.log.unshift({ t, r }); v.log.length = Math.min(v.log.length, 8); aviso(r); guardar(); pintar(); };
    const evb = el.querySelector("#ev"); if (evb) evb.onclick = e => { const b = e.target.closest("[data-o]"); if (!b) return; const id = v.evento, o = EVENTOS[id].o[+b.dataset.o]; v.evento = null; hecho(EVENTOS[id].t, o[1](p, v)); };
    const tb = el.querySelector("#tarde"); if (tb) tb.onclick = e => { const b = e.target.closest("[data-t]"); if (!b || b.disabled) return; const t = TARDES[b.dataset.t]; v.tarde = v.sem; hecho("Tarde libre: " + t.nombre, t.f(p, v)); };
    el.querySelectorAll("[data-v]").forEach(b => b.onclick = () => {
      if (b.dataset.v === "mansion") { const c = costoMansion(p); if ((p.ahorros || 0) < c) return aviso("No te alcanzan los ahorros"); p.ahorros -= c; }
      v.vivienda = b.dataset.v; hecho("Mudanza", `Te mudaste: ${VIVIENDAS[v.vivienda][1]}.`);
    });
  };
  pintar();
}
