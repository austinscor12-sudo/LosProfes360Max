// Boca Juniors
// Completá el DT y los nombres (podés agregar o borrar filas). Los primeros 11 jugadores son los titulares.
// p = puesto: ARQ (arquero), DEF, MED o DEL.  Ejemplo: { n: "Leandro Paredes", p: "MED" }  (en el partido sale "L. Paredes")
// Si ponés menos de 11 nombres, este equipo usa nombres al azar como siempre.
export default {
  dt: "Rodolfo Arruabarrena",
  jugadores: [
    { n: "Álvaro Montero", p: "ARQ" },
    { n: "Lautaro Blanco", p: "DEF" },
    { n: "Marco Pellegrino", p: "DEF" },
    { n: "Lautaro Di Lollo", p: "DEF" },
    { n: "Leandro Lozano", p: "DEF" },
    { n: "Milton Delgado", p: "MED" },
    { n: "Leandro Paredes", p: "MED" },
    { n: "Santiago Ascacibar", p: "MED" },
    { n: "Tomás Aranda", p: "MED" },
    { n: "Alan Velasco", p: "DEL" },
    { n: "Miguel Merentiel", p: "DEL" },   // ← hasta acá son los 11 titulares; el resto, suplentes
    { n: "Leandro Brey", p: "ARQ" },
    { n: "Nicolás Figal", p: "DEF" },
    { n: "Ayrton Costa", p: "DEF" },
    { n: "Tomás Belmonte", p: "MED" },
    { n: "Rodrigo Battaglia", p: "MED" },
    { n: "Ángel Romero", p: "DEL" },
    { n: "Adam Bareiro", p: "DEL" },
  ]
};
