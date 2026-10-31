// Selecciones nacionales y su fuerza (misma escala que los clubes de fuerza.js). Son valores míos, NO oficiales: editalos a gusto.
export const DT_SELECCION = "Scaloni";

export const FUERZA_SEL = {
  Argentina: 88, Francia: 89, España: 89, Inglaterra: 87, Brasil: 86, Portugal: 86, Alemania: 85, "Países Bajos": 85,
  Italia: 83, Uruguay: 83, Bélgica: 82, Colombia: 82, Croacia: 80, Marruecos: 80, Ecuador: 78, Japón: 78,
  Senegal: 77, "Estados Unidos": 77, Noruega: 76, Dinamarca: 76, Suiza: 76, Austria: 76, Turquía: 76, México: 76, "Corea del Sur": 76,
  Paraguay: 74, Ucrania: 74, Serbia: 74, Nigeria: 74, "Costa de Marfil": 74, Polonia: 73,
  Chile: 72, Escocia: 72, Egipto: 72, Argelia: 72, Perú: 71, Canadá: 71,
  Venezuela: 70, Irán: 70, Australia: 70, Camerún: 70, Ghana: 68, Túnez: 68,
  Panamá: 66, "Arabia Saudita": 65, Bolivia: 64, "Costa Rica": 64, Jamaica: 62, Uzbekistán: 62, "Nueva Zelanda": 58
};
export const CONMEBOL = ["Brasil", "Uruguay", "Colombia", "Ecuador", "Paraguay", "Chile", "Perú", "Venezuela", "Bolivia"];
export const INVITADOS_COPA = ["Estados Unidos", "México", "Canadá", "Panamá", "Costa Rica", "Jamaica"];
export const TODAS = Object.keys(FUERZA_SEL).filter(n => n !== "Argentina");
