// Atributos del jugador según posición. Escala 1-99.
export const ETIQUETAS = {
  ritmo: "Ritmo", tiro: "Tiro", pase: "Pase", regate: "Regate", defensa: "Defensa", fisico: "Físico",
  reflejos: "Reflejos", estirada: "Estirada", manos: "Manos", posicionamiento: "Colocación", saque: "Saque", velocidad: "Velocidad"
};

// base = valores iniciales de un jugador de 18 años en Primera; peso = cuánto pesa cada atributo en la valoración.
const PERFILES = {
  DEL: { base: { ritmo: 62, tiro: 60, pase: 46, regate: 57, defensa: 26, fisico: 50 }, peso: { ritmo: .20, tiro: .30, pase: .10, regate: .20, defensa: .05, fisico: .15 } },
  MED: { base: { ritmo: 52, tiro: 48, pase: 60, regate: 55, defensa: 46, fisico: 50 }, peso: { ritmo: .10, tiro: .12, pase: .30, regate: .22, defensa: .14, fisico: .12 } },
  DEF: { base: { ritmo: 52, tiro: 30, pase: 46, regate: 40, defensa: 60, fisico: 58 }, peso: { ritmo: .12, tiro: .03, pase: .12, regate: .08, defensa: .40, fisico: .25 } },
  ARQ: { base: { reflejos: 60, estirada: 58, manos: 58, posicionamiento: 55, saque: 46, velocidad: 40 }, peso: { reflejos: .25, estirada: .25, manos: .25, posicionamiento: .15, saque: .05, velocidad: .05 } }
};

const tope = (n, min = 25, max = 85) => Math.max(min, Math.min(max, Math.round(n)));
const azar = r => (Math.random() * 2 - 1) * r;

export function generarAtributos(pos, jugador, liga) {
  const perfil = PERFILES[pos] || PERFILES.MED;
  const edad = jugador.edad;
  // La experiencia sube la base hasta ~27 años; cae el ritmo pasados los 32.
  const exp = Math.max(-4, Math.min(12, (edad - 18) * 1.3));
  const ligaAjuste = { AR2: -4, ES2: -2, ES3: -4 }[liga] ?? 0;
  const alt = (jugador.altura || 178) - 178;
  const a = {};
  for (const k in perfil.base) {
    let v = perfil.base[k] + exp + ligaAjuste + azar(4);
    if (pos === "ARQ") {
      if (k === "estirada") v += (jugador.altura - 182) * 0.3;
    } else {
      if (k === "fisico") v += alt * 0.25;
      if (k === "ritmo") v -= alt * 0.15 + Math.max(0, edad - 32) * 1.5;
      if ((k === "pase" || k === "regate") && jugador.pie === "Ambidiestro") v += 2;
    }
    a[k] = tope(v);
  }
  return a;
}

export function calcularOverall(pos, atributos) {
  const peso = (PERFILES[pos] || PERFILES.MED).peso;
  return Math.round(Object.keys(peso).reduce((s, k) => s + (atributos[k] ?? 0) * peso[k], 0));
}