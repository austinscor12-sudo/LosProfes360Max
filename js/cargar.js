import { ir, estado, aviso } from "./router.js";
import { esc } from "./util.js";
import { listarPartidas, borrarPartida } from "./firebase.js";

export async function pantallaCargar(el) {
  el.innerHTML = `<h2>Cargar partida</h2><p class="sub">Cargando…</p>`;
  const render = async () => {
    let lista = [], falla = "";
    try { lista = await listarPartidas(estado.user.uid); } catch (e) { falla = "Error: " + (e.code || e.message); }
    el.innerHTML = `<h2>Cargar partida</h2><p class="error">${falla}</p>
      <div class="panel">${lista.length ? lista.map(p => `<div class="item"><div><b>${esc(p.jugador.nombre)} ${esc(p.jugador.apellido)}</b><br><small class="sub">${p.posicion} · ${esc(p.equipo)} · Temporada ${p.temporada} · ${p.progreso.partidos} partidos</small></div>
        <div><button class="btn" data-c="${p.id}">Continuar</button> <button class="btn" data-b="${p.id}">Borrar</button></div></div>`).join("") : "<p class='sub'>Todavía no tenés partidas. Empezá una nueva temporada.</p>"}</div>
      <div class="fila"><button class="btn" id="atras">Volver</button></div>`;
    el.querySelector("#atras").onclick = () => ir("menu");
    el.querySelector(".panel").onclick = async e => {
      if (e.target.dataset.c) { estado.partida = lista.find(p => p.id === e.target.dataset.c); ir("carrera"); }
      if (e.target.dataset.b && confirm("¿Borrar esta partida?")) { await borrarPartida(estado.user.uid, e.target.dataset.b); render(); }
    };
  };
  render();
}
