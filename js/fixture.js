import { PRIMERA, NACIONAL, LIGAS } from "./data/equipos.js";

export const RONDAS_COPA = ["32avos de final", "16avos de final", "Octavos de final", "Cuartos de final", "Semifinal", "Final"];

const mezclar = a => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
};

// Convierte [{rival, local}] en partidos numerados como "Fecha 1", "Fecha 2"...
const numerar = (comp, clave, lista) => lista.map((x, i) => ({
  id: `${clave}-${i + 1}`, comp, etiqueta: `Fecha ${i + 1}`, rival: x.rival, local: x.local, jugado: false
}));

// Misma lista de rivales pero en otro orden y con la localía invertida.
const revancha = (lista) => mezclar(lista).map(x => ({ rival: x.rival, local: !x.local }));

export function generarCalendario(equipo, ligaId) {
  const inicio = Math.random() < 0.5;
  const alternar = rivales => rivales.map((rival, i) => ({ rival, local: (i % 2 === 0) === inicio }));

  // Ligas europeas: todos contra todos, ida y vuelta (sin copa por ahora).
  const europea = LIGAS.find(l => l.id === ligaId && l.europa);
  if (europea) {
    const rivales = mezclar(europea.equipos.filter(n => n !== equipo));
    const ida = alternar(rivales);
    return numerar(europea.comp, europea.id, [...ida, ...revancha(ida)]);
  }

  // Copa Argentina: eliminación directa en cancha neutral. Solo se sortea el rival de la primera ronda.
  const pool = [...PRIMERA, ...NACIONAL].filter(n => n !== equipo);
  const copa = { id: "CA-1", comp: "Copa Argentina", etiqueta: RONDAS_COPA[0], rival: pool[Math.floor(Math.random() * pool.length)], local: null, jugado: false };

  if (ligaId === "AR2") {
    const rivales = mezclar(NACIONAL.filter(n => n !== equipo)).slice(0, 15);
    const ida = alternar(rivales);
    const zona = numerar("Primera Nacional", "PN", [...ida, ...revancha(ida)]);
    zona.splice(6, 0, copa);
    return zona;
  }

  const rivales = mezclar(PRIMERA.filter(n => n !== equipo)).slice(0, 15);
  const ap = alternar(rivales);
  const apertura = numerar("Torneo Apertura", "AP", ap);
  const clausura = numerar("Torneo Clausura", "CL", revancha(ap));
  apertura.splice(5, 0, copa);
  return [...apertura, ...clausura];
}

export const textoPartido = (m, equipo) => m.local === false ? `${m.rival} vs ${equipo}` : `${equipo} vs ${m.rival}`;
export const sede = m => m.local === null ? "Cancha neutral" : m.local ? "Local" : "Visitante";

// Copa Argentina: al ganar, se agrega la siguiente ronda unos partidos más adelante.
export function siguienteCopa(cal, m, equipo) {
  const r = RONDAS_COPA.indexOf(m.etiqueta);
  if (r < 0 || r >= RONDAS_COPA.length - 1) return null;
  const usados = cal.filter(x => x.comp === "Copa Argentina").map(x => x.rival);
  const pool = [...PRIMERA, ...NACIONAL].filter(n => n !== equipo && !usados.includes(n));
  const sig = { id: `CA-${r + 2}`, comp: "Copa Argentina", etiqueta: RONDAS_COPA[r + 1], rival: pool[Math.floor(Math.random() * pool.length)], local: null, jugado: false };
  cal.splice(Math.min(cal.length, cal.indexOf(m) + 5), 0, sig);
  return sig;
}
export const temporadaTerminada = cal => cal.every(m => m.jugado);