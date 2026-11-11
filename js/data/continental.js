// Clubes sudamericanos (sin los argentinos) que juegan la Libertadores y la Sudamericana contra vos.
// [nombre, país, fuerza]. Misma escala que fuerza.js (River 78, Boca 76...). Son valores míos, NO oficiales: editalos a gusto.
// Los brasileros son los más fuertes (como en los últimos años), después van uruguayos, colombianos, ecuatorianos, chilenos y paraguayos.
export const CLUBES_SUD = [
  // Brasil
  ["Flamengo", "Brasil", 80], ["Palmeiras", "Brasil", 80], ["Botafogo", "Brasil", 76], ["Atlético Mineiro", "Brasil", 75],
  ["Fluminense", "Brasil", 74], ["Cruzeiro", "Brasil", 74], ["São Paulo", "Brasil", 73], ["Corinthians", "Brasil", 73],
  ["Internacional", "Brasil", 73], ["Grêmio", "Brasil", 72], ["Bahia", "Brasil", 71], ["Vasco da Gama", "Brasil", 70],
  ["Santos", "Brasil", 69], ["Fortaleza", "Brasil", 69], ["Athletico Paranaense", "Brasil", 69], ["Red Bull Bragantino", "Brasil", 68],
  ["Mirassol", "Brasil", 66], ["Juventude", "Brasil", 62],
  // Uruguay
  ["Peñarol", "Uruguay", 70], ["Nacional (URU)", "Uruguay", 70], ["Defensor Sporting", "Uruguay", 62], ["Liverpool (URU)", "Uruguay", 61], ["Montevideo City Torque", "Uruguay", 60],
  // Colombia
  ["Atlético Nacional", "Colombia", 69], ["Millonarios", "Colombia", 66], ["Junior", "Colombia", 65], ["América de Cali", "Colombia", 64],
  ["Independiente Medellín", "Colombia", 63], ["Santa Fe", "Colombia", 62], ["Deportes Tolima", "Colombia", 62], ["Deportivo Cali", "Colombia", 61],
  ["Once Caldas", "Colombia", 58], ["Bucaramanga", "Colombia", 58],
  // Ecuador
  ["Liga de Quito", "Ecuador", 68], ["Independiente del Valle", "Ecuador", 68], ["Barcelona SC", "Ecuador", 65], ["Emelec", "Ecuador", 60],
  ["Universidad Católica (ECU)", "Ecuador", 58], ["Aucas", "Ecuador", 57],
  // Chile
  ["Universidad de Chile", "Chile", 67], ["Colo-Colo", "Chile", 66], ["Universidad Católica (CHI)", "Chile", 66], ["Coquimbo Unido", "Chile", 62],
  ["Palestino", "Chile", 60], ["Huachipato", "Chile", 58], ["Cobresal", "Chile", 58],
  // Paraguay
  ["Olimpia", "Paraguay", 66], ["Cerro Porteño", "Paraguay", 66], ["Libertad", "Paraguay", 66], ["Nacional (PAR)", "Paraguay", 60],
  ["Guaraní", "Paraguay", 59], ["Sportivo Luqueño", "Paraguay", 56],
  // Perú
  ["Universitario", "Perú", 63], ["Alianza Lima", "Perú", 62], ["Sporting Cristal", "Perú", 62], ["Melgar", "Perú", 58], ["Cusco FC", "Perú", 56],
  // Bolivia
  ["Bolívar", "Bolivia", 60], ["The Strongest", "Bolivia", 59], ["Always Ready", "Bolivia", 56], ["Blooming", "Bolivia", 54],
  ["Independiente Petrolero", "Bolivia", 52], ["Oriente Petrolero", "Bolivia", 52],
  // Venezuela
  ["Carabobo", "Venezuela", 56], ["Deportivo Táchira", "Venezuela", 54], ["Monagas", "Venezuela", 54], ["Caracas FC", "Venezuela", 54], ["Universidad Central", "Venezuela", 52]
];

export const FUERZA_SUD = Object.fromEntries(CLUBES_SUD.map(([n, , f]) => [n, f]));
export const PAIS_SUD = Object.fromEntries(CLUBES_SUD.map(([n, p]) => [n, p]));

// Argentinos que jugaron las copas en 2026 (para la primera temporada del juego; de ahí en adelante se clasifican según tu liga).
export const COPAS_2026 = {
  lib: [
    { club: "Estudiantes (LP)", fase: "Fase de grupos", motivo: "Clasificado a la Libertadores 2026" },
    { club: "Platense", fase: "Fase de grupos", motivo: "Clasificado a la Libertadores 2026" },
    { club: "Boca Juniors", fase: "Fase de grupos", motivo: "Clasificado a la Libertadores 2026" },
    { club: "Rosario Central", fase: "Fase de grupos", motivo: "Clasificado a la Libertadores 2026" },
    { club: "Lanús", fase: "Fase de grupos", motivo: "Campeón de la Copa Sudamericana 2025" },
    { club: "Argentinos Juniors", fase: "Fase previa", motivo: "Clasificado a la Libertadores 2026" }
  ],
  sud: ["River Plate", "Racing Club", "Deportivo Riestra", "San Lorenzo", "Tigre", "Barracas Central"]
    .map(club => ({ club, fase: "Fase de grupos", motivo: "Clasificado a la Sudamericana 2026" })),
  // Campeones de 2025: juegan la Recopa 2026 (Flamengo vs Lanús)
  campeones2025: { lib: "Flamengo", sud: "Lanús" }
};
