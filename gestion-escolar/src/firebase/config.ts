import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Tu configuración web de Firebase llamando a las variables de entorno
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Inicializamos la aplicación de Firebase
export const app = initializeApp(firebaseConfig);

// Exportamos la Autenticación y la Base de Datos para usarlas en otras partes del sistema
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
// Región debe coincidir con la de despliegue de las Cloud Functions (por defecto us-central1)
export const functions = getFunctions(app, 'us-central1');