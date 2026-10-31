import { onUser } from "./firebase.js";
import { estado, rutas, ir } from "./router.js";
import { pantallaAuth } from "./auth.js";
import { pantallaMenu } from "./menu.js";
import { pantallaJugador } from "./jugador.js";
import { pantallaPosicion } from "./posicion.js";
import { pantallaEquipo } from "./equipo.js";
import { pantallaCargar } from "./cargar.js";
import { pantallaCarrera } from "./carrera.js";
import { pantallaCalendario } from "./calendario.js";
import { pantallaPartido } from "./partido.js";
import { pantallaGestion } from "./gestion.js";
import { pantallaTabla } from "./tabla.js";
import { pantallaFin } from "./fintemporada.js";

Object.assign(rutas, { auth: pantallaAuth, menu: pantallaMenu, jugador: pantallaJugador, posicion: pantallaPosicion, equipo: pantallaEquipo, cargar: pantallaCargar, carrera: pantallaCarrera, calendario: pantallaCalendario, partido: pantallaPartido, gestion: pantallaGestion, tabla: pantallaTabla, fin: pantallaFin });

onUser(u => { estado.user = u; ir(u ? "menu" : "auth"); });