import { ir, estado, aviso } from "./router.js";
import { POSICIONES } from "./data/competiciones.js";
import { esc } from "./util.js";
import { ETIQUETAS, generarAtributos, calcularOverall } from "./atributos.js";
import { generarCalendario, textoPartido, sede } from "./fixture.js";
import { actualizarPartida } from "./firebase.js";

export function pantallaCarrera(el) {
  const p = estado.partida, j = p.jugador, pr = p.progreso;

  // Completa las partidas viejas a las que les falta algo (atributos, calendario).
  const faltantes = {};
  if (!p.atributos) {
    p.atributos = generarAtributos(p.posicion, j, p.liga);
    pr.overall = calcularOverall(p.posicion, p.atributos);
    faltantes.atributos = p.atributos;
    faltantes["progreso.overall"] = pr.overall;
  }
  if (!p.calendario || p.calendario.length === 0) {
    p.calendario = generarCalendario(p.equipo, p.liga);
    faltantes.calendario = p.calendario;
  }
  
  // Si falta algo y hay usuario, guardamos los faltantes
  if (Object.keys(faltantes).length > 0 && estado.user?.uid) {
      actualizarPartida(estado.user.uid, p.id, faltantes).catch(() => {});
  }

  const pos = POSICIONES.find(x => x.id === p.posicion)?.nombre || p.posicion;
  
  // Filtros estrictos: proximos (no jugados) y jugados (historial)
  const proximos = p.calendario.filter(m => m.jugado !== true).slice(0, 3);
  const jugados = p.calendario.filter(m => m.jugado === true).slice(-5).reverse(); // Últimos 5
  
  const stat = (n, v) => `<div class="stat"><b>${v}</b><span>${n}</span></div>`;
  
  el.innerHTML = `
    <div class="cabecera">
      <div><h2>${esc(j.nombre)} ${esc(j.apellido)}${j.apodo ? ` “${esc(j.apodo)}”` : ""}</h2>
      <p class="sub">${pos} · ${j.edad} años · ${esc(j.nacionalidad)} · pie ${j.pie.toLowerCase()}</p></div>
      <div class="tags"><span>${esc(p.equipo)}</span><span>Temporada ${p.temporada}</span></div>
    </div>
    <div class="stats">${stat("Valoración", pr.overall)}${stat("Partidos", pr.partidos)}${stat("Goles", pr.goles)}${stat("Asistencias", pr.asistencias)}</div>
    
    <div class="panel" style="margin-bottom:16px"><h2>Atributos</h2>
      <div class="attrs">${Object.entries(p.atributos).map(([k, v]) => `<div class="attr"><span>${ETIQUETAS[k]}</span><div class="barra"><i style="width:${v}%"></i></div><b>${v}</b></div>`).join("")}</div>
    </div>

    <!-- PANEL: HISTORIAL DE PARTIDOS AL INSTANTE -->
    <div class="panel" style="margin-bottom:16px"><h2>Historial de Partidos</h2>
      ${jugados.length > 0 ? jugados.map(m => {
          let resLoc = m.resultado?.local ?? 0;
          let resVis = m.resultado?.visitante ?? 0;
          let rival = m.rival || "Rival";
          let miNota = m.statsJugador?.nota?.toFixed(1) ?? "-";
          let misG = m.statsJugador?.goles ?? 0;
          let misA = m.statsJugador?.asistencias ?? 0;
          
          let textoRes = (m.local === true || m.local === 'true')
            ? `${esc(p.equipo)} <b>${resLoc} - ${resVis}</b> ${esc(rival)}` 
            : `${esc(rival)} <b>${resLoc} - ${resVis}</b> ${esc(p.equipo)}`;

          return `<div class="item" style="border-left: 4px solid ${miNota >= 7 ? '#4ade80' : (miNota <= 5 ? '#f87171' : '#fbbf24')}; padding-left: 10px;">
              <span>${esc(m.comp)}</span>
              <div style="margin: 4px 0; font-size: 15px;">${textoRes}</div>
              <small class="sub">Rendimiento: Nota <b>${miNota}</b> | ⚽ Goles: ${misG} | 👟 Asist: ${misA}</small>
          </div>`;
      }).join("") : "<p class='sub'>Aún no has debutado en la temporada.</p>"}
    </div>

    <div class="panel" style="margin-bottom:16px"><h2>Próximos partidos</h2>
      ${proximos.map(m => `<div class="item"><span>${esc(m.etiqueta)}</span><b>${esc(textoPartido(m, p.equipo))}</b><small class="sub">${esc(m.comp)} · ${sede(m)}</small></div>`).join("") || "<p class='sub'>No quedan partidos en el calendario.</p>"}
      <div class="fila"><button class="btn" id="cal">Ver calendario completo</button></div>
    </div>
    
    <div class="fila"><button class="btn main" id="jugar" ${proximos.length === 0 ? "disabled" : ""}>Jugar próximo partido</button><button class="btn" id="menu">Menú principal</button></div>`;
  
  el.querySelector("#cal").onclick = () => ir("calendario");
  el.querySelector("#menu").onclick = () => ir("menu");
  
  const btnJugar = el.querySelector("#jugar");
  if(btnJugar) {
      btnJugar.onclick = () => simularPartido(proximos[0], p);
  }
}

// ==========================================
// SISTEMA DE NIVELES (REALISMO DE EQUIPOS)
// ==========================================
function calcularNivelEquipo(nombre) {
    if (!nombre) return 65;
    const nombreLow = nombre.toLowerCase();
    
    const grandes = ["boca", "river", "racing", "independiente", "san lorenzo", "estudiantes", "flamengo", "palmeiras", "real madrid", "barcelona", "bayern", "city", "psg", "liverpool"];
    let base = grandes.some(g => nombreLow.includes(g)) ? 82 : 65;
    
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
        hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }
    return base + (Math.abs(hash) % 15); 
}

// ==========================================
// PASO 5: SIMULACIÓN DE PARTIDO
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
    let probGol = pos === 'delantero' ? 0.08 : (pos === 'mediocampista' ? 0.04 : 0.01);
    let probAsistencia = pos === 'mediocampista' ? 0.07 : (pos === 'delantero' ? 0.05 : 0.02);

    for (let min = 1; min <= 90; min++) {
        let rand = Math.random();
        
        if (rand < 0.08) { 
            let totalNivel = nivelLocal + nivelVisita;
            let chanceLocal = nivelLocal / totalNivel; 
            
            let ocasionParaLocal = Math.random() < chanceLocal;
            let ocasionParaMiEquipo = (esLocal && ocasionParaLocal) || (!esLocal && !ocasionParaLocal);
            
            if (ocasionParaMiEquipo) {
                if (Math.random() < probGol) {
                    stats.goles++;
                    stats.nota += 1.2;
                    eventos.push({ min, txt: `¡GOLAZO TUYO! Mandaste la pelota a guardar contra ${rival}.`, tipo: 'positivo' });
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
    partidoActual.resultado = { local: golesLocal, visitante: golesVisitante };
    partidoActual.statsJugador = { goles: stats.goles, asistencias: stats.asistencias, nota: stats.nota };

    mostrarReporte(partidoActual, esLocal, miEquipo, rival, eventos, stats, p);
}

function mostrarReporte(partido, esLocal, miEquipo, rival, eventos, stats, p) {
    const resLocal = partido.resultado.local;
    const resVisita = partido.resultado.visitante;
    
    const modal = document.createElement("div");
    modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); color:white; z-index:9999; display:flex; flex-direction:column; padding:20px; overflow-y:auto; box-sizing:border-box; font-family:sans-serif;";
    
    let htmlEventos = eventos.map(e => {
        let color = e.tipo === 'positivo' ? '#4ade80' : (e.tipo === 'negativo' ? '#f87171' : '#fbbf24');
        return `<p style="margin:6px 0; font-size:14px; border-bottom: 1px solid #333; padding-bottom: 4px;"><strong style="color:${color};">[Min ${e.min}']</strong> ${e.txt}</p>`;
    }).join("");
    
    if (!htmlEventos) htmlEventos = "<p style='font-size:14px; opacity:0.7; text-align:center;'>Partido muy táctico y trabado, sin intervenciones directas a portería.</p>";

    modal.innerHTML = `
        <div style="background:#1e1e1e; padding:25px; border-radius:12px; max-width:500px; width:100%; margin:auto; border:1px solid #444; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
            <h3 style="text-align:center; opacity:0.6; margin:0; font-size: 14px; text-transform: uppercase;">${partido.comp}</h3>
            <h2 style="text-align:center; font-size:26px; margin:15px 0;">
                ${esLocal ? miEquipo : rival} 
                <span style="color:#FFD700; padding: 0 10px;">${resLocal} - ${resVisita}</span> 
                ${esLocal ? rival : miEquipo}
            </h2>
            
            <div style="background:#2a2a2a; border-radius:8px; padding:15px; margin:20px 0; display:flex; justify-content:space-around; text-align:center;">
                <div><span style="display:block; opacity:0.7; font-size:13px; margin-bottom:5px;">Tu Nota</span><b style="font-size:22px; color:${stats.nota >= 7 ? '#4ade80' : '#f87171'}">${stats.nota.toFixed(1)}</b></div>
                <div><span style="display:block; opacity:0.7; font-size:13px; margin-bottom:5px;">Goles</span><b style="font-size:22px;">${stats.goles}</b></div>
                <div><span style="display:block; opacity:0.7; font-size:13px; margin-bottom:5px;">Asistencias</span><b style="font-size:22px;">${stats.asistencias}</b></div>
            </div>
            
            <h4 style="margin: 0 0 10px 0; color:#aaa;">Eventos del partido</h4>
            <div style="background:#111; padding:15px; border-radius:8px; max-height:180px; overflow-y:auto; border:1px solid #333;">
                ${htmlEventos}
            </div>
            
            <button id="btn-continuar" style="width:100%; padding:15px; margin-top:20px; background:#4ade80; color:#111; font-weight:bold; text-transform:uppercase; border:none; border-radius:8px; cursor:pointer; font-size:16px; transition: 0.2s;">Continuar Temporada</button>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector("#btn-continuar").onclick = () => {
        document.body.removeChild(modal);
        procesarEvolucion(partido, stats, p);
    };
}

// ==========================================
// PASO 6: EVOLUCIÓN (Al instante y Segundo plano)
// ==========================================
function procesarEvolucion(partido, stats, p) {
    p.progreso.partidos++;
    p.progreso.goles += stats.goles;
    p.progreso.asistencias += stats.asistencias;

    let mejora = 0;
    if (stats.nota >= 8.5) mejora = 2;
    else if (stats.nota >= 7.0) mejora = 1;
    else if (stats.nota <= 4.0) mejora = -1;

    if (mejora !== 0) {
        for (let key in p.atributos) {
            if (Math.random() > 0.5) {
                p.atributos[key] = Math.max(1, Math.min(99, p.atributos[key] + mejora));
            }
        }
        p.progreso.overall = calcularOverall(p.posicion, p.atributos);
        if (mejora > 0) aviso(`¡Has ganado experiencia! Tu valoración se actualizó a ${p.progreso.overall}`);
    }

    // 1. Etiquetamos el partido de manera estricta para que salga de "Próximos"
    partido.jugado = true;

    // 2. ACTUALIZACIÓN DE PANTALLA AL INSTANTE
    ir("carrera");

    // 3. GUARDADO EN SEGUNDO PLANO EN FIREBASE
    if (estado.user && estado.user.uid) {
        actualizarPartida(estado.user.uid, p.id, {
            progreso: p.progreso,
            atributos: p.atributos,
            calendario: p.calendario
        }).catch(err => {
            console.error("Error guardando en la nube, pero el juego local sigue activo:", err);
        });
    }
}