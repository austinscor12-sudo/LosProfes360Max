// Editá estas listas cuando cambien los ascensos/descensos.
export const PRIMERA = ["Aldosivi","Argentinos Juniors","Atlético Tucumán","Banfield","Barracas Central","Belgrano","Boca Juniors","Central Córdoba (SdE)","Defensa y Justicia","Deportivo Riestra","Estudiantes (LP)","Estudiantes (RC)","Gimnasia (LP)","Gimnasia (M)","Huracán","Independiente","Independiente Rivadavia","Instituto","Lanús","Newell's","Platense","Racing Club","River Plate","Rosario Central","San Lorenzo","Sarmiento (J)","Talleres","Tigre","Unión","Vélez Sarsfield"];
export const NACIONAL = ["Agropecuario","Almagro","Almirante Brown","Alvarado","Atlanta","Chacarita","Chaco For Ever","Colegiales","Colón","Defensores de Belgrano","Deportivo Madryn","Deportivo Maipú","Deportivo Morón","Estudiantes (BA)","Ferro","Flandria","Gimnasia y Esgrima (J)","Gimnasia y Tiro","Godoy Cruz","Guillermo Brown","Güemes","Mitre (SdE)","Nueva Chicago","Patronato","Quilmes","Racing (Córdoba)","San Martín (SJ)","San Martín (T)","San Miguel","San Telmo","Temperley","Tristán Suárez","Villa Dálmine"];

// ---- Ligas europeas, temporada 2026/27 (listas oficiales con los ascensos y descensos de este año) ----
export const PREMIER = ["Arsenal","Aston Villa","Bournemouth","Brentford","Brighton","Chelsea","Coventry City","Crystal Palace","Everton","Fulham","Hull City","Ipswich Town","Leeds United","Liverpool","Manchester City","Manchester United","Newcastle United","Nottingham Forest","Sunderland","Tottenham Hotspur"];
export const LALIGA = ["Alavés","Athletic Club","Atlético de Madrid","Barcelona","Celta de Vigo","Deportivo La Coruña","Elche","Espanyol","Getafe","Levante","Málaga","Osasuna","Racing Santander","Rayo Vallecano","Real Betis","Real Madrid","Real Sociedad","Sevilla","Valencia","Villarreal"];
// ---- España: categorías inferiores (temporada 2026/27) ----
// Segunda División (LaLiga Hypermotion): los 22 equipos de 2026/27.
export const SEGUNDA = ["Albacete","Almería","Burgos","Cádiz","Castellón","Ceuta","Celta Fortuna","Córdoba","Eibar","Eldense","FC Andorra","Girona","Granada","Las Palmas","Leganés","Mallorca","Real Oviedo","Real Sociedad II","Real Valladolid","Sabadell","Sporting Gijón","Tenerife"];
// Filiales: juegan en Segunda pero no pueden jugar la Copa del Rey.
export const FILIALES = ["Celta Fortuna","Real Sociedad II"];
// Tercera categoría (Primera Federación): un grupo de 20 equipos. Es una MUESTRA simplificada, editala a gusto.
export const TERCERA = ["Alcorcón","Alcoyano","Arenteiro","Atlético Baleares","Barakaldo","Cultural Leonesa","Fuenlabrada","Hércules","Ibiza","Mirandés","Nàstic de Tarragona","Ourense","Ponferradina","Pontevedra","Racing de Ferrol","Real Murcia","Real Unión","Sestao River","Unionistas de Salamanca","Zamora"];
// Más clubes de categorías inferiores: solo sirven de rivales en la Copa del Rey (muestra, editala a gusto).
export const INFERIORES = ["Algeciras","Antequera","Cacereño","Calahorra","Cartagena","Intercity","Linares","Logroñés","Lugo","Marbella","Mérida","Recreativo de Huelva","Sanluqueño","Talavera","Tarazona","Teruel"];
export const SERIE_A = ["Atalanta","Bologna","Cagliari","Como","Fiorentina","Frosinone","Genoa","Inter","Juventus","Lazio","Lecce","Milan","Monza","Napoli","Parma","Roma","Sassuolo","Torino","Udinese","Venezia"];
export const BUNDESLIGA = ["Augsburg","Bayer Leverkusen","Bayern München","Borussia Dortmund","Borussia Mönchengladbach","Eintracht Frankfurt","Elversberg","Freiburg","Hamburger SV","Hoffenheim","Köln","RB Leipzig","Mainz 05","Paderborn","Schalke 04","Stuttgart","Union Berlin","Werder Bremen"];
export const LIGUE_1 = ["Angers","Auxerre","Brest","Le Havre","Le Mans","Lens","Lille","Lorient","Lyon","Marseille","Monaco","Nice","Paris FC","Paris Saint-Germain","Rennes","Strasbourg","Toulouse","Troyes"];

// europa:true = liga europea con calendario simple (todos contra todos ida y vuelta). comp = nombre de la competición en el calendario.
export const LIGAS = [
  {id:"AR1",nombre:"Liga Profesional (Primera División)",equipos:PRIMERA},
  {id:"AR2",nombre:"Primera Nacional (Nacional B)",equipos:NACIONAL},
  {id:"EN1",nombre:"Premier League (Inglaterra)",comp:"Premier League",europa:true,equipos:PREMIER},
  {id:"ES1",nombre:"LaLiga (España)",comp:"LaLiga",europa:true,equipos:LALIGA},
  {id:"ES2",nombre:"Segunda División (LaLiga Hypermotion)",comp:"Segunda División",europa:true,equipos:SEGUNDA},
  {id:"ES3",nombre:"Primera Federación (3.ª categoría)",comp:"Primera Federación",europa:true,oculta:true,equipos:TERCERA},
  {id:"IT1",nombre:"Serie A (Italia)",comp:"Serie A",europa:true,equipos:SERIE_A},
  {id:"DE1",nombre:"Bundesliga (Alemania)",comp:"Bundesliga",europa:true,equipos:BUNDESLIGA},
  {id:"FR1",nombre:"Ligue 1 (Francia)",comp:"Ligue 1",europa:true,equipos:LIGUE_1}
];