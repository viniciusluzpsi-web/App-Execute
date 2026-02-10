
import { User, Task, Habit, RecurringTask } from "../types";

// Bucket ID renovado para evitar conflitos de cache ou limites
const BUCKET_ID = "neuro_exec_storage_v2_stable";
const BASE_URL = `https://kvdb.io/${BUCKET_ID}/`;

// Função de codificação simples e segura para URLs
function encodeKey(str: string) {
  return btoa(str.toLowerCase().trim()).replace(/[/+=]/g, '_');
}

export const syncService = {
  async saveUser(user: any) {
    try {
      const key = encodeKey(user.email);
      const payload = {
        id: user.id,
        name: user.name,
        email: user.email.toLowerCase().trim(),
        password: user.password,
        createdAt: Date.now()
      };
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${BASE_URL}user_${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      return response.ok;
    } catch (e) {
      console.warn("Erro ao salvar usuário na nuvem (usando modo offline):", e);
      return false;
    }
  },

  async findUser(email: string) {
    try {
      const key = encodeKey(email);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${BASE_URL}user_${key}`, { signal: controller.signal });
      clearTimeout(timeout);
      
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error("Erro ao buscar usuário na nuvem:", e);
      return null;
    }
  },

  async pushData(email: string, data: any) {
    if (!email || email === 'guest@neuro.com') return false;
    try {
      const key = encodeKey(email);
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
      return false;
    }
  },

  async pullData(email: string) {
    if (!email || email === 'guest@neuro.com') return null;
    try {
      const key = encodeKey(email);
      const res = await fetch(`${BASE_URL}data_${key}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }
};
