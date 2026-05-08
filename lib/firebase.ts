import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  // ... tu nechaj tvoje skutočné kľúče, ktoré si tam vložil ...
  apiKey: "AIzaSyA-NwBcNeiJPQUTVlE9tkVqBL7iR3aZGzc",
  authDomain: "safe-space-4db68.firebaseapp.com",
  projectId: "safe-space-4db68",
  storageBucket: "safe-space-4db68.firebasestorage.app",
  messagingSenderId: "672141829805",
  appId: "1:672141829805:web:665d264889c9b17e370824",
  measurementId: "G-K2B3EVWGG9"
};

// Inicializácia aplikácie
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Tieto dve riadky sú kľúčové - musia mať pred sebou 'const' a byť v exporte nižšie
const db = getFirestore(app);
const storage = getStorage(app);

// TENTO RIADOK TI PRAVDEPODOBNE CHÝBA:
export { db, storage };