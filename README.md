# Modo Carrera (jugador)
1. Firebase: activá Authentication (Email/Password y Google) y Firestore; pegá tu config en `js/firebase.js`.
2. Authentication > Settings > Authorized domains: agregá tu dominio de Cloudflare y `localhost`.
3. Reglas de Firestore:
```
rules_version = '2';
service cloud.firestore { match /databases/{db}/documents {
  match /users/{uid}/partidas/{id} { allow read, write: if request.auth != null && request.auth.uid == uid; }
}}
```
4. Local: abrí con Live Server (los módulos ES no andan con doble clic).
5. Cloudflare Pages: conectá el repo, sin build command, output directory `/`.
