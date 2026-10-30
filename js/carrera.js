/*
 * CARRERA.JS - ARCHIVO COMPLETO (Pasos 5 y 6 integrados)
 * Simulación detallada de partidos y evolución del jugador.
 * Puedes reemplazar todo tu carrera.js actual con este código.
 */

const CarreraManager = {
    // Estado global de la partida
    estado: {
        jugador: {
            nombre: "Tu Jugador",
            posicion: "DEL", // DEL, MED, DEF, POR
            media: 75,
            atributos: { ritmo: 75, tiro: 78, pase: 70, defensa: 40, fisico: 72 },
            estadisticas: { goles: 0, asistencias: 0, partidos: 0, calificacionPromedio: 0.0 },
            lesionado: false,
            diasRecuperacion: 0
        },
        equipoActual: { nombre: "Boca Juniors", nivel: 80 },
        temporada: { jornada: 1, maxJornadas: 30, mercadoAbierto: false },
        historialPartidos: []
    },

    init: function() {
        console.log("Módulo de Carrera Inicializado.");
        // Aquí podrías cargar datos de localStorage si los tuvieras
        // this.cargarPartida();
    },

    // ==========================================
    // PASO 5: SIMULACIÓN DETALLADA DE PARTIDOS
    // ==========================================

    jugarSiguientePartido: function(rival) {
        if (this.estado.jugador.lesionado) {
            alert(`No puedes jugar. Estás lesionado. Te faltan ${this.estado.jugador.diasRecuperacion} días de recuperación.`);
            this.avanzarTiempoSinJugar();
            return;
        }

        const equipoLocal = Math.random() > 0.5 ? this.estado.equipoActual : rival;
        const equipoVisitante = equipoLocal === this.estado.equipoActual ? rival : this.estado.equipoActual;
        const esLocal = (equipoLocal === this.estado.equipoActual);

        // Iniciar simulación
        const reporte = this.simularMinutoAMinuto(equipoLocal, equipoVisitante, esLocal);
        
        // Guardar en historial
        this.estado.historialPartidos.push(reporte);
        this.estado.jugador.estadisticas.partidos++;

        // Mostrar interfaz de resultado
        this.renderReportePartido(reporte, equipoLocal, equipoVisitante);

        // Ejecutar Paso 6: Evolución
        this.procesarEvolucionPostPartido(reporte);
    },

    simularMinutoAMinuto: function(local, visitante, jugadorEsLocal) {
        let golesLocal = 0;
        let golesVisitante = 0;
        let eventos = [];
        
        // Estadísticas individuales del jugador en este partido
        let statsJugador = {
            goles: 0,
            asistencias: 0,
            tarjetaAmarilla: false,
            tarjetaRoja: false,
            lesionado: false,
            minutosJugados: 90,
            calificacion: 6.0 // Nota base
        };

        // Factores de probabilidad según posición
        const pos = this.estado.jugador.posicion;
        let probGol = pos === 'DEL' ? 0.08 : (pos === 'MED' ? 0.04 : 0.01);
        let probAsistencia = pos === 'MED' ? 0.07 : (pos === 'DEL' ? 0.05 : 0.02);
        let probDefensa = pos === 'DEF' ? 0.08 : 0.02;

        // Bucle de los 90 minutos
        for (let min = 1; min <= 90; min++) {
            if (statsJugador.tarjetaRoja || statsJugador.lesionado) break; // Si no está en cancha, no genera eventos propios

            let eventoAleatorio = Math.random();

            // 1. Ocasión de Gol para el Equipo del Jugador (10% de chance por minuto de que pase algo peligroso)
            if (eventoAleatorio < 0.10) {
                // ¿El jugador interviene directamente?
                if (Math.random() < probGol) {
                    statsJugador.goles++;
                    statsJugador.calificacion += 1.2;
                    eventos.push({ minuto: min, texto: `¡GOLAZO TUYO! Definición espectacular en el área.`, tipo: 'positivo' });
                    jugadorEsLocal ? golesLocal++ : golesVisitante++;
                } else if (Math.random() < probAsistencia) {
                    statsJugador.asistencias++;
                    statsJugador.calificacion += 0.8;
                    eventos.push({ minuto: min, texto: `¡Gran asistencia tuya! Dejaste a tu compañero solo frente al arco para el gol.`, tipo: 'positivo' });
                    jugadorEsLocal ? golesLocal++ : golesVisitante++;
                } else if (Math.random() < probDefensa) {
                    statsJugador.calificacion += 0.3;
                    eventos.push({ minuto: min, texto: `Corte providencial tuyo en defensa. Evitaste un ataque peligroso.`, tipo: 'neutral' });
                }
            } 
            // 2. Ocasión del Rival
            else if (eventoAleatorio > 0.90) {
                jugadorEsLocal ? golesVisitante++ : golesLocal++;
                eventos.push({ minuto: min, texto: `Gol del rival. Desatención en el fondo.`, tipo: 'negativo' });
                statsJugador.calificacion -= 0.2; // Baja la nota si el equipo recibe gol
            }
            // 3. Eventos disciplinarios / Lesiones (sólo para el jugador)
            else if (eventoAleatorio > 0.88 && eventoAleatorio < 0.89) {
                if (!statsJugador.tarjetaAmarilla) {
                    statsJugador.tarjetaAmarilla = true;
                    statsJugador.calificacion -= 0.5;
                    eventos.push({ minuto: min, texto: `Fuerte infracción tuya. El árbitro te saca Amarilla.`, tipo: 'negativo' });
                } else {
                    statsJugador.tarjetaRoja = true;
                    statsJugador.calificacion -= 2.0;
                    statsJugador.minutosJugados = min;
                    eventos.push({ minuto: min, texto: `¡EXPULSADO! Segunda amarilla por llegar tarde. Dejas al equipo con uno menos.`, tipo: 'negativo' });
                }
            }
            // 4. Riesgo de Lesión (1% de chance)
            else if (eventoAleatorio < 0.005) {
                statsJugador.lesionado = true;
                statsJugador.minutosJugados = min;
                statsJugador.calificacion -= 0.3;
                eventos.push({ minuto: min, texto: `¡Auch! Sentiste un pinchazo y pides el cambio. Sales lesionado.`, tipo: 'negativo' });
            }
        }

        // Ajustar calificación final a límites (1.0 a 10.0)
        statsJugador.calificacion = Math.max(1.0, Math.min(10.0, statsJugador.calificacion));

        return {
            resultado: { local: golesLocal, visitante: golesVisitante },
            eventos: eventos,
            stats: statsJugador
        };
    },

    renderReportePartido: function(reporte, local, visitante) {
        // Crear un modal dinámico para mostrar el reporte sin tocar el HTML
        const modal = document.createElement('div');
        modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); color:white; z-index:9999; display:flex; flex-direction:column; align-items:center; padding:20px; overflow-y:auto; font-family:sans-serif;";
        
        let eventosHTML = reporte.eventos.map(ev => {
            let color = ev.tipo === 'positivo' ? '#4CAF50' : (ev.tipo === 'negativo' ? '#f44336' : '#FFC107');
            return `<p style="margin:5px 0;"><strong style="color:${color};">[Min ${ev.minuto}']</strong> ${ev.texto}</p>`;
        }).join('');

        if (reporte.eventos.length === 0) {
            eventosHTML = `<p>Partido muy trabado. No tuviste intervenciones destacadas.</p>`;
        }

        modal.innerHTML = `
            <div style="background:#222; padding:30px; border-radius:10px; max-width:600px; width:100%; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
                <h2 style="text-align:center; text-transform:uppercase;">Resultado Final</h2>
                <h1 style="text-align:center; color:#FFD700;">${local.nombre} ${reporte.resultado.local} - ${reporte.resultado.visitante} ${visitante.nombre}</h1>
                <hr style="border-color:#444;">
                
                <h3>Tu Rendimiento:</h3>
                <ul style="list-style:none; padding:0; display:flex; justify-content:space-between; background:#333; padding:10px; border-radius:5px;">
                    <li><strong>Nota:</strong> <span style="font-size:1.2em; color:${reporte.stats.calificacion >= 7 ? '#4CAF50' : '#f44336'};">${reporte.stats.calificacion.toFixed(1)}</span></li>
                    <li><strong>Goles:</strong> ${reporte.stats.goles}</li>
                    <li><strong>Asistencias:</strong> ${reporte.stats.asistencias}</li>
                </ul>

                <h3>Minutos Clave:</h3>
                <div style="background:#111; padding:15px; border-radius:5px; height:200px; overflow-y:auto; font-size:0.9em; border: 1px solid #444;">
                    ${eventosHTML}
                </div>
                
                <button id="btn-continuar-carrera" style="margin-top:20px; width:100%; padding:15px; font-size:1.1em; background:#4CAF50; color:white; border:none; border-radius:5px; cursor:pointer;">Continuar Carrera ➔</button>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('btn-continuar-carrera').addEventListener('click', () => {
            document.body.removeChild(modal);
            this.mostrarResumenEvolucion(reporte.stats);
        });
    },

    // ==========================================
    // PASO 6: EVOLUCIÓN (ENTRENAMIENTO, LESIONES, TRANSFERENCIAS)
    // ==========================================

    procesarEvolucionPostPartido: function(reporte) {
        let j = this.estado.jugador;
        const stats = reporte.stats;

        // 1. Actualizar Estadísticas Históricas
        j.estadisticas.goles += stats.goles;
        j.estadisticas.asistencias += stats.asistencias;
        
        // Promedio móvil simple para la calificación
        if (j.estadisticas.partidos === 1) {
            j.estadisticas.calificacionPromedio = stats.calificacion;
        } else {
            j.estadisticas.calificacionPromedio = ((j.estadisticas.calificacionPromedio * (j.estadisticas.partidos - 1)) + stats.calificacion) / j.estadisticas.partidos;
        }

        // 2. Progreso de Atributos (Entrenamiento Pasivo)
        // Si juega bien (>7), sube. Si juega regular (6-7), se mantiene. Si juega mal (<6), baja.
        let crecimiento = 0;
        if (stats.calificacion >= 8.5) crecimiento = 0.5;
        else if (stats.calificacion >= 7.0) crecimiento = 0.2;
        else if (stats.calificacion < 5.0) crecimiento = -0.1; // Penalización por mal partido

        if (crecimiento !== 0) {
            j.atributos.ritmo = Math.min(99, j.atributos.ritmo + crecimiento);
            j.atributos.tiro = Math.min(99, j.atributos.tiro + crecimiento);
            j.atributos.pase = Math.min(99, j.atributos.pase + crecimiento);
            // Recalcular Media General (Promedio simple de atributos por ahora)
            j.media = Math.round((j.atributos.ritmo + j.atributos.tiro + j.atributos.pase + j.atributos.defensa + j.atributos.fisico) / 5);
        }

        // 3. Sistema de Lesiones
        if (stats.lesionado) {
            j.lesionado = true;
            // Gravedad de la lesión aleatoria (entre 1 y 5 partidos/semanas de baja)
            j.diasRecuperacion = Math.floor(Math.random() * 5) + 1; 
        }

        // 4. Avance de Temporada y Transferencias
        this.estado.temporada.jornada++;
        
        // Mercado de pases a mitad y final de temporada
        if (this.estado.temporada.jornada === 15 || this.estado.temporada.jornada === this.estado.temporada.maxJornadas) {
            this.estado.temporada.mercadoAbierto = true;
            this.generarOfertasMercado();
        } else {
            this.estado.temporada.mercadoAbierto = false;
        }
    },

    mostrarResumenEvolucion: function(statsPartido) {
        // Alertas nativas para mantenerlo simple y rápido, o puedes cambiarlo por otro modal
        let mensajeEvolucion = `--- REPORTE DE EVOLUCIÓN ---\n`;
        mensajeEvolucion += `Media General Actual: ${this.estado.jugador.media}\n`;
        mensajeEvolucion += `Calificación Promedio Temporada: ${this.estado.jugador.estadisticas.calificacionPromedio.toFixed(1)}\n`;

        if (statsPartido.lesionado) {
            mensajeEvolucion += `\n⚠️ PARTE MÉDICO: Sufriste una lesión. Estarás de baja por ${this.estado.jugador.diasRecuperacion} jornada(s).`;
        } else if (statsPartido.calificacion >= 8.0) {
            mensajeEvolucion += `\n📈 ¡Gran partido! Has ganado experiencia extra. Tus atributos han mejorado ligeramente.`;
        } else if (statsPartido.calificacion < 5.0) {
            mensajeEvolucion += `\n📉 Tu bajo rendimiento afectó tu confianza. Debes mejorar en el próximo entrenamiento.`;
        }

        alert(mensajeEvolucion);
    },

    avanzarTiempoSinJugar: function() {
        if (this.estado.jugador.lesionado) {
            this.estado.jugador.diasRecuperacion--;
            if (this.estado.jugador.diasRecuperacion <= 0) {
                this.estado.jugador.lesionado = false;
                alert("¡Te has recuperado de tu lesión! Ya tienes el alta médica para el próximo partido.");
            }
        }
        this.estado.temporada.jornada++;
    },

    generarOfertasMercado: function() {
        // Solo recibe ofertas si su promedio de temporada es bueno
        if (this.estado.jugador.estadisticas.calificacionPromedio >= 7.5 && !this.estado.jugador.lesionado) {
            const equiposInteresados = ["River Plate", "Flamengo", "Real Madrid", "Inter Miami"];
            const oferta = equiposInteresados[Math.floor(Math.random() * equiposInteresados.length)];
            
            let confirmar = confirm(`¡MERCADO DE PASES!\nTu gran rendimiento ha llamado la atención en el extranjero.\nEl ${oferta} te ha enviado una oferta de contrato.\n\n¿Deseas aceptar la transferencia y cambiar de equipo?`);
            
            if (confirmar) {
                this.estado.equipoActual = { nombre: oferta, nivel: 85 };
                alert(`¡Fichaje Confirmado! Has sido transferido al ${oferta}. ¡Mucho éxito en tu nueva etapa!`);
            } else {
                alert(`Decidiste rechazar la oferta y mantenerte leal a tu equipo actual.`);
            }
        }
    }
};

// ==========================================
// EJEMPLO DE USO (Puedes enlazar esto a tus botones de app.js)
// ==========================================
// CarreraManager.init();
// Botón "Jugar Próximo Partido" -> CarreraManager.jugarSiguientePartido({ nombre: "Racing Club", nivel: 78 });