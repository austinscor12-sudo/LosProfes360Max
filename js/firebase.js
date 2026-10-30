import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, orderBy, query, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Pegá acá tu config (Firebase > Configuración del proyecto > Tus apps > Web)
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export const onUser = cb => onAuthStateChanged(auth, cb);
export const entrar = (e, p) => signInWithEmailAndPassword(auth, e, p);
export const registrar = (e, p) => createUserWithEmailAndPassword(auth, e, p);
export const entrarGoogle = () => signInWithPopup(auth, new GoogleAuthProvider());
export const salir = () => signOut(auth);

const partidas = uid => collection(db, "users", uid, "partidas");
export const guardarPartida = (uid, data) => addDoc(partidas(uid), { ...data, creada: serverTimestamp() });
export const borrarPartida = (uid, id) => deleteDoc(doc(db, "users", uid, "partidas", id));
export async function listarPartidas(uid) {
  const s = await getDocs(query(partidas(uid), orderBy("creada", "desc")));
  return s.docs.map(d => ({ id: d.id, ...d.data() }));
}
