
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * CONFIGURAÇÃO DO FIREBASE
 * Atualizado com as credenciais do projeto: neuroexecutor-d5f83
 */
const firebaseConfig = {
  apiKey: "AIzaSyBsv7mmtmhxBbleTNuEZeWTrjf70YolDoA",
  authDomain: "neuroexecutor-d5f83.firebaseapp.com",
  projectId: "neuroexecutor-d5f83",
  storageBucket: "neuroexecutor-d5f83.firebasestorage.app",
  messagingSenderId: "228832104151",
  appId: "1:228832104151:web:ca6aacac6567219f276a92",
  measurementId: "G-3NL5KVMXFC"
};

// Inicialização segura
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Configuração opcional para facilitar o login (evita múltiplos pop-ups)
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
