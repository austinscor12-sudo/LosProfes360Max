// Plantillas por equipo: jugadores y DT que se muestran en el partido (nombres en la cancha, en el relato y en la cinemática).
// Cada equipo tiene su archivo en js/data/plantillas/<nombre-del-equipo>.js (el nombre del archivo sale del equipo: "Boca Juniors" -> boca-juniors.js).
// Si un equipo no tiene archivo, o tiene menos de 11 jugadores cargados, se usan nombres al azar como antes.

const cache = new Map();

export const slug = n => String(n).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// "Leandro Paredes" -> "L. Paredes" (si escribís solo un nombre, por ejemplo un apodo, queda igual).
export const corto = n => {
  const w = String(n).trim().split(/\s+/);
  return w.length < 2 ? w[0] : `${w[0][0].toUpperCase()}. ${w.slice(1).join(" ")}`;
};

function limpiar(raw) {
  if (!raw || typeof raw !== "object") return null;
  const dt = String(raw.dt || "").trim();
  const jugadores = (Array.isArray(raw.jugadores) ? raw.jugadores : [])
    .filter(j => j && String(j.n || "").trim())
    .map(j => ({ n: String(j.n).trim(), c: String(j.c || corto(j.n)).trim(), p: ["ARQ", "DEF", "MED", "DEL"].includes(j.p) ? j.p : "MED" }));
  return { dt, jugadores: jugadores.length >= 11 ? jugadores : [] };   // los primeros 11 son los titulares
}

// Carga (una sola vez) los archivos de los equipos que se van a usar. Si no existe el archivo, no pasa nada.
export async function precargar(...equipos) {
  await Promise.all(equipos.filter(Boolean).map(async e => {
    if (cache.has(e)) return;
    try { cache.set(e, limpiar((await import(`./data/plantillas/${slug(e)}.js`)).default)); }
    catch { cache.set(e, null); }
  }));
}

export const plantillaDe = e => cache.get(e) || null;