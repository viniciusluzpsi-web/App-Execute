
import { db } from "./firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

export const syncService = {
  // Escuta mudanças em tempo real para um usuário específico
  subscribeToUserData(uid: string, callback: (data: any) => void) {
    if (!uid) return () => {};
    const userDocRef = doc(db, "users", uid);
    return onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data());
      }
    });
  },

  // Salva os dados do usuário no Firestore
  async pushData(uid: string, data: any) {
    if (!uid) return false;
    try {
      const userDocRef = doc(db, "users", uid);
      await setDoc(userDocRef, {
        ...data,
        updatedAt: Date.now()
      }, { merge: true });
      return true;
    } catch (e) {
      console.error("Firestore Sync Error:", e);
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
      console.error("Firestore Pull Error:", e);
      return null;
    }
  }
};
