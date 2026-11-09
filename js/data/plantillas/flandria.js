// Flandria
// Completá el DT y los nombres (podés agregar o borrar filas). Los primeros 11 jugadores son los titulares.
// p = puesto: ARQ (arquero), DEF, MED o DEL.  Ejemplo: { n: "Leandro Paredes", p: "MED" }  (en el partido sale "L. Paredes")
// Si ponés menos de 11 nombres, este equipo usa nombres al azar como siempre.
export default {
  dt: "",
  jugadores: [
    { n: "", p: "ARQ" },
    { n: "", p: "DEF" },
    { n: "", p: "DEF" },
    { n: "", p: "DEF" },
    { n: "", p: "DEF" },
    { n: "", p: "MED" },
    { n: "", p: "MED" },
    { n: "", p: "MED" },
    { n: "", p: "MED" },
    { n: "", p: "DEL" },
    { n: "", p: "DEL" },   // ← hasta acá son los 11 titulares; el resto, suplentes
    { n: "", p: "ARQ" },
    { n: "", p: "DEF" },
    { n: "", p: "DEF" },
    { n: "", p: "MED" },
    { n: "", p: "MED" },
    { n: "", p: "DEL" },
    { n: "", p: "DEL" },
  ]
};
