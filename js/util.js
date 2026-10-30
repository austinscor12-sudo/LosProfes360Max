export const esc = t => String(t ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ERR = {
  "auth/invalid-credential": "Email o contraseña incorrectos.",
  "auth/invalid-email": "El email no es válido.",
  "auth/missing-password": "Escribí tu contraseña.",
  "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
  "auth/email-already-in-use": "Ese email ya tiene una cuenta. Probá con Entrar.",
  "auth/popup-closed-by-user": "Cerraste la ventana de Google antes de terminar.",
  "auth/unauthorized-domain": "Este dominio no está autorizado en Firebase.",
  "auth/operation-not-allowed": "Ese método de ingreso no está activado en Firebase.",
  "auth/network-request-failed": "Sin conexión. Revisá tu internet.",
  "auth/too-many-requests": "Demasiados intentos. Esperá unos minutos."
};
export const errorAuth = c => ERR[c] || "No se pudo entrar. Intentá de nuevo.";
