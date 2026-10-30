import { ir, estado } from "./router.js";
import { NACIONALIDADES, TEMPORADA_INICIAL } from "./data/competiciones.js";

export function pantallaJugador(el) {
  const j = estado.nuevo.jugador || {};
  const nac = NACIONALIDADES.map(n => `<option ${j.nacionalidad === n ? "selected" : ""}>${n}</option>`).join("");
  el.innerHTML = `
    <h2>Datos del jugador</h2><p class="sub">Temporada inicial ${TEMPORADA_INICIAL}.</p>
    <div class="panel campos">
      <label>Nombre<input id="nombre" maxlength="30" value="${j.nombre || ""}"></label>
      <label>Apellido<input id="apellido" maxlength="30" value="${j.apellido || ""}"></label>
      <label>Año de nacimiento<input id="anio" type="number" min="${TEMPORADA_INICIAL - 40}" max="${TEMPORADA_INICIAL - 15}" value="${j.anioNac || TEMPORADA_INICIAL - 18}"></label>
      <label>Edad<input id="edad" readonly></label>
      <label>Nacionalidad<select id="nac">${nac}</select></label>
      <label>Pie hábil<select id="pie"><option>Derecho</option><option>Zurdo</option><option>Ambidiestro</option></select></label>
      <label>Altura (cm)<input id="alt" type="number" min="150" max="210" value="${j.altura || 178}"></label>
      <label>Peso (kg)<input id="peso" type="number" min="50" max="110" value="${j.peso || 72}"></label>
      <label>Apodo (opcional)<input id="apodo" maxlength="20" value="${j.apodo || ""}"></label>
    </div>
    <p class="error" id="err"></p>
    <div class="fila"><button class="btn" id="atras">Volver</button><button class="btn main" id="sig">Continuar</button></div>`;
  const $ = id => el.querySelector("#" + id);
  if (j.pie) $("pie").value = j.pie;
  const edad = () => $("edad").value = TEMPORADA_INICIAL - Number($("anio").value) + " años";
  $("anio").oninput = edad; edad();
  $("atras").onclick = () => ir("menu");
  $("sig").onclick = () => {
    const nombre = $("nombre").value.trim(), apellido = $("apellido").value.trim(), anio = Number($("anio").value);
    if (!nombre || !apellido) return $("err").textContent = "Completá nombre y apellido.";
    if (anio < TEMPORADA_INICIAL - 40 || anio > TEMPORADA_INICIAL - 15) return $("err").textContent = "El año de nacimiento debe dar entre 15 y 40 años.";
    estado.nuevo.jugador = { nombre, apellido, apodo: $("apodo").value.trim(), anioNac: anio, edad: TEMPORADA_INICIAL - anio, nacionalidad: $("nac").value, pie: $("pie").value, altura: Number($("alt").value), peso: Number($("peso").value) };
    ir("posicion");
  };
}
