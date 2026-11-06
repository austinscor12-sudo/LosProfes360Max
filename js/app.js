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
import { pantallaRetiro } from "./retiro.js";
import { pantallaCelular } from "./celular.js";
import { pantallaVida } from "./vida.js";
import { pantallaSeleccion, pantallaSelInfo } from "./pantallaseleccion.js";

Object.assign(rutas, { auth: pantallaAuth, menu: pantallaMenu, jugador: pantallaJugador, posicion: pantallaPosicion, equipo: pantallaEquipo, cargar: pantallaCargar, carrera: pantallaCarrera, calendario: pantallaCalendario, partido: pantallaPartido, gestion: pantallaGestion, tabla: pantallaTabla, fin: pantallaFin, retiro: pantallaRetiro, celular: pantallaCelular, vida: pantallaVida, seleccion: pantallaSeleccion, selinfo: pantallaSelInfo });

onUser(u => { estado.user = u; ir(u ? "menu" : "auth"); });