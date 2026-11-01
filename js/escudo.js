import { esc } from "./util.js";

// ============================================================
// ESCUDOS DE EQUIPO
// Cada equipo tiene un escudo generado con sus colores.
// Si querés el escudo oficial de un club, guardá la imagen en img/escudos/
// y agregala en IMAGENES (el nombre tiene que ser IGUAL al de data/equipos.js).
// ============================================================

// Ejemplo: "Boca Juniors": "img/escudos/boca.png"
export const IMAGENES = {
};

// [color principal, color secundario, diseño]
// Diseños: l = liso con borde, v = barras verticales, m = mitades, c = franja horizontal,
//          b = banda diagonal, p = palo vertical al medio.
// Los equipos que no estén acá reciben colores propios, siempre los mismos.
export const COLORES = {
  // Liga Profesional
  "Aldosivi": ["#f2d41a", "#1f7a3a", "v"], "Argentinos Juniors": ["#d0202a", "#ffffff", "v"], "Atlético Tucumán": ["#6fb7e8", "#ffffff", "v"],
  "Banfield": ["#1b7a3a", "#ffffff", "v"], "Barracas Central": ["#d0202a", "#ffffff", "v"], "Belgrano": ["#58b6ea", "#ffffff", "l"],
  "Boca Juniors": ["#0b3a8f", "#f5c518", "c"], "Central Córdoba (SdE)": ["#111111", "#ffffff", "v"], "Defensa y Justicia": ["#1f8a3b", "#f2d41a", "m"],
  "Deportivo Riestra": ["#111111", "#ffffff", "v"], "Estudiantes (LP)": ["#d0202a", "#ffffff", "v"], "Gimnasia (LP)": ["#ffffff", "#14337a", "v"],
  "Gimnasia (M)": ["#111111", "#ffffff", "v"], "Huracán": ["#ffffff", "#d0202a", "l"], "Independiente": ["#d0202a", "#ffffff", "l"],
  "Independiente Rivadavia": ["#0b3a8f", "#ffffff", "v"], "Instituto": ["#d0202a", "#ffffff", "v"], "Lanús": ["#7a1230", "#ffffff", "l"],
  "Newell's": ["#d0202a", "#111111", "m"], "Platense": ["#6b3d1f", "#ffffff", "l"], "Racing Club": ["#74c1ee", "#ffffff", "v"],
  "River Plate": ["#ffffff", "#d0202a", "b"], "Rosario Central": ["#0b3a8f", "#f5c518", "m"], "San Lorenzo": ["#0b3a8f", "#c1121f", "v"],
  "Sarmiento (J)": ["#1f8a3b", "#ffffff", "l"], "Talleres": ["#0b3a8f", "#ffffff", "v"], "Tigre": ["#0b3a8f", "#d0202a", "m"],
  "Unión": ["#d0202a", "#ffffff", "v"], "Vélez Sarsfield": ["#ffffff", "#0b3a8f", "b"],
  // Primera Nacional
  "Almagro": ["#0b3a8f", "#ffffff", "v"], "Almirante Brown": ["#f2d41a", "#111111", "v"], "Atlanta": ["#0b3a8f", "#f5c518", "v"],
  "Colón": ["#d0202a", "#111111", "v"], "Ferro": ["#1b7a3a", "#ffffff", "l"], "Godoy Cruz": ["#0b3a8f", "#ffffff", "v"],
  "Nueva Chicago": ["#1b7a3a", "#111111", "v"], "Quilmes": ["#ffffff", "#0b3a8f", "v"], "Temperley": ["#74c1ee", "#ffffff", "v"],
  "Patronato": ["#111111", "#d0202a", "v"], "San Martín (SJ)": ["#1b7a3a", "#111111", "v"], "San Martín (T)": ["#d0202a", "#111111", "v"],
  "Racing (Córdoba)": ["#74c1ee", "#ffffff", "v"],
  // Premier League
  "Arsenal": ["#d0202a", "#ffffff", "l"], "Aston Villa": ["#7a1f3d", "#95bfe5", "m"], "Bournemouth": ["#d0202a", "#111111", "v"],
  "Brentford": ["#d0202a", "#ffffff", "v"], "Brighton": ["#0057b8", "#ffffff", "v"], "Chelsea": ["#034694", "#ffffff", "l"],
  "Coventry City": ["#7ec8f2", "#ffffff", "l"], "Crystal Palace": ["#1b458f", "#c4122e", "v"], "Everton": ["#003399", "#ffffff", "l"],
  "Fulham": ["#ffffff", "#111111", "l"], "Hull City": ["#f5a21d", "#111111", "v"], "Ipswich Town": ["#0b4aa2", "#ffffff", "l"],
  "Leeds United": ["#ffffff", "#1d428a", "l"], "Liverpool": ["#c8102e", "#ffffff", "l"], "Manchester City": ["#6cabdd", "#ffffff", "l"],
  "Manchester United": ["#da291c", "#fbe122", "l"], "Newcastle United": ["#111111", "#ffffff", "v"], "Nottingham Forest": ["#dd0000", "#ffffff", "l"],
  "Sunderland": ["#eb172b", "#ffffff", "v"], "Tottenham Hotspur": ["#132257", "#ffffff", "l"],
  // LaLiga y Segunda
  "Alavés": ["#0b3a8f", "#ffffff", "v"], "Athletic Club": ["#d0202a", "#ffffff", "v"], "Atlético de Madrid": ["#cb3524", "#ffffff", "v"],
  "Barcelona": ["#004d98", "#a50044", "v"], "Celta de Vigo": ["#8ac3ee", "#ffffff", "l"], "Deportivo La Coruña": ["#0b3a8f", "#ffffff", "v"],
  "Elche": ["#ffffff", "#1b7a3a", "l"], "Espanyol": ["#0b4aa2", "#ffffff", "v"], "Getafe": ["#005999", "#ffffff", "l"],
  "Levante": ["#0b3a8f", "#a50034", "v"], "Málaga": ["#4ea8de", "#ffffff", "l"], "Osasuna": ["#d0202a", "#0a1a4a", "l"],
  "Racing Santander": ["#1b7a3a", "#ffffff", "l"], "Rayo Vallecano": ["#ffffff", "#d0202a", "b"], "Real Betis": ["#00954c", "#ffffff", "v"],
  "Real Madrid": ["#ffffff", "#febe10", "l"], "Real Sociedad": ["#0b4aa2", "#ffffff", "v"], "Sevilla": ["#ffffff", "#d0202a", "l"],
  "Valencia": ["#ffffff", "#111111", "m"], "Villarreal": ["#fbe122", "#005187", "l"],
  "Albacete": ["#ffffff", "#d0202a", "l"], "Almería": ["#d0202a", "#ffffff", "v"], "Burgos": ["#ffffff", "#111111", "l"],
  "Cádiz": ["#fbe122", "#0b3a8f", "l"], "Castellón": ["#111111", "#ffffff", "v"], "Córdoba": ["#1b7a3a", "#ffffff", "v"],
  "Eibar": ["#0b3a8f", "#a50034", "v"], "Girona": ["#d0202a", "#ffffff", "v"], "Granada": ["#d0202a", "#ffffff", "v"],
  "Las Palmas": ["#fbe122", "#0b3a8f", "l"], "Leganés": ["#0b4aa2", "#ffffff", "v"], "Mallorca": ["#d0202a", "#111111", "v"],
  "Real Oviedo": ["#0b3a8f", "#ffffff", "l"], "Real Valladolid": ["#6b2a8f", "#ffffff", "v"], "Sabadell": ["#0b3a8f", "#ffffff", "v"],
  "Sporting Gijón": ["#d0202a", "#ffffff", "v"], "Tenerife": ["#ffffff", "#0b3a8f", "l"], "Celta Fortuna": ["#8ac3ee", "#ffffff", "l"],
  "Real Sociedad II": ["#0b4aa2", "#ffffff", "v"],
  "Alcorcón": ["#f5c518", "#0b3a8f", "l"], "Hércules": ["#0b3a8f", "#ffffff", "v"], "Nàstic de Tarragona": ["#7a1230", "#ffffff", "l"],
  "Real Murcia": ["#d0202a", "#ffffff", "l"], "Mirandés": ["#d0202a", "#111111", "v"], "Ponferradina": ["#0b3a8f", "#ffffff", "v"],
  "Cartagena": ["#111111", "#ffffff", "v"], "Lugo": ["#d0202a", "#ffffff", "v"], "Recreativo de Huelva": ["#0b3a8f", "#ffffff", "v"],
  // Serie A
  "Atalanta": ["#111111", "#1e71b8", "v"], "Bologna": ["#a50034", "#0b3a8f", "v"], "Cagliari": ["#a50034", "#0b3a8f", "v"],
  "Como": ["#0b3a8f", "#ffffff", "l"], "Fiorentina": ["#5b2a8f", "#ffffff", "l"], "Frosinone": ["#f5c518", "#0b3a8f", "l"],
  "Genoa": ["#a50034", "#0b3a8f", "m"], "Inter": ["#111111", "#0b3a8f", "v"], "Juventus": ["#111111", "#ffffff", "v"],
  "Lazio": ["#8ac3ee", "#ffffff", "l"], "Lecce": ["#f5c518", "#d0202a", "v"], "Milan": ["#d0202a", "#111111", "v"],
  "Monza": ["#d0202a", "#ffffff", "l"], "Napoli": ["#12a0d7", "#ffffff", "l"], "Parma": ["#f5c518", "#0b3a8f", "v"],
  "Roma": ["#8e1f2f", "#f5a21d", "m"], "Sassuolo": ["#1b7a3a", "#111111", "v"], "Torino": ["#7a1230", "#ffffff", "l"],
  "Udinese": ["#ffffff", "#111111", "v"], "Venezia": ["#111111", "#1b7a3a", "v"],
  // Bundesliga
  "Augsburg": ["#d0202a", "#1b7a3a", "v"], "Bayer Leverkusen": ["#e32221", "#111111", "l"], "Bayern München": ["#dc052d", "#0066b2", "l"],
  "Borussia Dortmund": ["#fde100", "#111111", "l"], "Borussia Mönchengladbach": ["#ffffff", "#1b7a3a", "l"], "Eintracht Frankfurt": ["#111111", "#e1000f", "l"],
  "Freiburg": ["#d0202a", "#111111", "l"], "Hamburger SV": ["#0b3a8f", "#ffffff", "l"], "Hoffenheim": ["#1961b5", "#ffffff", "l"],
  "Köln": ["#d0202a", "#ffffff", "l"], "RB Leipzig": ["#dd0741", "#ffffff", "l"], "Mainz 05": ["#c3141e", "#ffffff", "l"],
  "Paderborn": ["#0b3a8f", "#111111", "v"], "Schalke 04": ["#004d9d", "#ffffff", "l"], "Stuttgart": ["#ffffff", "#e32219", "l"],
  "Union Berlin": ["#eb1923", "#ffffff", "l"], "Werder Bremen": ["#1d9053", "#ffffff", "l"],
  // Ligue 1
  "Angers": ["#111111", "#ffffff", "v"], "Auxerre": ["#0b3a8f", "#ffffff", "v"], "Brest": ["#d0202a", "#ffffff", "l"],
  "Le Havre": ["#6cabdd", "#0b3a8f", "l"], "Le Mans": ["#f5c518", "#d0202a", "v"], "Lens": ["#f5c518", "#d0202a", "v"],
  "Lille": ["#d0202a", "#0b3a8f", "l"], "Lorient": ["#f58220", "#111111", "l"], "Lyon": ["#ffffff", "#0b3a8f", "l"],
  "Marseille": ["#ffffff", "#2faee0", "l"], "Monaco": ["#d0202a", "#ffffff", "b"], "Nice": ["#d0202a", "#111111", "v"],
  "Paris FC": ["#0b3a8f", "#ffffff", "l"], "Paris Saint-Germain": ["#004170", "#da291c", "p"], "Rennes": ["#d0202a", "#111111", "v"],
  "Strasbourg": ["#0b3a8f", "#ffffff", "l"], "Toulouse": ["#5b2a8f", "#ffffff", "l"], "Troyes": ["#0b3a8f", "#ffffff", "l"],
  // Selecciones (las de la Selección Argentina, Copa América y Mundial)
  "Argentina": ["#74c1ee", "#ffffff", "v"], "Brasil": ["#f5c518", "#1b7a3a", "l"], "Uruguay": ["#74c1ee", "#111111", "l"],
  "Colombia": ["#f5c518", "#0b3a8f", "c"], "Ecuador": ["#f5c518", "#0b3a8f", "l"], "Paraguay": ["#d0202a", "#ffffff", "v"],
  "Chile": ["#d0202a", "#0b3a8f", "l"], "Perú": ["#ffffff", "#d0202a", "b"], "Venezuela": ["#7a1230", "#f5c518", "l"],
  "Bolivia": ["#1b7a3a", "#d0202a", "l"], "Francia": ["#0b3a8f", "#d0202a", "l"], "España": ["#d0202a", "#f5c518", "l"],
  "Inglaterra": ["#ffffff", "#c8102e", "p"], "Alemania": ["#ffffff", "#111111", "l"], "Italia": ["#0b5ed7", "#ffffff", "l"],
  "Portugal": ["#a50034", "#1b7a3a", "m"], "Países Bajos": ["#f58220", "#ffffff", "l"], "Bélgica": ["#d0202a", "#111111", "v"],
  "Croacia": ["#ffffff", "#d0202a", "v"], "México": ["#1b7a3a", "#d0202a", "v"], "Estados Unidos": ["#0b3a8f", "#d0202a", "v"],
  "Canadá": ["#d0202a", "#ffffff", "p"], "Japón": ["#0b3a8f", "#ffffff", "l"], "Marruecos": ["#c1121f", "#1b7a3a", "l"]
};

const SHIELD = "M6 6H94V56C94 84 72 102 50 110C28 102 6 84 6 56Z";
const DISENOS = ["v", "m", "c", "b", "p", "l"];
let contador = 0;

const hash = n => [...String(n)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const hex = (h, s, l) => {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = n => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))))).toString(16).padStart(2, "0");
  return `#${f(0)}${f(8)}${f(4)}`;
};
const brillo = c => { const n = parseInt(c.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };

function colores(nombre) {
  if (COLORES[nombre]) return COLORES[nombre];
  const h = hash(nombre), tono = h % 360;
  return [hex(tono, 62, 36), (h >> 3) % 2 ? "#f2f5ef" : hex((tono + 40) % 360, 70, 62), DISENOS[(h >> 5) % DISENOS.length]];
}

// Siglas: "Boca Juniors" → BJ · "Aldosivi" → ALD · "Estudiantes (LP)" → ELP
export function sigla(nombre) {
  const par = (nombre.match(/\(([^)]*)\)/) || [])[1] || "";
  const base = nombre.replace(/\(.*?\)/g, "").trim().split(/\s+/).filter(w => w && !/^(y|de|del|la|el)$/i.test(w));
  const ini = base.length === 1 && !par ? base[0].slice(0, 3) : base.map(w => w[0]).join("");
  const extra = par ? (par.length <= 3 ? par : par[0]) : "";
  return (ini + extra).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().slice(0, 3);
}

function dibujo(d, c1, c2) {
  switch (d) {
    case "v": return `<rect x="6" y="0" width="88" height="120" fill="${c1}"/><rect x="23.6" y="0" width="17.6" height="120" fill="${c2}"/><rect x="58.8" y="0" width="17.6" height="120" fill="${c2}"/>`;
    case "m": return `<rect x="0" y="0" width="100" height="120" fill="${c1}"/><rect x="50" y="0" width="50" height="120" fill="${c2}"/>`;
    case "c": return `<rect x="0" y="0" width="100" height="120" fill="${c1}"/><rect x="0" y="38" width="100" height="28" fill="${c2}"/>`;
    case "b": return `<rect x="0" y="0" width="100" height="120" fill="${c1}"/><polygon points="0,14 0,44 100,96 100,66" fill="${c2}"/>`;
    case "p": return `<rect x="0" y="0" width="100" height="120" fill="${c1}"/><rect x="42" y="0" width="16" height="120" fill="${c2}"/>`;
    default: return `<rect x="0" y="0" width="100" height="120" fill="${c1}"/><path d="${SHIELD}" transform="translate(50 58) scale(.84) translate(-50 -58)" fill="none" stroke="${c2}" stroke-width="3.2"/>`;
  }
}

// escudo("Boca Juniors", 44, "margin-right:6px") → HTML listo para meter en un template
export function escudo(nombre, tam = 44, estilo = "") {
  const alto = Math.round(tam * 1.12), nom = esc(nombre);
  if (IMAGENES[nombre]) return `<img src="${esc(IMAGENES[nombre])}" alt="${nom}" width="${tam}" height="${alto}" style="object-fit:contain;${estilo}">`;
  const [c1, c2, d] = colores(nombre), id = `esc${++contador}`;
  const txt = brillo(c1) > .6 ? "#111111" : "#ffffff", borde = txt === "#111111" ? "#ffffff" : "#111111";
  const s = sigla(nombre), fs = s.length === 1 ? 46 : s.length === 2 ? 38 : 30, y = 60 + fs * .18;
  const fuente = "Anton,Impact,'Arial Narrow Bold',sans-serif";
  return `<svg role="img" aria-label="${nom}" viewBox="0 0 100 116" width="${tam}" height="${alto}" style="display:inline-block;flex:none;filter:drop-shadow(0 3px 4px rgba(0,0,0,.45));${estilo}">
    <defs><clipPath id="${id}c"><path d="${SHIELD}"/></clipPath><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
    <g clip-path="url(#${id}c)">${dibujo(d, c1, c2)}<rect x="0" y="0" width="100" height="120" fill="url(#${id}g)"/></g>
    <path d="${SHIELD}" fill="none" stroke="rgba(0,0,0,.6)" stroke-width="4"/>
    <text x="50" y="${y}" text-anchor="middle" font-family="${fuente}" font-size="${fs}" fill="${borde}" stroke="${borde}" stroke-width="4" stroke-linejoin="round">${s}</text>
    <text x="50" y="${y}" text-anchor="middle" font-family="${fuente}" font-size="${fs}" fill="${txt}">${s}</text>
  </svg>`;
}