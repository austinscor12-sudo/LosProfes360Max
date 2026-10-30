import { entrar, registrar, entrarGoogle } from "./firebase.js";

export function pantallaAuth(el) {
  el.innerHTML = `
    <h1>Modo Carrera</h1><p class="sub">Entrá para guardar tu progreso.</p>
    <div class="panel campos" style="max-width:480px">
      <label>Email<input id="em" type="email" autocomplete="email"></label>
      <label>Contraseña<input id="pw" type="password" autocomplete="current-password"></label>
    </div>
    <div class="fila">
      <button class="btn main" id="in">Entrar</button>
      <button class="btn" id="reg">Crear cuenta</button>
      <button class="btn" id="goo">Entrar con Google</button>
    </div><p class="error" id="err"></p>`;
  const err = m => el.querySelector("#err").textContent = m;
  const val = () => [el.querySelector("#em").value.trim(), el.querySelector("#pw").value];
  const probar = fn => async () => { try { await fn(); } catch (e) { err("No se pudo entrar: " + (e.code || e.message)); } };
  el.querySelector("#in").onclick = probar(() => entrar(...val()));
  el.querySelector("#reg").onclick = probar(() => registrar(...val()));
  el.querySelector("#goo").onclick = probar(entrarGoogle);
}
