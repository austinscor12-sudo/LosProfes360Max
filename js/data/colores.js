// Colores de cada club: "principal,secundario,dibujo" (v = rayas verticales, h = franja horizontal, d = franja diagonal, m = mitades, s = liso).
// Editá o agregá clubes acá: el nombre tiene que coincidir EXACTO con el de data/equipos.js.
const T = `Boca Juniors|#0a2a6b|#f7c600|h
River Plate|#f4f4f4|#d6202b|d
Racing Club|#6cc6f0|#ffffff|v
Independiente|#d8232a|#ffffff|s
San Lorenzo|#0d2f6e|#a3132b|v
Estudiantes (LP)|#d62027|#ffffff|v
Gimnasia (LP)|#12306b|#ffffff|v
Vélez Sarsfield|#f4f4f4|#0b3d91|d
Huracán|#f4f4f4|#d6202b|h
Lanús|#7a1f3d|#ffffff|s
Banfield|#1f8a3b|#ffffff|v
Newell's|#d6202b|#111111|m
Rosario Central|#12408f|#f7c600|v
Talleres|#12306b|#ffffff|v
Belgrano|#6cc6f0|#ffffff|h
Instituto|#d6202b|#ffffff|v
Argentinos Juniors|#d6202b|#ffffff|d
Atlético Tucumán|#6cc6f0|#ffffff|v
Defensa y Justicia|#1f8a3b|#f7c600|d
Platense|#6b3f1d|#ffffff|s
Unión|#d6202b|#ffffff|v
Tigre|#12306b|#d6202b|v
Sarmiento (J)|#1f8a3b|#ffffff|v
Aldosivi|#f7c600|#1f8a3b|v
Barracas Central|#d6202b|#ffffff|v
Central Córdoba (SdE)|#111111|#ffffff|v
Deportivo Riestra|#f4f4f4|#111111|v
Estudiantes (RC)|#d6202b|#ffffff|v
Gimnasia (M)|#f4f4f4|#111111|v
Independiente Rivadavia|#12408f|#ffffff|v
Godoy Cruz|#12408f|#ffffff|v
Colón|#d6202b|#111111|v
Almagro|#12408f|#ffffff|v
Atlanta|#12408f|#f7c600|v
Chacarita|#d6202b|#111111|v
Ferro|#1f8a3b|#ffffff|v
Nueva Chicago|#1f8a3b|#111111|v
Quilmes|#6cc6f0|#ffffff|v
Patronato|#d6202b|#111111|v
Temperley|#6cc6f0|#ffffff|v
Racing (Córdoba)|#6cc6f0|#ffffff|v
San Martín (SJ)|#1f8a3b|#111111|v
Arsenal|#d6202b|#ffffff|s
Aston Villa|#7a1f3d|#8fc7f0|s
Bournemouth|#d6202b|#111111|v
Brentford|#d6202b|#ffffff|v
Brighton|#12408f|#ffffff|v
Chelsea|#12408f|#ffffff|s
Coventry City|#6cc6f0|#ffffff|s
Crystal Palace|#12408f|#d6202b|v
Everton|#12408f|#ffffff|s
Fulham|#f4f4f4|#111111|s
Hull City|#f0a500|#111111|s
Ipswich Town|#12408f|#ffffff|s
Leeds United|#f4f4f4|#f7c600|h
Liverpool|#c8102e|#ffffff|s
Manchester City|#6cc6f0|#ffffff|s
Manchester United|#d6202b|#111111|s
Newcastle United|#111111|#ffffff|v
Nottingham Forest|#d6202b|#ffffff|s
Sunderland|#d6202b|#ffffff|v
Tottenham Hotspur|#f4f4f4|#132257|s
Alavés|#12408f|#ffffff|v
Athletic Club|#d6202b|#ffffff|v
Atlético de Madrid|#d6202b|#ffffff|v
Barcelona|#a50044|#004d98|v
Celta de Vigo|#8fc7f0|#ffffff|s
Deportivo La Coruña|#12408f|#ffffff|v
Elche|#f4f4f4|#1f8a3b|d
Espanyol|#12408f|#ffffff|v
Getafe|#12408f|#ffffff|s
Levante|#12408f|#d6202b|v
Málaga|#6cc6f0|#ffffff|s
Osasuna|#d6202b|#12306b|s
Racing Santander|#1f8a3b|#ffffff|s
Rayo Vallecano|#f4f4f4|#d6202b|d
Real Betis|#1f8a3b|#ffffff|v
Real Madrid|#f4f4f4|#febe10|h
Real Sociedad|#12408f|#ffffff|v
Sevilla|#f4f4f4|#d6202b|d
Valencia|#f4f4f4|#f08a00|d
Villarreal|#f7d000|#12408f|s
Atalanta|#111111|#12408f|v
Bologna|#a3132b|#12306b|v
Cagliari|#a3132b|#12306b|v
Como|#12408f|#ffffff|s
Fiorentina|#6a2c91|#ffffff|s
Frosinone|#f7c600|#12408f|s
Genoa|#a3132b|#12306b|m
Inter|#12408f|#111111|v
Juventus|#111111|#ffffff|v
Lazio|#8fc7f0|#ffffff|s
Lecce|#f7c600|#d6202b|v
Milan|#d6202b|#111111|v
Monza|#d6202b|#ffffff|s
Napoli|#2a8fd6|#ffffff|s
Parma|#f7c600|#12408f|s
Roma|#8a1c2b|#f2b705|s
Sassuolo|#1f8a3b|#111111|v
Torino|#7a1f3d|#ffffff|s
Udinese|#111111|#ffffff|v
Venezia|#111111|#f08a00|s
Augsburg|#d6202b|#1f8a3b|v
Bayer Leverkusen|#d6202b|#111111|s
Bayern München|#dc052d|#0066b2|s
Borussia Dortmund|#fde100|#111111|s
Borussia Mönchengladbach|#f4f4f4|#1f8a3b|s
Eintracht Frankfurt|#111111|#d6202b|v
Elversberg|#111111|#ffffff|s
Freiburg|#d6202b|#111111|s
Hamburger SV|#12408f|#ffffff|s
Hoffenheim|#12408f|#ffffff|s
Köln|#f4f4f4|#d6202b|s
RB Leipzig|#f4f4f4|#d6202b|s
Mainz 05|#d6202b|#ffffff|s
Paderborn|#12408f|#111111|v
Schalke 04|#0a4cc4|#ffffff|s
Stuttgart|#f4f4f4|#d6202b|h
Union Berlin|#d6202b|#ffffff|s
Werder Bremen|#1f8a3b|#ffffff|s
Angers|#111111|#ffffff|v
Auxerre|#12408f|#ffffff|s
Brest|#d6202b|#ffffff|s
Le Havre|#6cc6f0|#12306b|s
Le Mans|#f7c600|#d6202b|s
Lens|#d6202b|#f7c600|v
Lille|#d6202b|#12306b|s
Lorient|#f08a00|#111111|s
Lyon|#f4f4f4|#12408f|h
Marseille|#6cc6f0|#ffffff|s
Monaco|#d6202b|#ffffff|d
Nice|#d6202b|#111111|v
Paris FC|#12408f|#ffffff|s
Paris Saint-Germain|#0a1f5c|#da291c|h
Rennes|#d6202b|#111111|v
Strasbourg|#12408f|#ffffff|s
Toulouse|#6a2c91|#ffffff|s
Troyes|#12408f|#ffffff|s`;
const MAPA = {};
T.split("\n").forEach(l => { const [n, a, b, p] = l.split("|"); MAPA[n] = [a, b, p]; });

const hash = n => { const h = [...n].reduce((a, c) => a + c.charCodeAt(0) * 7, 0) % 360; return [`hsl(${h} 50% 36%)`, `hsl(${(h + 30) % 360} 55% 62%)`, "s"]; };
const lum = hex => { const m = /^#(..)(..)(..)$/.exec(hex); if (!m) return .3; const [r, g, b] = m.slice(1).map(x => parseInt(x, 16) / 255); return .2126 * r + .7152 * g + .0722 * b; };
export const coloresEquipo = n => MAPA[n] || hash(n);
export const colorEquipo = n => coloresEquipo(n)[0];

// Estilo en línea del escudo: fondo con los colores del club y letras que se leen bien encima.
export function escudoStyle(n) {
  const [a, b, p] = coloresEquipo(n);
  const bg = p === "v" ? `repeating-linear-gradient(90deg,${a} 0 9px,${b} 9px 18px)`
    : p === "h" ? `linear-gradient(${a} 0 30%,${b} 30% 70%,${a} 70%)`
    : p === "d" ? `linear-gradient(135deg,${a} 0 36%,${b} 36% 64%,${a} 64%)`
    : p === "m" ? `linear-gradient(90deg,${a} 50%,${b} 50%)` : a;
  const base = p === "h" || p === "d" ? b : a;
  const claro = lum(base) > .55;
  return `background:${bg};color:${claro ? "#111" : "#fff"};text-shadow:${claro ? "0 1px 0 rgba(255,255,255,.5)" : "0 1px 3px rgba(0,0,0,.7)"}`;
}
