
import { User, Task, Habit, RecurringTask } from "../types";

// Bucket persistente. Usando um identificador mais robusto.
const BUCKET_ID = "NeuroExecutor_V1_Cloud_Final_99";
const BASE_URL = `https://kvdb.io/${BUCKET_ID}/`;

async function hashString(str: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str.toLowerCase().trim());
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export const syncService = {
  async saveUser(user: any) {
    try {
      const key = await hashString(user.email);
      const payload = {
        id: user.id,
        name: user.name,
        email: user.email.toLowerCase().trim(),
        password: user.password,
        createdAt: Date.now()
      };
      
      const response = await fetch(`${BASE_URL}user_${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error("Falha ao salvar usuário na KV");
      return true;
    } catch (e) {
      console.error("Erro Crítico no saveUser:", e);
      return false;
    }
  },

  async findUser(email: string) {
    try {
      const key = await hashString(email);
      const res = await fetch(`${BASE_URL}user_${key}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data;
    } catch (e) {
      console.error("Erro ao buscar usuário:", e);
      return null;
    }
  },

  async pushData(email: string, data: any) {
    if (!email || email === 'guest@neuro.com') return false;
    try {
      const key = await hashString(email);
      const response = await fetch(`${BASE_URL}data_${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          lastSync: Date.now()
        })
      });
      return response.ok;
    } catch (e) {
      console.error("Erro no pushData:", e);
      return false;
    }
  },

  async pullData(email: string) {
    if (!email || email === 'guest@neuro.com') return null;
    try {
      const key = await hashString(email);
      const res = await fetch(`${BASE_URL}data_${key}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data;
    } catch (e) {
      console.error("Erro no pullData:", e);
      return null;
    }
  }
};
