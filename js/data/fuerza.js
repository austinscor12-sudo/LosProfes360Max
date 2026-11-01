import { PRIMERA } from "./equipos.js";
import { FUERZA_SEL } from "./selecciones.js";

// Nivel aproximado de cada equipo (escala ~50-80). Son valores míos, NO oficiales: editalos a gusto.
export const FUERZA = {
  "River Plate": 78, "Boca Juniors": 76, "Estudiantes (LP)": 75, "Racing Club": 72,
  "Vélez Sarsfield": 71, "Rosario Central": 71, "Talleres": 70, "Lanús": 70,
  "Independiente": 69, "Huracán": 68, "Independiente Rivadavia": 68, "Argentinos Juniors": 67,
  "San Lorenzo": 66, "Belgrano": 66, "Newell's": 64, "Platense": 63, "Instituto": 63,
  "Unión": 63, "Banfield": 63, "Gimnasia (LP)": 62, "Defensa y Justicia": 62,
  "Central Córdoba (SdE)": 62, "Atlético Tucumán": 62, "Godoy Cruz": 62, "Barracas Central": 60,
  "Tigre": 60, "Estudiantes (RC)": 58, "Gimnasia (M)": 58, "Deportivo Riestra": 58,
  "Aldosivi": 58, "Sarmiento (J)": 57,
  // ---- Europa (también valores míos, misma escala que la argentina: hasta el club europeo más flojo es parecido a un club argentino de mitad de tabla para arriba) ----
  // Premier League
  "Manchester City": 89, "Arsenal": 89, "Liverpool": 88, "Chelsea": 85, "Manchester United": 84, "Tottenham Hotspur": 84,
  "Newcastle United": 83, "Aston Villa": 82, "Crystal Palace": 79, "Brighton": 79, "Nottingham Forest": 78, "Bournemouth": 78,
  "Brentford": 78, "Everton": 78, "Fulham": 78, "Leeds United": 77, "Sunderland": 75, "Coventry City": 73, "Ipswich Town": 72, "Hull City": 71,
  // LaLiga
  "Real Madrid": 89, "Barcelona": 89, "Atlético de Madrid": 85, "Athletic Club": 81, "Villarreal": 80, "Real Sociedad": 79, "Real Betis": 79,
  "Sevilla": 77, "Valencia": 76, "Celta de Vigo": 76, "Osasuna": 74, "Getafe": 73, "Rayo Vallecano": 73, "Espanyol": 72, "Alavés": 71,
  "Elche": 71, "Levante": 71, "Deportivo La Coruña": 70, "Racing Santander": 69, "Málaga": 69,
  // Segunda División (LaLiga Hypermotion) 2026/27: valores míos, un escalón por debajo de LaLiga
  "Girona": 68, "Mallorca": 68, "Real Oviedo": 66, "Almería": 66, "Granada": 66, "Las Palmas": 66, "Eibar": 65, "Real Valladolid": 65,
  "Leganés": 65, "Sporting Gijón": 65, "Castellón": 65, "Cádiz": 64, "Burgos": 64, "Córdoba": 64, "Tenerife": 64, "FC Andorra": 63,
  "Albacete": 62, "Sabadell": 62, "Eldense": 62, "Ceuta": 61, "Celta Fortuna": 60, "Real Sociedad II": 60,
  // Tercera categoría y clubes de categorías inferiores (Copa del Rey)
  "Cultural Leonesa": 58, "Mirandés": 58, "Real Murcia": 57, "Ponferradina": 57, "Hércules": 56, "Nàstic de Tarragona": 56,
  "Unionistas de Salamanca": 55, "Racing de Ferrol": 55, "Alcorcón": 55, "Zamora": 54, "Real Unión": 54, "Pontevedra": 54, "Fuenlabrada": 54,
  "Ibiza": 54, "Atlético Baleares": 54, "Barakaldo": 53, "Arenteiro": 53, "Alcoyano": 53, "Sestao River": 52, "Ourense": 52,
  "Lugo": 52, "Cartagena": 52, "Algeciras": 51, "Recreativo de Huelva": 51, "Antequera": 50, "Intercity": 50, "Sanluqueño": 49, "Linares": 49,
  "Teruel": 49, "Logroñés": 49, "Tarazona": 48, "Mérida": 48, "Marbella": 48, "Calahorra": 47, "Talavera": 47, "Cacereño": 47,
  // Serie A
  "Inter": 87, "Napoli": 85, "Juventus": 84, "Milan": 84, "Roma": 82, "Atalanta": 82, "Como": 79, "Lazio": 79, "Fiorentina": 78, "Bologna": 78,
  "Torino": 75, "Genoa": 74, "Udinese": 74, "Sassuolo": 73, "Parma": 72, "Cagliari": 71, "Lecce": 71, "Monza": 70, "Venezia": 70, "Frosinone": 69,
  // Bundesliga
  "Bayern München": 90, "Borussia Dortmund": 85, "Bayer Leverkusen": 85, "RB Leipzig": 84, "Stuttgart": 81, "Eintracht Frankfurt": 80,
  "Hoffenheim": 78, "Freiburg": 77, "Borussia Mönchengladbach": 75, "Mainz 05": 74, "Union Berlin": 74, "Werder Bremen": 74,
  "Hamburger SV": 73, "Augsburg": 72, "Köln": 72, "Schalke 04": 71, "Paderborn": 69, "Elversberg": 68,
  // Ligue 1
  "Paris Saint-Germain": 88, "Monaco": 81, "Marseille": 80, "Lille": 79, "Lyon": 79, "Lens": 78, "Nice": 77, "Rennes": 77, "Strasbourg": 76,
  "Brest": 74, "Toulouse": 73, "Paris FC": 72, "Auxerre": 71, "Angers": 70, "Lorient": 70, "Le Havre": 69, "Troyes": 68, "Le Mans": 67,
  // Selecciones nacionales (ver selecciones.js)
  ...FUERZA_SEL
};

// Los equipos de Primera Nacional sin valor propio rinden como un equipo de ascenso (54).
export const fuerzaDe = nombre => FUERZA[nombre] ?? (PRIMERA.includes(nombre) ? 64 : 54);

// ---- Usado por la simulación de partidos (simulacion.js) y la evolución (evolucion.js) ----
export const fuerzaEquipo = fuerzaDe;
// "Nivel de plantel": se compara con la valoración del jugador para saber si es titular, suplente, etc.
export const nivelPlantel = n => fuerzaDe(n) - 8;

export const INICIALES = ["A", "C", "D", "E", "F", "G", "J", "L", "M", "N", "P", "R", "S", "T"];
export const APELLIDOS = ["Fernández", "Gómez", "Rodríguez", "López", "Martínez", "González", "Pérez", "Sánchez", "Romero", "Díaz", "Álvarez", "Torres", "Ruiz", "Ramírez", "Flores", "Acosta", "Benítez", "Medina", "Herrera", "Suárez", "Aguirre", "Giménez", "Gutiérrez", "Peralta", "Rojas", "Ortiz", "Silva", "Núñez", "Luna", "Cabrera", "Ríos", "Ledesma", "Correa", "Vega", "Molina", "Castro", "Villalba", "Paz", "Sosa", "Ibarra"];