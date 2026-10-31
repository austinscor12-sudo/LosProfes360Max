import { PRIMERA } from "./equipos.js";

// Nivel aproximado de cada equipo (escala ~50-80). Son valores míos, NO oficiales: editalos a gusto.
export const FUERZA = {
  "River Plate": 78, "Boca Juniors": 76, "Estudiantes (LP)": 75, "Racing Club": 72,
  "Vélez Sarsfield": 71, "Rosario Central": 71, "Talleres": 70, "Lanús": 70,
  "Independiente": 69, "Huracán": 68, "Independiente Rivadavia": 68, "Argentinos Juniors": 67,
  "San Lorenzo": 66, "Belgrano": 66, "Newell's": 64, "Platense": 63, "Instituto": 63,
  "Unión": 63, "Banfield": 63, "Gimnasia (LP)": 62, "Defensa y Justicia": 62,
  "Central Córdoba (SdE)": 62, "Atlético Tucumán": 62, "Godoy Cruz": 62, "Barracas Central": 60,
  "Tigre": 60, "Estudiantes (RC)": 58, "Gimnasia (M)": 58, "Deportivo Riestra": 58,
  "Aldosivi": 58, "Sarmiento (J)": 57
};

// Los equipos de Primera Nacional sin valor propio rinden como un equipo de ascenso (54).
export const fuerzaDe = nombre => FUERZA[nombre] ?? (PRIMERA.includes(nombre) ? 64 : 54);

// ---- Usado por la simulación de partidos (simulacion.js) y la evolución (evolucion.js) ----
export const fuerzaEquipo = fuerzaDe;
// "Nivel de plantel": se compara con la valoración del jugador para saber si es titular, suplente, etc.
export const nivelPlantel = n => fuerzaDe(n) - 8;

export const INICIALES = ["A", "C", "D", "E", "F", "G", "J", "L", "M", "N", "P", "R", "S", "T"];
export const APELLIDOS = ["Fernández", "Gómez", "Rodríguez", "López", "Martínez", "González", "Pérez", "Sánchez", "Romero", "Díaz", "Álvarez", "Torres", "Ruiz", "Ramírez", "Flores", "Acosta", "Benítez", "Medina", "Herrera", "Suárez", "Aguirre", "Giménez", "Gutiérrez", "Peralta", "Rojas", "Ortiz", "Silva", "Núñez", "Luna", "Cabrera", "Ríos", "Ledesma", "Correa", "Vega", "Molina", "Castro", "Villalba", "Paz", "Sosa", "Ibarra"];