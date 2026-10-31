// Finanzas del jugador: en qué se pueden gastar los ahorros.
// Los precios se miden en sueldos mensuales, así que cuestan lo mismo de "caros" en Argentina que en Europa.
const ent = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const redondear = n => Math.round(n / 100) * 100;

export const MEJORAS = {
  nutri:  { icono: "🥗", nombre: "Nutricionista personal", desc: "Acumulás menos fatiga cada semana (−1,5 por nivel)." },
  fisio:  { icono: "🩺", nombre: "Fisioterapeuta personal", desc: "Menos riesgo de lesión entrenando (−15% por nivel) y te recuperás antes." },
  coach:  { icono: "🏋️", nombre: "Entrenador personal", desc: "Ganás experiencia de entrenamiento más rápido (+10% por nivel)." },
  psico:  { icono: "🧠", nombre: "Psicólogo deportivo", desc: "Tu forma se estabiliza más arriba (+4 por nivel)." },
  agente: { icono: "🤝", nombre: "Representante de primera línea", desc: "Menos riesgo al pedir más dinero en una renovación (−8% por nivel)." }
};
export const NIVEL_MAX = 3;
const SUELDOS_NIVEL = [6, 12, 20];   // cuántos sueldos mensuales cuesta cada nivel

export const BIENES = {
  auto:  { icono: "🚗", nombre: "Auto de lujo", sueldos: 10, desc: "Puro estilo. Suma a tu patrimonio." },
  depto: { icono: "🏢", nombre: "Departamento en alquiler", sueldos: 30, desc: "Te deja una renta del 10% de su precio al final de cada temporada." },
  casa:  { icono: "🏡", nombre: "Casa propia", sueldos: 40, desc: "Descansás mejor en tu casa: −1 de fatiga por semana." }
};
const RENTA_DEPTO = .10;

export const nuevasFinanzas = () => ({ mejoras: { nutri: 0, fisio: 0, coach: 0, psico: 0, agente: 0 }, bienes: [], fondo: 0 });
export const asegurarFin = p => { if (!p.finanzas) p.finanzas = nuevasFinanzas(); return p.finanzas; };
const base = p => Math.max(1500, p.contrato?.salario || 0);
export const tiene = (p, id) => asegurarFin(p).bienes.some(b => b.id === id);

export const costoMejora = (p, id) => { const n = asegurarFin(p).mejoras[id] || 0; return n >= NIVEL_MAX ? null : redondear(base(p) * SUELDOS_NIVEL[n]); };
export const costoBien = (p, id) => redondear(base(p) * BIENES[id].sueldos);
export const patrimonio = p => { const f = asegurarFin(p); return (p.ahorros || 0) + f.fondo + f.bienes.reduce((s, b) => s + b.precio, 0); };

// Devuelven un texto de error, o null si salió bien.
export function comprarMejora(p, id) {
  const f = asegurarFin(p), c = costoMejora(p, id);
  if (c == null) return "Ya está al máximo";
  if ((p.ahorros || 0) < c) return "No te alcanzan los ahorros";
  p.ahorros -= c; f.mejoras[id]++; return null;
}
export function comprarBien(p, id) {
  const f = asegurarFin(p), c = costoBien(p, id);
  if (tiene(p, id)) return "Ya lo tenés";
  if ((p.ahorros || 0) < c) return "No te alcanzan los ahorros";
  p.ahorros -= c; f.bienes.push({ id, precio: c, temporada: p.temporada }); return null;
}
export function operarFondo(p, accion) {
  const f = asegurarFin(p);
  if (accion === "ret") { if (!f.fondo) return "No hay nada invertido"; p.ahorros = (p.ahorros || 0) + f.fondo; f.fondo = 0; return null; }
  const monto = accion === "dep25" ? Math.round((p.ahorros || 0) * .25) : (p.ahorros || 0);
  if (monto <= 0) return "No tenés ahorros para invertir";
  p.ahorros -= monto; f.fondo += monto; return null;
}

// Efectos de las compras sobre el juego.
export function efectos(p) {
  const f = asegurarFin(p), m = f.mejoras;
  return {
    fatiga: -1.5 * m.nutri - (tiene(p, "casa") ? 1 : 0),   // se suma a la fatiga semanal
    formaBase: 60 + 4 * m.psico + ((p.vida?.felicidad ?? 60) - 60) * .1 + ((p.vida?.vestuario ?? 60) - 60) * .05 - (p.vida?.pareja === "modelo" ? 3 : 0),                            // nivel al que tiende la forma
    xp: 1 + .1 * m.coach,                                   // multiplicador de experiencia
    riesgo: 1 - .15 * m.fisio,                              // multiplicador del riesgo de lesión
    recup: .2 * m.fisio,                                    // chance semanal de recuperar un partido extra
    pedirMasFalla: .4 - .08 * m.agente                      // chance de que el club retire la oferta
  };
}

// Se llama una vez por temporada: cobra rentas y actualiza el fondo de inversión (entre −6% y +14%).
export function cierreFinanzas(p) {
  const f = asegurarFin(p);
  const renta = f.bienes.filter(b => b.id === "depto").reduce((s, b) => s + Math.round(b.precio * RENTA_DEPTO), 0);
  const pct = f.fondo > 0 ? ent(-6, 14) : 0, rend = Math.round(f.fondo * pct / 100);
  p.ahorros = (p.ahorros || 0) + renta; f.fondo += rend;
  return { renta, pct, rend };
}
