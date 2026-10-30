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
  if (!p.calendario) {
    p.calendario = generarCalendario(p.equipo, p.liga);
    faltantes.calendario = p.calendario;
  }
  if (Object.keys(faltantes).length) actualizarPartida(estado.user.uid, p.id, faltantes).catch(() => {});

  const pos = POSICIONES.find(x => x.id === p.posicion)?.nombre || p.posicion;
  const proximos = p.calendario.filter(m => !m.jugado).slice(0, 5);
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
    <div class="panel" style="margin-bottom:16px"><h2>Próximos partidos</h2>
      ${proximos.map(m => `<div class="item"><span>${esc(m.etiqueta)}</span><b>${esc(textoPartido(m, p.equipo))}</b><small class="sub">${esc(m.comp)} · ${sede(m)}</small></div>`).join("") || "<p class='sub'>No quedan partidos en el calendario.</p>"}
      <div class="fila"><button class="btn" id="cal">Ver calendario completo</button></div>
    </div>
    <div class="panel"><h2>Competiciones</h2><div class="tags">${p.competiciones.map(c => `<span>${esc(c)}</span>`).join("")}</div></div>
    <div class="fila"><button class="btn main" id="jugar" ${proximos.length === 0 ? "disabled" : ""}>Jugar próximo partido</button><button class="btn" id="menu">Menú principal</button></div>`;
  
  el.querySelector("#cal").onclick = () => ir("calendario");
  el.querySelector("#menu").onclick = () => ir("menu");
  
  // AL TOCAR JUGAR, INICIAMOS LA SIMULACIÓN
  const btnJugar = el.querySelector("#jugar");
  if(btnJugar) {
      btnJugar.onclick = () => simularPartido(proximos[0], p);
  }
}

// ==========================================
// PASO 5: SIMULACIÓN DE PARTIDO
// ==========================================
function simularPartido(partidoActual, p) {
    if (!partidoActual) return aviso("No hay partidos por jugar.");

    const esLocal = partidoActual.local === p.equipo;
    const rival = esLocal ? partidoActual.visitante : partidoActual.local;
    
    let golesLocal = 0, golesVisitante = 0;
    let eventos = [];
    let stats = { goles: 0, asistencias: 0, nota: 6.0 };

    // Probabilidades basadas en la posición del jugador
    const pos = p.posicion;
    let probGol = pos === 'delantero' ? 0.08 : (pos === 'mediocampista' ? 0.04 : 0.01);
    let probAsistencia = pos === 'mediocampista' ? 0.07 : (pos === 'delantero' ? 0.05 : 0.02);
    let probDefensa = pos === 'defensor' ? 0.08 : 0.02;

    // Simulación de 90 minutos
    for (let min = 1; min <= 90; min++) {
        let rand = Math.random();
        
        // 10% chance de ocasión para el equipo del jugador
        if (rand < 0.10) {
            if (Math.random() < probGol) {
                stats.goles++;
                stats.nota += 1.2;
                eventos.push({ min, txt: `¡GOLAZO TUYO! Gran definición.`, tipo: 'positivo' });
                esLocal ? golesLocal++ : golesVisitante++;
            } else if (Math.random() < probAsistencia) {
                stats.asistencias++;
                stats.nota += 0.8;
                eventos.push({ min, txt: `¡Asistencia espectacular tuya para el gol!`, tipo: 'positivo' });
                esLocal ? golesLocal++ : golesVisitante++;
            } else if (Math.random() < probDefensa) {
                stats.nota += 0.2;
                eventos.push({ min, txt: `Corte clave en defensa. Salvaste al equipo.`, tipo: 'neutral' });
            }
        } 
        // 10% chance de ocasión para el rival
        else if (rand > 0.90) {
            esLocal ? golesVisitante++ : golesLocal++;
            eventos.push({ min, txt: `Gol del rival. Desatención general.`, tipo: 'negativo' });
            stats.nota -= 0.15;
        }
    }

    stats.nota = Math.max(1.0, Math.min(10.0, stats.nota));
    partidoActual.resultado = { local: golesLocal, visitante: golesVisitante };

    mostrarReporte(partidoActual, esLocal, p.equipo, rival, eventos, stats, p);
}

function mostrarReporte(partido, esLocal, miEquipo, rival, eventos, stats, p) {
    const resLocal = partido.resultado.local;
    const resVisita = partido.resultado.visitante;
    
    const modal = document.createElement("div");
    modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); color:white; z-index:9999; display:flex; flex-direction:column; padding:20px; overflow-y:auto; box-sizing:border-box;";
    
    let htmlEventos = eventos.map(e => {
        let color = e.tipo === 'positivo' ? '#4ade80' : (e.tipo === 'negativo' ? '#f87171' : '#fbbf24');
        return `<p style="margin:4px 0; font-size:14px;"><strong style="color:${color};">[${e.min}']</strong> ${e.txt}</p>`;
    }).join("");
    if (!htmlEventos) htmlEventos = "<p style='font-size:14px; opacity:0.7;'>Partido trabado, sin intervenciones destacadas tuyas.</p>";

    modal.innerHTML = `
        <div style="background:#1e1e1e; padding:20px; border-radius:12px; max-width:500px; width:100%; margin:auto; border:1px solid #333;">
            <h3 style="text-align:center; opacity:0.7; margin-top:0;">RESULTADO FINAL</h3>
            <h2 style="text-align:center; font-size:24px; margin:10px 0;">
                ${esLocal ? miEquipo : rival} ${resLocal} - ${resVisita} ${esLocal ? rival : miEquipo}
            </h2>
            <div style="background:#2a2a2a; border-radius:8px; padding:15px; margin:15px 0; display:flex; justify-content:space-between; text-align:center;">
                <div><span style="display:block; opacity:0.7; font-size:12px;">Nota</span><b style="font-size:20px; color:${stats.nota >= 7 ? '#4ade80' : '#f87171'}">${stats.nota.toFixed(1)}</b></div>
                <div><span style="display:block; opacity:0.7; font-size:12px;">Goles</span><b style="font-size:20px;">${stats.goles}</b></div>
                <div><span style="display:block; opacity:0.7; font-size:12px;">Asist.</span><b style="font-size:20px;">${stats.asistencias}</b></div>
            </div>
            <h4 style="margin-bottom:8px;">Minutos clave</h4>
            <div style="background:#111; padding:10px; border-radius:8px; max-height:150px; overflow-y:auto; border:1px solid #333;">
                ${htmlEventos}
            </div>
            <button id="btn-continuar" style="width:100%; padding:14px; margin-top:20px; background:#4ade80; color:#000; font-weight:bold; border:none; border-radius:8px; cursor:pointer; font-size:16px;">Continuar</button>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector("#btn-continuar").onclick = () => {
        document.body.removeChild(modal);
        procesarEvolucion(partido, stats, p);
    };
}

// ==========================================
// PASO 6: EVOLUCIÓN (Guardado y stats)
// ==========================================
function procesarEvolucion(partido, stats, p) {
    // 1. Actualizar estadísticas
    p.progreso.partidos++;
    p.progreso.goles += stats.goles;
    p.progreso.asistencias += stats.asistencias;

    // 2. Evolución de atributos (Si la nota es > 7, sube aleatoriamente algunos atributos)
    let mejora = 0;
    if (stats.nota >= 8.5) mejora = 2;
    else if (stats.nota >= 7.0) mejora = 1;
    else if (stats.nota <= 4.0) mejora = -1; // Baja si juega muy mal

    if (mejora !== 0) {
        for (let key in p.atributos) {
            // Sube/baja con un 50% de probabilidad por cada atributo para no romper el juego rápido
            if (Math.random() > 0.5) {
                p.atributos[key] = Math.max(1, Math.min(99, p.atributos[key] + mejora));
            }
        }
        // Recalcular overall
        p.progreso.overall = calcularOverall(p.posicion, p.atributos);
        if (mejora > 0) aviso(`¡Has ganado experiencia! Tu valoración se actualizó a ${p.progreso.overall}`);
    }

    // 3. Marcar partido como jugado en el calendario
    partido.jugado = true;

    // 4. Guardar en Firebase
    actualizarPartida(estado.user.uid, p.id, {
        progreso: p.progreso,
        atributos: p.atributos,
        calendario: p.calendario
    }).then(() => {
        // Recargar la pantalla para mostrar los datos nuevos
        ir("carrera");
    }).catch(err => {
        aviso("Hubo un error al guardar el progreso.");
        console.error(err);
    });
}