import { ir, estado, aviso } from "./router.js";
import { POSICIONES } from "./data/competiciones.js";
import { esc } from "./util.js";
import { ETIQUETAS, generarAtributos, calcularOverall } from "./atributos.js";
import { generarCalendario, textoPartido, sede } from "./fixture.js";
import { actualizarPartida } from "./firebase.js";
import { crearLiga, registrarFecha, puestoEnZona } from "./liga.js";
import { mostrarTabla } from "./tabla.js";
import { fuerzaDe } from "./data/fuerza.js";

// ==========================================
// BASE DE DATOS: EQUIPOS (EDITÁ ESTO PARA TU 2026)
// ==========================================
const DATOS_EQUIPOS_2026 = {
    "boca": { dt: "E. Cavani (DT)", figuras: "L. Brey, K. Zenón, I. Miramón" },
    "river": { dt: "J. Pinola (DT)", figuras: "F. Mastantuono, S. Boselli" },
    "racing": { dt: "Lisandro López (DT)", figuras: "M. Salas, B. Zuculini" },
    "independiente": { dt: "C. Tevez", figuras: "S. López, M. Giménez" },
    "san lorenzo": { dt: "L. Romagnoli", figuras: "E. Irala, G. Gómez" },
    "estudiantes": { dt: "E. Pérez (DT)", figuras: "S. Ascacíbar, T. Palacios" },
    "default": { dt: "DT Interino", figuras: "Plantel profesional 2026" }
};

function obtenerDatosReales(nombreEquipo) {
    if (!nombreEquipo) return DATOS_EQUIPOS_2026["default"];
    const key = Object.keys(DATOS_EQUIPOS_2026).find(k => nombreEquipo.toLowerCase().includes(k));
    return key ? DATOS_EQUIPOS_2026[key] : DATOS_EQUIPOS_2026["default"];
}

export function pantallaCarrera(el) {
  const p = estado.partida, j = p.jugador, pr = p.progreso;

  const faltantes = {};
  if (!p.atributos) {
    p.atributos = generarAtributos(p.posicion, j, p.liga);
    pr.overall = calcularOverall(p.posicion, p.atributos);
    faltantes.atributos = p.atributos;
    faltantes["progreso.overall"] = pr.overall;
  }
  if (p.liga === "AR1" && !p.fixture) {
    // Partida vieja: se arma la liga real (zonas y fixture de los 30 equipos). Los partidos viejos se descartan.
    const lg = crearLiga(p.equipo);
    if (lg) {
      p.zona = lg.zona; p.equiposLiga = lg.equipos; p.fixture = lg.fixture; p.calendario = lg.calendario;
      pr.partidos = 0; pr.goles = 0; pr.asistencias = 0;
      delete faltantes["progreso.overall"];
      Object.assign(faltantes, { zona: p.zona, equiposLiga: p.equiposLiga, fixture: p.fixture, calendario: p.calendario, progreso: pr });
    }
  }
  if (!p.calendario || p.calendario.length === 0) {
    p.calendario = generarCalendario(p.equipo, p.liga);
    faltantes.calendario = p.calendario;
  }
  
  // Guardado de faltantes
  if (Object.keys(faltantes).length > 0 && estado.user?.uid) {
      actualizarPartida(estado.user.uid, p.id, JSON.parse(JSON.stringify(faltantes))).catch(() => {});
  }

  const pos = POSICIONES.find(x => x.id === p.posicion)?.nombre || p.posicion;
  const proximos = p.calendario.filter(m => m.jugado !== true).slice(0, 3);
  const jugados = p.calendario.filter(m => m.jugado === true).slice(-5).reverse(); 
  
  // Cálculo de estadísticas reales del equipo
  let misPuntos = 0, misPG = 0, misPE = 0, misPP = 0, misGF = 0, misGC = 0;
  p.calendario.filter(m => m.jugado === true && (!p.fixture || m.torneo)).forEach(m => {
      const esLocal = m.local === true || m.local === 'true';
      const gl = m.resultado?.local || 0;
      const gv = m.resultado?.visitante || 0;
      let aFavor = esLocal ? gl : gv;
      let enContra = esLocal ? gv : gl;
      misGF += aFavor; misGC += enContra;
      if (aFavor > enContra) { misPuntos += 3; misPG++; }
      else if (aFavor === enContra) { misPuntos += 1; misPE++; }
      else { misPP++; }
  });

  let infoZona = "";
  if (p.fixture) {
    const z = puestoEnZona(p);
    infoZona = `<p class="sub" style="margin-bottom:10px">Zona ${p.zona} · ${z.torneo === "AP" ? "Apertura" : "Clausura"}: ${z.pj > 0 ? `${z.puesto}.º de 15 tras ${z.pj} fecha${z.pj === 1 ? "" : "s"}` : "todavía sin partidos"}</p>`;
  }

  const datosClub = obtenerDatosReales(p.equipo);
  const stat = (n, v) => `<div class="stat"><b>${v}</b><span style="font-size:12px">${n}</span></div>`;
  
  el.innerHTML = `
    <div class="cabecera" style="margin-bottom: 15px;">
      <div><h2>${esc(j.nombre)} ${esc(j.apellido)}${j.apodo ? ` “${esc(j.apodo)}”` : ""}</h2>
      <p class="sub">${pos} · ${j.edad} años · ${esc(j.nacionalidad)} · pie ${j.pie.toLowerCase()}</p></div>
      <div class="tags"><span>${esc(p.equipo)}</span><span>Temporada ${p.temporada}</span></div>
    </div>
    
    <div class="stats">${stat("Valoración", pr.overall)}${stat("Partidos", pr.partidos)}${stat("Goles", pr.goles)}${stat("Asistencias", pr.asistencias)}</div>
    
    <!-- PANEL: MI CLUB -->
    <div class="panel" style="margin-bottom:16px; background:#1a1a2e; border: 1px solid #333;">
      <h2 style="color:#4ade80;">Actualidad del Club (Oct 2026)</h2>
      <p style="margin:5px 0; font-size:14px;">📋 <b>DT Actual:</b> ${datosClub.dt}</p>
      <p style="margin:5px 0; font-size:14px;">⭐ <b>Figuras:</b> ${datosClub.figuras}</p>
    </div>

    <!-- PANEL: ESTADÍSTICAS DEL EQUIPO Y TABLA -->
    <div class="panel" style="margin-bottom:16px;">
      <h2>Estadísticas Colectivas</h2>
      ${infoZona}
      <div style="display:flex; justify-content:space-between; text-align:center; margin-bottom:10px; background:#222; padding:10px; border-radius:8px;">
          <div><b style="font-size:18px;">${misPuntos}</b><br><span style="font-size:11px; opacity:0.7;">Puntos</span></div>
          <div><b style="font-size:18px; color:#4ade80;">${misPG}</b><br><span style="font-size:11px; opacity:0.7;">Victorias</span></div>
          <div><b style="font-size:18px; color:#fbbf24;">${misPE}</b><br><span style="font-size:11px; opacity:0.7;">Empates</span></div>
          <div><b style="font-size:18px; color:#f87171;">${misPP}</b><br><span style="font-size:11px; opacity:0.7;">Derrotas</span></div>
      </div>
      <div class="fila"><button class="btn" id="btn-tabla" style="background:#444;">📊 Ver Tabla de Posiciones</button></div>
    </div>

    <div class="panel" style="margin-bottom:16px"><h2>Atributos</h2>
      <div class="attrs">${Object.entries(p.atributos).map(([k, v]) => `<div class="attr"><span>${ETIQUETAS[k]}</span><div class="barra"><i style="width:${v}%"></i></div><b>${v}</b></div>`).join("")}</div>
    </div>

    <div class="panel" style="margin-bottom:16px"><h2>Historial de Partidos</h2>
      ${jugados.length > 0 ? jugados.map(m => {
          let resLoc = m.resultado?.local ?? 0;
          let resVis = m.resultado?.visitante ?? 0;
          let rival = m.rival || "Rival";
          let miNota = m.statsJugador?.nota?.toFixed(1) ?? "-";
          let textoRes = (m.local === true || m.local === 'true')
            ? `${esc(p.equipo)} <b>${resLoc} - ${resVis}</b> ${esc(rival)}` 
            : `${esc(rival)} <b>${resLoc} - ${resVis}</b> ${esc(p.equipo)}`;
          return `<div class="item" style="border-left: 4px solid ${miNota >= 7 ? '#4ade80' : (miNota <= 5 ? '#f87171' : '#fbbf24')}; padding-left: 10px;">
              <span>${esc(m.comp)}</span><div style="margin: 4px 0; font-size: 15px;">${textoRes}</div>
              <small class="sub">Nota: <b>${miNota}</b> | ⚽ Goles: ${m.statsJugador?.goles ?? 0} | 👟 Asist: ${m.statsJugador?.asistencias ?? 0}</small>
          </div>`;
      }).join("") : "<p class='sub'>Aún no has debutado en la temporada.</p>"}
    </div>

    <div class="panel" style="margin-bottom:16px"><h2>Próximos partidos</h2>
      ${proximos.map(m => `<div class="item"><span>${esc(m.etiqueta)}</span><b>${esc(textoPartido(m, p.equipo))}</b><small class="sub">${esc(m.comp)} · ${sede(m)}</small></div>`).join("") || "<p class='sub'>No quedan partidos en el calendario.</p>"}
      <div class="fila"><button class="btn" id="cal">Ver calendario completo</button></div>
    </div>
    
    <div class="fila">
        <button class="btn main" id="jugar" ${proximos.length === 0 ? "disabled" : ""}>Jugar partido</button>
        <button class="btn" id="btn-guardar" style="background-color: #3b82f6; color: white; border: none;">Guardar Partida</button>
        <button class="btn" id="menu">Menú</button>
    </div>`;
  
  el.querySelector("#menu").onclick = () => ir("menu");
  el.querySelector("#cal").onclick = () => ir("calendario");
  el.querySelector("#btn-tabla").onclick = () => p.fixture ? mostrarTabla(p) : aviso("La tabla real está disponible solo en Liga Profesional por ahora.");
  
  // ==========================================
  // BOTÓN GUARDAR MEJORADO (Evita cuelgues)
  // ==========================================
  const btnGuardar = el.querySelector("#btn-guardar");
  if(btnGuardar) {
      btnGuardar.onclick = () => {
          btnGuardar.innerText = "Guardando...";
          btnGuardar.disabled = true;
          
          // Actualiza el estado global al instante para que no se borre si vas al menú
          estado.partida = p;

          // Limpiamos la data de "undefined" que bloquea Firebase
          const datosLimpios = JSON.parse(JSON.stringify({
              progreso: p.progreso,
              atributos: p.atributos,
              calendario: p.calendario,
              fixture: p.fixture
          }));

          if (estado.user && estado.user.uid && p.id) {
              actualizarPartida(estado.user.uid, p.id, datosLimpios)
              .then(() => {
                  aviso("¡Partida guardada correctamente en la nube!");
                  btnGuardar.innerText = "Guardar Partida";
                  btnGuardar.disabled = false;
              })
              .catch(err => {
                  console.error("Error Firebase:", err);
                  aviso("Error al guardar. Revisá tu conexión a internet.");
                  btnGuardar.innerText = "Reintentar Guardado";
                  btnGuardar.disabled = false;
              });
          } else {
              aviso("No hay usuario conectado.");
              btnGuardar.innerText = "Guardar Partida";
              btnGuardar.disabled = false;
          }
      };
  }

  const btnJugar = el.querySelector("#jugar");
  if(btnJugar) {
      btnJugar.onclick = () => simularPartido(proximos[0], p);
  }
}

// ==========================================
// SISTEMA DE NIVELES (usa la misma fuerza que la tabla de la liga, en data/fuerza.js)
// ==========================================
function calcularNivelEquipo(nombre) {
    return 40 + (fuerzaDe(nombre) - 50) * 2;
}

// ==========================================
// SIMULACIÓN DE PARTIDO
// ==========================================
function simularPartido(partidoActual, p) {
    if (!partidoActual) return aviso("No hay partidos por jugar.");

    const esLocal = partidoActual.local === true || partidoActual.local === 'true';
    const rival = partidoActual.rival || "Rival";
    const miEquipo = p.equipo;
    
    let golesLocal = 0, golesVisitante = 0;
    let eventos = [];
    let stats = { goles: 0, asistencias: 0, nota: 6.0 };

    let nivelMiEquipo = calcularNivelEquipo(miEquipo) + (p.progreso.overall * 0.1); 
    let nivelRival = calcularNivelEquipo(rival);
    
    let nivelLocal = esLocal ? nivelMiEquipo + 4 : nivelRival + 4;
    let nivelVisita = esLocal ? nivelRival : nivelMiEquipo;

    const pos = p.posicion;
    let probGol = pos === 'DEL' ? 0.08 : (pos === 'MED' ? 0.04 : 0.01);
    let probAsistencia = pos === 'MED' ? 0.07 : (pos === 'DEL' ? 0.05 : 0.02);

    for (let min = 1; min <= 90; min++) {
        if (Math.random() < 0.08) { 
            let chanceLocal = nivelLocal / (nivelLocal + nivelVisita); 
            let ocasionParaMiEquipo = (esLocal && Math.random() < chanceLocal) || (!esLocal && Math.random() >= chanceLocal);
            
            if (ocasionParaMiEquipo) {
                if (Math.random() < probGol) {
                    stats.goles++;
                    stats.nota += 1.2;
                    eventos.push({ min, txt: `¡GOLAZO TUYO! Mandaste la pelota a guardar.`, tipo: 'positivo' });
                    esLocal ? golesLocal++ : golesVisitante++;
                } else if (Math.random() < probAsistencia) {
                    stats.asistencias++;
                    stats.nota += 0.8;
                    eventos.push({ min, txt: `¡Asistencia perfecta tuya para el gol!`, tipo: 'positivo' });
                    esLocal ? golesLocal++ : golesVisitante++;
                } else if (Math.random() < 0.25) { 
                    stats.nota += 0.1;
                    eventos.push({ min, txt: `¡Gol de ${miEquipo}! Gran jugada colectiva.`, tipo: 'positivo' });
                    esLocal ? golesLocal++ : golesVisitante++;
                }
            } else {
                if (Math.random() < 0.3) {
                    stats.nota -= 0.15;
                    eventos.push({ min, txt: `Gol de ${rival}. Superaron a nuestra defensa.`, tipo: 'negativo' });
                    esLocal ? golesVisitante++ : golesLocal++;
                }
            }
        }
    }

    stats.nota = Math.max(1.0, Math.min(10.0, stats.nota));
    
    // Aseguramos que no haya datos undefined para evitar crasheos en Firebase
    partidoActual.resultado = { local: golesLocal || 0, visitante: golesVisitante || 0 };
    partidoActual.statsJugador = { goles: stats.goles || 0, asistencias: stats.asistencias || 0, nota: stats.nota || 6.0 };

    mostrarReporte(partidoActual, esLocal, miEquipo, rival, eventos, stats, p);
}

function mostrarReporte(partido, esLocal, miEquipo, rival, eventos, stats, p) {
    const resLoc = partido.resultado.local, resVis = partido.resultado.visitante;
    const modal = document.createElement("div");
    modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); color:white; z-index:9999; display:flex; flex-direction:column; padding:20px; overflow-y:auto; box-sizing:border-box;";
    
    let htmlEventos = eventos.map(e => `<p style="margin:6px 0; font-size:14px; border-bottom:1px solid #333; padding-bottom:4px;"><strong style="color:${e.tipo==='positivo'?'#4ade80':(e.tipo==='negativo'?'#f87171':'#fbbf24')};">[Min ${e.min}']</strong> ${e.txt}</p>`).join("") || "<p style='text-align:center;'>Partido trabado, sin intervenciones directas.</p>";

    modal.innerHTML = `
        <div style="background:#1e1e1e; padding:25px; border-radius:12px; max-width:500px; width:100%; margin:auto; border:1px solid #444;">
            <h3 style="text-align:center; opacity:0.6; margin:0;">${partido.comp}</h3>
            <h2 style="text-align:center; font-size:26px; margin:15px 0;">${esLocal?miEquipo:rival} <span style="color:#FFD700;">${resLoc} - ${resVis}</span> ${esLocal?rival:miEquipo}</h2>
            <div style="background:#2a2a2a; border-radius:8px; padding:15px; margin:20px 0; display:flex; justify-content:space-around; text-align:center;">
                <div><span style="font-size:13px;">Nota</span><b style="display:block; font-size:22px; color:${stats.nota>=7?'#4ade80':'#f87171'}">${stats.nota.toFixed(1)}</b></div>
                <div><span style="font-size:13px;">Goles</span><b style="display:block; font-size:22px;">${stats.goles}</b></div>
                <div><span style="font-size:13px;">Asistencias</span><b style="display:block; font-size:22px;">${stats.asistencias}</b></div>
            </div>
            <div style="background:#111; padding:15px; border-radius:8px; max-height:180px; overflow-y:auto;">${htmlEventos}</div>
            <button id="btn-continuar" style="width:100%; padding:15px; margin-top:20px; background:#4ade80; color:#111; font-weight:bold; border-radius:8px; cursor:pointer; font-size:16px;">Continuar Temporada</button>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector("#btn-continuar").onclick = () => {
        procesarEvolucion(partido, stats, p);
        document.body.removeChild(modal);
        ir("carrera");
    };
}

function procesarEvolucion(partido, stats, p) {
    p.progreso.partidos++; p.progreso.goles += stats.goles; p.progreso.asistencias += stats.asistencias;
    let mejora = stats.nota >= 8.5 ? 2 : (stats.nota >= 7.0 ? 1 : (stats.nota <= 4.0 ? -1 : 0));

    if (mejora !== 0) {
        for (let key in p.atributos) if (Math.random() > 0.5) p.atributos[key] = Math.max(1, Math.min(99, p.atributos[key] + mejora));
        p.progreso.overall = calcularOverall(p.posicion, p.atributos);
    }
    partido.jugado = true;
    if (partido.torneo && p.fixture) registrarFecha(p, partido);   // simula el resto de la fecha y actualiza la tabla
    
    estado.partida = p; // Mantiene los datos al ir al menú localmente
    
    // Autoguardado con limpieza de undefined
    if (estado.user && estado.user.uid && p.id) {
        const datosLimpios = JSON.parse(JSON.stringify({
            progreso: p.progreso,
            atributos: p.atributos,
            calendario: p.calendario,
            fixture: p.fixture
        }));
        actualizarPartida(estado.user.uid, p.id, datosLimpios).catch(e => console.warn("Error en autoguardado de fondo."));
    }
}