
import { db } from "./firebase";
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";

export const syncService = {
  subscribeToUserData(uid: string, callback: (data: any) => void) {
    if (!uid) return () => {};
    const userDocRef = doc(db, "users", uid);
    return onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback(data);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error("[Sync] Erro na sincronização:", error);
    });
  },

  async pushData(uid: string, data: any) {
    if (!uid) return false;
    try {
      const userDocRef = doc(db, "users", uid);
      await setDoc(userDocRef, {
        ...data,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return true;
    } catch (e) {
      console.error("[Sync] Erro ao subir dados:", e);
      return false;
    }
  }
};
