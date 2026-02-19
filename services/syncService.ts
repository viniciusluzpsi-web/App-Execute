
import { db } from "./firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

export const syncService = {
  // Escuta mudanças em tempo real para um usuário específico
  subscribeToUserData(uid: string, callback: (data: any) => void) {
    if (!uid) return () => {};
    console.log(`[Sync] Iniciando escuta para o usuário: ${uid}`);
    const userDocRef = doc(db, "users", uid);
    return onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        console.log(`[Sync] Novos dados recebidos da nuvem.`);
        callback(docSnap.data());
      } else {
        console.log(`[Sync] Nenhum dado encontrado na nuvem para este usuário.`);
        callback(null);
      }
    }, (error) => {
      console.error("[Sync] Erro no OnSnapshot:", error);
    });
  },

  // Salva os dados do usuário no Firestore
  async pushData(uid: string, data: any) {
    if (!uid) return false;
    try {
      console.log(`[Sync] Enviando dados para a nuvem...`);
      const userDocRef = doc(db, "users", uid);
      await setDoc(userDocRef, {
        ...data,
        updatedAt: Date.now()
      }, { merge: true });
      console.log(`[Sync] Dados enviados com sucesso.`);
      return true;
    } catch (e) {
      console.error("[Sync] Erro no Firestore Push:", e);
      return false;
    }
  },

  // Busca dados iniciais (fallback ou manual)
  async pullData(uid: string) {
    if (!uid) return null;
    try {
      const userDocRef = doc(db, "users", uid);
      const docSnap = await getDoc(userDocRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (e) {
      console.error("[Sync] Erro no Firestore Pull:", e);
      return null;
    }
  }
};
