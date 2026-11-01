import { ir, estado, aviso } from "./router.js";
import { esc } from "./util.js";
import { ETIQUETAS } from "./atributos.js";
import { usd, iniciarFin, obtenerRenov, pedirMas, firmarRenov, fichar, comenzarTemporada, retirar, EDAD_RETIRO_VOLUNTARIO } from "./evolucion.js";
import { LIGAS } from "./data/equipos.js";
import { guardarTodo } from "./firebase.js";
import { esArgentino, asegurar } from "./seleccion.js";
import { nombreCopa } from "./fixture.js";

const dato = (l, v) => `<div class="dato"><span>${l}</span><b>${v}</b></div>`;

export function pantallaFin(el) {
  const p = estado.partida;
  const guardar = () => guardarTodo(estado.user.uid, p).catch(e => aviso("No se pudo guardar: " + (e.code || e.message)));
  // Se genera una sola vez y queda guardado: si cerrás y volvés, ves lo mismo.
  if (!p.fin) { p.fin = iniciarFin(p); guardar(); }
  const f = p.fin;
  const ir_paso = n => { f.paso = n; guardar(); pintar(); };

  // España: cupos europeos, playoff de ascenso y quiénes suben y bajan
  const espana = () => {
    const e = f.esp; if (!e || !e.cambios) return "";
    const lista = a => a.map(esc).join(", ");
    const eu = e.europa ? `<h2>Clasificación europea</h2>${e.europa.mio ? `<p class="nota">🌍 ${esc(p.equipo)} jugará la ${esc(e.europa.mio)}.</p>` : `<p class="sub">${esc(p.equipo)} no clasificó a copas europeas.</p>`}
        ${dato("Champions League", lista(e.europa.ucl))}${dato("Europa League", lista(e.europa.uel))}${dato("Conference League", lista(e.europa.uecl))}
        <p class="sub">Campeón de la Copa del Rey: ${esc(e.copa.campeon)} · Subcampeón: ${esc(e.copa.sub)}</p>` : "";
    const po = e.playoff ? `<h2>Playoff de ascenso</h2>${e.playoff.participa ? `<p class="nota">Terminaste entre el 3.º y el 6.º: jugás el playoff (se simula).</p>` : ""}
        <p class="sub">Semifinales: ${esc(e.playoff.semis[0].g)} eliminó a ${esc(e.playoff.semis[0].p)}; ${esc(e.playoff.semis[1].g)} eliminó a ${esc(e.playoff.semis[1].p)}.<br>Final: ${esc(e.playoff.final.g)} le ganó a ${esc(e.playoff.final.p)} y consiguió el tercer ascenso.</p>` : "";
    const c = e.cambios;
    const mov = p.liga === "ES1" ? dato("Descienden a Segunda", lista(c.baja1)) + dato("Ascienden a Primera", lista(c.sube1))
      : p.liga === "ES2" ? dato("Ascienden a Primera", lista(c.sube1)) + dato("Descienden a la tercera", lista(c.baja2))
      : dato("Ascienden a Segunda", lista(c.sube2));
    return `<div class="panel" style="margin-top:16px">${eu}${po}<h2>Ascensos y descensos</h2>${mov}</div>`;
  };

  const resumen = () => {
    const t = p.temp, nota = t.partidos ? (t.notaSuma / t.partidos).toFixed(2) : "-";
    const titulos = p.palmares.filter(x => x.temporada === p.temporada);
    return `<h2>Temporada ${p.temporada} terminada</h2><p class="sub">${esc(p.equipo)}</p>
      <div class="stats"><div class="stat"><b>${t.partidos}</b><span>Partidos</span></div><div class="stat"><b>${t.goles}</b><span>Goles</span></div><div class="stat"><b>${t.asist}</b><span>Asistencias</span></div><div class="stat"><b>${nota}</b><span>Nota media</span></div></div>
      <div class="panel">${dato("Titular en", `${t.titular} partidos`)}${dato("Minutos", t.minutos)}${dato("Figura del partido", `${t.figuras} veces`)}${dato("Tarjetas", `${t.amarillas} amarillas · ${t.rojas} rojas`)}${dato("Lesiones", t.lesiones)}${f.finanzas?.renta ? dato("Renta del departamento", "+" + usd(f.finanzas.renta)) : ""}${f.finanzas?.rend ? dato("Fondo de inversión", `${f.finanzas.pct > 0 ? "+" : ""}${f.finanzas.pct}%`) : ""}
        ${Object.entries(t.pos).map(([c, pos]) => dato(esc(c), `${pos}° puesto`)).join("")}${t.copa ? dato(nombreCopa(p), esc(t.copa)) : ""}${t.supercopa ? dato("Supercopa de España", esc(t.supercopa)) : ""}
        ${esArgentino(p) && asegurar(p).temp.pj ? dato("🇦🇷 Selección", `${asegurar(p).temp.pj} partidos · ${asegurar(p).temp.goles} goles · ${asegurar(p).temp.asist} asist.`) : ""}
        ${titulos.map(x => `<p class="nota">🏆 Campeón: ${esc(x.titulo)}</p>`).join("")}</div>
      ${espana()}
      <div class="fila"><button class="btn main" id="sig">Continuar</button></div>`;
  };
  const evolucion = () => `<h2>Evolución</h2><p class="sub">Cumplís ${f.evo.edad} años.</p>
    <div class="stats"><div class="stat"><b>${f.evo.antes}</b><span>Valoración anterior</span></div><div class="stat"><b>${f.evo.despues}</b><span>Valoración nueva</span></div><div class="stat"><b>${p.potencial}</b><span>Potencial</span></div></div>
    <div class="panel"><h2>Cambios de atributos</h2>${f.evo.cambios.length ? f.evo.cambios.map(c => `<div class="dato"><span>${ETIQUETAS[c.k]}</span><b class="${c.a > c.de ? "sube" : "baja"}">${c.de} → ${c.a}</b></div>`).join("") : `<p class="sub">Sin cambios este año.</p>`}</div>
    <div class="fila"><button class="btn main" id="sig">Continuar</button></div>`;

  const mercado = () => {
    const vence = p.contrato.anios === 0, o = vence ? obtenerRenov(p) : null;
    const listo = p.contrato.anios > 0;
    return `<h2>Contrato y mercado de pases</h2>
      ${f.ascenso ? `<p class="nota">⬆️ ¡${esc(p.equipo)} ascendió${f.nuevaLiga && f.nuevaLiga.startsWith("ES") ? " a " + esc(LIGAS.find(l => l.id === f.nuevaLiga)?.nombre) : " a Primera"}!</p>` : ""}${f.descenso ? `<p class="nota">⬇️ ${esc(p.equipo)} descendió a ${f.nuevaLiga && f.nuevaLiga.startsWith("ES") ? esc(LIGAS.find(l => l.id === f.nuevaLiga)?.nombre) : "la Primera Nacional"}.</p>` : ""}
      <div class="panel" style="margin-bottom:16px">${dato("Club actual", esc(p.equipo))}${dato("Contrato", vence ? "Vencido" : `${p.contrato.anios} año${p.contrato.anios === 1 ? "" : "s"} · ${usd(p.contrato.salario)}/mes`)}
        ${vence && o.estado === "abierta" ? `<p style="margin-top:10px"><b>${esc(p.equipo)}</b> te ofrece renovar ${o.anios} años por <b>${usd(o.salario)}</b> al mes.</p>
          <div class="fila"><button class="btn main" data-r="ok">Renovar</button><button class="btn" data-r="mas">Pedir más (+20%, riesgo)</button></div>` : ""}
        ${vence && o.estado !== "abierta" ? `<p class="nota">${o.estado === "retirada" ? "El club retiró la oferta." : "El club no te ofrece renovación."} Quedás libre: elegí una oferta.</p>` : ""}</div>
      ${f.fichado ? "" : `<div class="panel"><h2>Ofertas recibidas</h2>${f.ofertas.length ? f.ofertas.map((x, i) => `<div class="item"><div><b>${esc(x.equipo)}</b><br><small class="sub">${esc(LIGAS.find(l => l.id === x.liga)?.nombre || "")} · Rol: ${x.rol}<br>${x.anios} años · ${usd(x.salario)}/mes · ${x.monto ? "Pase: " + usd(x.monto) : "Pase libre"}</small></div><button class="btn" data-o="${i}">Aceptar</button></div>`).join("") : `<p class="sub">No llegaron ofertas este año.</p>`}</div>`}
      ${listo ? `<div class="fila"><button class="btn main" id="sig">${f.fichado ? "Seguir" : `Quedarme en ${esc(p.equipo)}`}</button></div>` : ""}
      ${p.jugador.edad >= EDAD_RETIRO_VOLUNTARIO ? `<div class="fila"><button class="btn" id="retiro">Retirarme del fútbol</button></div>` : ""}`;
  };
  const retiroForzado = () => `<h2>Llegó la hora</h2><p class="sub">${esc(p.jugador.nombre)} ${esc(p.jugador.apellido)} · ${esc(p.equipo)}</p>
    <div class="panel"><p>Tras ${p.historial.length} temporada${p.historial.length === 1 ? "" : "s"} como profesional, el cuerpo ya no responde como antes. A los ${p.jugador.edad - 1} años jugaste tu última temporada: es momento de colgar los botines.</p></div>
    <div class="fila"><button class="btn main" id="colgar">Colgar los botines</button></div>`;
  const nueva = () => `<h2>Temporada ${p.temporada + 1}</h2><p class="sub">${esc(p.equipo)} · ${esc(f.nuevaLiga ? LIGAS.find(l => l.id === f.nuevaLiga)?.nombre : p.ligaNombre)}${f.ascenso ? " (ascenso)" : f.descenso ? " (descenso)" : ""}</p>
    <div class="panel">${dato("Edad", p.jugador.edad)}${dato("Valoración", p.progreso.overall)}${dato("Contrato", `${p.contrato.anios} año${p.contrato.anios === 1 ? "" : "s"} · ${usd(p.contrato.salario)}/mes`)}</div>
    <p class="sub" style="margin-top:12px">Vas a arrancar descansado, con un calendario nuevo.</p>
    <div class="fila"><button class="btn main" id="go">Comenzar temporada</button></div>`;

  const pintar = () => {
    el.innerHTML = (f.forzado && f.paso >= 2 ? retiroForzado : [resumen, evolucion, mercado, nueva][f.paso])();
    const retirarse = motivo => { retirar(p, motivo); guardar(); ir("retiro"); };
    const colgar = el.querySelector("#colgar"); if (colgar) colgar.onclick = () => { colgar.disabled = true; retirarse("edad"); };
    const ret = el.querySelector("#retiro"); if (ret) ret.onclick = () => { if (confirm("¿Seguro que querés retirarte? Tu carrera termina acá.")) retirarse("voluntario"); };
    const sig = el.querySelector("#sig"); if (sig) sig.onclick = () => ir_paso(f.paso + 1);
    const go = el.querySelector("#go");
    if (go) go.onclick = () => { go.disabled = true; comenzarTemporada(p); guardar(); aviso("¡Nueva temporada!"); ir("carrera"); };
    el.querySelectorAll("[data-r]").forEach(b => b.onclick = () => {
      if (b.dataset.r === "ok") { firmarRenov(p); aviso("Contrato renovado"); } else aviso(pedirMas(p) ? "El club mejoró la oferta" : "El club retiró la oferta");
      guardar(); pintar();
    });
    el.querySelectorAll("[data-o]").forEach(b => b.onclick = () => {
      const o = f.ofertas[Number(b.dataset.o)];
      if (confirm(`¿Fichar por ${o.equipo}?`)) { fichar(p, o); aviso("¡Nuevo club!"); guardar(); pintar(); }
    });
  };
  pintar();
}