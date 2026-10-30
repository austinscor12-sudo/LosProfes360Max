// Zonas de los torneos Apertura y Clausura 2026 (sorteo de la Liga Profesional, diciembre 2025).
// Los nombres tienen que coincidir EXACTO con los de data/equipos.js (PRIMERA).
export const ZONA_A = [
  "Boca Juniors", "San Lorenzo", "Independiente", "Deportivo Riestra", "Talleres",
  "Instituto", "Platense", "Vélez Sarsfield", "Estudiantes (LP)", "Gimnasia (M)",
  "Lanús", "Newell's", "Central Córdoba (SdE)", "Unión", "Defensa y Justicia"
];
export const ZONA_B = [
  "River Plate", "Huracán", "Racing Club", "Barracas Central", "Belgrano",
  "Estudiantes (RC)", "Argentinos Juniors", "Tigre", "Gimnasia (LP)", "Independiente Rivadavia",
  "Banfield", "Rosario Central", "Atlético Tucumán", "Sarmiento (J)", "Aldosivi"
];

// Interzonal 1 = "fecha de clásicos" (fecha 16). Clave: equipo de la zona A -> rival de la zona B.
export const CLASICOS = {
  // Confirmados en el sorteo
  "Boca Juniors": "River Plate", "Independiente": "Racing Club", "San Lorenzo": "Huracán",
  "Newell's": "Rosario Central", "Estudiantes (LP)": "Gimnasia (LP)", "Talleres": "Belgrano",
  "Lanús": "Banfield", "Gimnasia (M)": "Independiente Rivadavia", "Instituto": "Estudiantes (RC)",
  "Unión": "Sarmiento (J)",
  // APROXIMADOS (no pude confirmarlos): corregilos si sabés los reales
  "Platense": "Tigre", "Central Córdoba (SdE)": "Atlético Tucumán", "Vélez Sarsfield": "Argentinos Juniors",
  "Deportivo Riestra": "Aldosivi", "Defensa y Justicia": "Barracas Central"
};

// Interzonal 2 (se juega en la fecha libre de cada zona). Clave: zona A -> zona B.
export const INTERZONAL2 = {
  // Confirmados en el sorteo
  "Boca Juniors": "Racing Club", "Vélez Sarsfield": "River Plate", "Talleres": "Rosario Central",
  "Lanús": "Argentinos Juniors", "Independiente": "Independiente Rivadavia", "Deportivo Riestra": "Barracas Central",
  "Unión": "Aldosivi", "Defensa y Justicia": "Belgrano",
  // APROXIMADOS (no pude confirmarlos)
  "San Lorenzo": "Banfield", "Instituto": "Atlético Tucumán", "Platense": "Huracán",
  "Estudiantes (LP)": "Tigre", "Gimnasia (M)": "Estudiantes (RC)", "Newell's": "Sarmiento (J)",
  "Central Córdoba (SdE)": "Gimnasia (LP)"
};