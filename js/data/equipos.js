// Editá estas listas cuando cambien los ascensos/descensos.
export const PRIMERA = ["Aldosivi","Argentinos Juniors","Atlético Tucumán","Banfield","Barracas Central","Belgrano","Boca Juniors","Central Córdoba (SdE)","Defensa y Justicia","Deportivo Riestra","Estudiantes (LP)","Estudiantes (RC)","Gimnasia (LP)","Gimnasia (M)","Huracán","Independiente","Independiente Rivadavia","Instituto","Lanús","Newell's","Platense","Racing Club","River Plate","Rosario Central","San Lorenzo","Sarmiento (J)","Talleres","Tigre","Unión","Vélez Sarsfield"];
export const NACIONAL = ["Agropecuario","Almagro","Almirante Brown","Alvarado","Atlanta","Chacarita","Chaco For Ever","Colegiales","Colón","Defensores de Belgrano","Deportivo Madryn","Deportivo Maipú","Deportivo Morón","Estudiantes (BA)","Ferro","Flandria","Gimnasia y Esgrima (J)","Gimnasia y Tiro","Godoy Cruz","Guillermo Brown","Güemes","Mitre (SdE)","Nueva Chicago","Patronato","Quilmes","Racing (Córdoba)","San Martín (SJ)","San Martín (T)","San Miguel","San Telmo","Temperley","Tristán Suárez","Villa Dálmine"];

// ---- Ligas europeas, temporada 2026/27 (listas oficiales con los ascensos y descensos de este año) ----
export const PREMIER = ["Arsenal","Aston Villa","Bournemouth","Brentford","Brighton","Chelsea","Coventry City","Crystal Palace","Everton","Fulham","Hull City","Ipswich Town","Leeds United","Liverpool","Manchester City","Manchester United","Newcastle United","Nottingham Forest","Sunderland","Tottenham Hotspur"];
export const LALIGA = ["Alavés","Athletic Club","Atlético de Madrid","Barcelona","Celta de Vigo","Deportivo La Coruña","Elche","Espanyol","Getafe","Levante","Málaga","Osasuna","Racing Santander","Rayo Vallecano","Real Betis","Real Madrid","Real Sociedad","Sevilla","Valencia","Villarreal"];
export const SERIE_A = ["Atalanta","Bologna","Cagliari","Como","Fiorentina","Frosinone","Genoa","Inter","Juventus","Lazio","Lecce","Milan","Monza","Napoli","Parma","Roma","Sassuolo","Torino","Udinese","Venezia"];
export const BUNDESLIGA = ["Augsburg","Bayer Leverkusen","Bayern München","Borussia Dortmund","Borussia Mönchengladbach","Eintracht Frankfurt","Elversberg","Freiburg","Hamburger SV","Hoffenheim","Köln","RB Leipzig","Mainz 05","Paderborn","Schalke 04","Stuttgart","Union Berlin","Werder Bremen"];
export const LIGUE_1 = ["Angers","Auxerre","Brest","Le Havre","Le Mans","Lens","Lille","Lorient","Lyon","Marseille","Monaco","Nice","Paris FC","Paris Saint-Germain","Rennes","Strasbourg","Toulouse","Troyes"];

// europa:true = liga europea con calendario simple (todos contra todos ida y vuelta). comp = nombre de la competición en el calendario.
export const LIGAS = [
  {id:"AR1",nombre:"Liga Profesional (Primera División)",equipos:PRIMERA},
  {id:"AR2",nombre:"Primera Nacional (Nacional B)",equipos:NACIONAL},
  {id:"EN1",nombre:"Premier League (Inglaterra)",comp:"Premier League",europa:true,equipos:PREMIER},
  {id:"ES1",nombre:"LaLiga (España)",comp:"LaLiga",europa:true,equipos:LALIGA},
  {id:"IT1",nombre:"Serie A (Italia)",comp:"Serie A",europa:true,equipos:SERIE_A},
  {id:"DE1",nombre:"Bundesliga (Alemania)",comp:"Bundesliga",europa:true,equipos:BUNDESLIGA},
  {id:"FR1",nombre:"Ligue 1 (Francia)",comp:"Ligue 1",europa:true,equipos:LIGUE_1}
];