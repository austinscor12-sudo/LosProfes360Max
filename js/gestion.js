import { ir, estado, aviso } from "./router.js";
import { esc } from "./util.js";
import { ETIQUETAS } from "./atributos.js";
import { INTENSIDADES, usd, valorActual, rolEstimado, obtenerRenov, pedirMas, firmarRenov } from "./evolucion.js";
import { guardarTodo } from "./firebase.js";
import { MEJORAS, BIENES, NIVEL_MAX, asegurarFin, costoMejora, costoBien, patrimonio, comprarMejora, comprarBien, operarFondo } from "./finanzas.js";

const barra = (v, malo) => `<div class="barra ${malo ? "mala" : ""}"><i style="width:${v}%"></i></div>`;
const dato = (l, v) => `<div class="dato"><span>${l}</span><b>${v}</b></div>`;

export function pantallaGestion(el) {
  const p = estado.partida;
  let tab = estado.tabGestion || "entreno";
  const guardar = () => guardarTodo(estado.user.uid, p).catch(e => aviso("No se pudo guardar: " + (e.code || e.message)));

  const entreno = () => {
    const les = p.lesion;
    return `
    <div class="panel" style="margin-bottom:16px"><h2>Estado físico</h2>
      <div class="attr"><span>Fatiga</span>${barra(p.fatiga, p.fatiga > 60)}<b>${p.fatiga}</b></div>
      <div class="attr"><span>Forma</span>${barra(p.forma)}<b>${p.forma}</b></div>
      ${les ? `<p class="nota">🩹 ${esc(les.nombre)} (${les.gravedad}): te perdés ${les.restantes} partido${les.restantes === 1 ? "" : "s"} más. Mientras tanto entrenás en modo rehabilitación.</p>` : `<p class="sub" style="margin-top:10px">Sin lesiones.</p>`}
      <p class="sub" style="margin:6px 0 0">Con fatiga alta (más de 60) rendís menos y aumenta el riesgo de lesión.</p></div>
    <div class="panel" style="margin-bottom:16px"><h2>En qué querés mejorar</h2><p class="sub">El atributo elegido progresa más rápido en cada semana de entrenamiento.</p>
      <div class="grid" id="foco">${Object.keys(p.atributos).map(k => `<button class="card ${p.plan.foco === k ? "sel" : ""}" data-k="${k}"><b>${ETIQUETAS[k]} · ${p.atributos[k]}</b>${barra(Math.min(99, Math.round(p.xp[k] || 0)))}<small>Próximo punto: ${Math.round(p.xp[k] || 0)}/100</small></button>`).join("")}</div></div>
    <div class="panel"><h2>Intensidad</h2>
      <div class="grid" id="inten">${Object.entries(INTENSIDADES).map(([k, i]) => `<button class="card ${p.plan.intensidad === k ? "sel" : ""}" data-i="${k}"><b>${i.nombre}</b><small>${i.desc}</small></button>`).join("")}</div></div>`;
  };

  const contrato = () => {
    const c = p.contrato, val = valorActual(p);
    let r = "";
    if (c.anios <= 1 && p.renov?.estado !== "firmada") {
      const o = obtenerRenov(p);
      r = o.estado === "abierta" ? `<p><b>${esc(p.equipo)}</b> te ofrece renovar ${o.anios} años por <b>${usd(o.salario)}</b> al mes.</p>
        <div class="fila"><button class="btn main" data-r="ok">Aceptar</button><button class="btn" data-r="mas">Pedir más dinero (+20%, riesgo)</button><button class="btn" data-r="no">Ahora no</button></div>`
        : o.estado === "retirada" ? `<p class="nota">El club retiró la oferta de renovación por pedir de más.</p>` : `<p class="sub">Por ahora el club no piensa en renovarte.</p>`;
    } else if (p.renov?.estado === "firmada") r = `<p class="sub">Ya renovaste este año.</p>`;
    else r = `<p class="sub">Podés pedir la renovación cuando te quede 1 año de contrato.</p>`;
    return `
    <div class="panel" style="margin-bottom:16px"><h2>Contrato</h2>
      ${dato("Club", esc(p.equipo))}${dato("Salario mensual", usd(c.salario))}${dato("Años restantes", c.anios)}
      ${dato("Valor de mercado", usd(val))}${dato("Rol esperado", rolEstimado(p))}${dato("Ahorros", usd(p.ahorros || 0))}</div>
    <div class="panel"><h2>Renovación</h2>${r}</div>`;
  };

  const trayectoria = () => `
    <div class="panel" style="margin-bottom:16px"><h2>Palmarés</h2>${p.palmares.length ? p.palmares.map(x => `<div class="item"><b>🏆 ${esc(x.titulo)}</b><span>${x.temporada}</span></div>`).join("") : `<p class="sub">Todavía no ganaste títulos.</p>`}</div>
    <div class="panel" style="margin-bottom:16px"><h2>Temporadas</h2>${p.historial.length ? p.historial.map(h => `<div class="item"><b>${h.temporada} · ${esc(h.equipo)}</b><small class="sub">${h.partidos} PJ · ${h.goles} goles · ${h.asist} asist. · nota ${h.nota}${h.copa ? ` · Copa: ${esc(h.copa)}` : ""}</small></div>`).join("") : `<p class="sub">Todavía no cerraste ninguna temporada.</p>`}</div>
    <div class="panel"><h2>Transferencias</h2>${p.traspasos.length ? p.traspasos.map(t => `<div class="item"><b>${esc(t.de)} → ${esc(t.a)}</b><small class="sub">${t.temporada} · ${t.monto ? usd(t.monto) : "pase libre"}</small></div>`).join("") : `<p class="sub">Todavía no cambiaste de club.</p>`}</div>`;

  const finanzas = () => {
    const f = asegurarFin(p), ahorros = p.ahorros || 0;
    const mejoras = Object.entries(MEJORAS).map(([id, m]) => { const n = f.mejoras[id], c = costoMejora(p, id);
      return `<div class="item"><div><b>${m.icono} ${m.nombre} · nivel ${n}/${NIVEL_MAX}</b><br><small class="sub">${m.desc}</small></div>${c == null ? `<span class="sub">Máximo</span>` : `<button class="btn" data-m="${id}">${usd(c)}</button>`}</div>`; }).join("");
    const bienes = Object.entries(BIENES).map(([id, b]) => { const t = f.bienes.find(x => x.id === id);
      return `<div class="item"><div><b>${b.icono} ${b.nombre}</b><br><small class="sub">${b.desc}</small></div>${t ? `<span class="sub">Comprado</span>` : `<button class="btn" data-b="${id}">${usd(costoBien(p, id))}</button>`}</div>`; }).join("");
    return `
    <div class="panel" style="margin-bottom:16px"><h2>Tus finanzas</h2>
      ${dato("Ahorros", usd(ahorros))}${dato("Fondo de inversión", usd(f.fondo))}${dato("Patrimonio total", usd(patrimonio(p)))}
      <p class="sub" style="margin:8px 0 0">Ahorrás el 40% de tu sueldo en cada partido. Los precios dependen de tu sueldo actual.</p></div>
    <div class="panel" style="margin-bottom:16px"><h2>Tu equipo personal</h2>${mejoras}</div>
    <div class="panel" style="margin-bottom:16px"><h2>Bienes</h2>${bienes}</div>
    <div class="panel"><h2>Fondo de inversión</h2><p class="sub">Cada temporada rinde entre −6% y +14%: puede ganar o perder.</p>
      <div class="fila"><button class="btn" data-f="dep25" ${ahorros ? "" : "disabled"}>Invertir 25%</button><button class="btn" data-f="dep" ${ahorros ? "" : "disabled"}>Invertir todo</button><button class="btn" data-f="ret" ${f.fondo ? "" : "disabled"}>Retirar todo</button></div></div>`;
  };

  const pintar = () => {
    el.innerHTML = `
      <h2>Gestión de carrera</h2><p class="sub">${esc(p.jugador.nombre)} ${esc(p.jugador.apellido)} · ${esc(p.equipo)}</p>
      <div class="tabs"><button class="tab" data-t="entreno">Entrenamiento</button><button class="tab" data-t="contrato">Contrato</button><button class="tab" data-t="trayectoria">Trayectoria</button><button class="tab" data-t="finanzas">Finanzas</button></div>
      ${tab === "entreno" ? entreno() : tab === "contrato" ? contrato() : tab === "finanzas" ? finanzas() : trayectoria()}
      <div class="fila"><button class="btn" id="atras">Volver</button></div>`;
    el.querySelectorAll(".tab").forEach(t => t.classList.toggle("sel", t.dataset.t === tab));
    el.querySelector(".tabs").onclick = e => { const t = e.target.closest(".tab"); if (!t) return; tab = estado.tabGestion = t.dataset.t; pintar(); };
    el.querySelector("#atras").onclick = () => ir("carrera");
    const foco = el.querySelector("#foco"), inten = el.querySelector("#inten");
    if (foco) foco.onclick = e => { const c = e.target.closest(".card"); if (!c) return; p.plan.foco = c.dataset.k; guardar(); pintar(); };
    if (inten) inten.onclick = e => { const c = e.target.closest(".card"); if (!c) return; p.plan.intensidad = c.dataset.i; guardar(); pintar(); };
    el.querySelectorAll("[data-r]").forEach(b => b.onclick = () => {
      const a = b.dataset.r;
      if (a === "ok") { firmarRenov(p); aviso("Contrato renovado"); }
      else if (a === "mas") aviso(pedirMas(p) ? "El club aceptó mejorar la oferta" : "El club retiró la oferta");
      guardar(); pintar();
    });
    el.querySelectorAll("[data-m],[data-b],[data-f]").forEach(b => b.onclick = () => {
      const d = b.dataset;
      const err = d.m ? comprarMejora(p, d.m) : d.b ? comprarBien(p, d.b) : operarFondo(p, d.f);
      aviso(err || (d.m ? "Mejora contratada" : d.b ? "¡Compra realizada!" : "Listo"));
      if (!err) guardar();
      pintar();
    });
  };
  pintar();
}