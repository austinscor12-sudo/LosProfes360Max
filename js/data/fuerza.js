import { PRIMERA } from "./equipos.js";

// Fuerza de cada equipo (escala ~55-85). El "nivel de plantel" se compara con la valoración del jugador.
const GRANDES = ["River Plate", "Boca Juniors"];
const ALTOS = ["Racing Club", "Estudiantes (LP)", "Vélez Sarsfield", "Rosario Central", "Talleres", "Independiente", "San Lorenzo"];
const MEDIOS = ["Lanús", "Huracán", "Argentinos Juniors", "Belgrano", "Defensa y Justicia", "Godoy Cruz", "Newell's", "Unión", "Independiente Rivadavia", "Banfield", "Platense"];
const NAC_FUERTES = ["Colón", "Atlanta", "Chacarita", "Quilmes", "Almagro", "Ferro", "Nueva Chicago", "Temperley", "Patronato", "San Martín (T)"];

const hash = n => [...n].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 997, 7);

export function fuerzaEquipo(n) {
  const base = GRANDES.includes(n) ? 82 : ALTOS.includes(n) ? 76 : MEDIOS.includes(n) ? 71
    : PRIMERA.includes(n) ? 66 : NAC_FUERTES.includes(n) ? 62 : 57;
  return base + (hash(n) % 5) - 2;
}
export const nivelPlantel = n => fuerzaEquipo(n) - 14;

export const INICIALES = ["A", "C", "D", "E", "F", "G", "J", "L", "M", "N", "P", "R", "S", "T"];
export const APELLIDOS = ["Fernández", "Gómez", "Rodríguez", "López", "Martínez", "González", "Pérez", "Sánchez", "Romero", "Díaz", "Álvarez", "Torres", "Ruiz", "Ramírez", "Flores", "Acosta", "Benítez", "Medina", "Herrera", "Suárez", "Aguirre", "Giménez", "Gutiérrez", "Peralta", "Rojas", "Ortiz", "Silva", "Núñez", "Luna", "Cabrera", "Ríos", "Ledesma", "Correa", "Vega", "Molina", "Castro", "Villalba", "Paz", "Sosa", "Ibarra"];