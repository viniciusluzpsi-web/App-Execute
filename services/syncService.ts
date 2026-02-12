
import { User, Task, Habit, RecurringTask } from "../types";

// Identificador exclusivo para evitar conflitos com outros apps no kvdb
const BUCKET_ID = "neuro_executor_v1_production_stable_99";
const BASE_URL = `https://kvdb.io/${BUCKET_ID}/`;

// Função de hash segura para transformar e-mail em chave de URL
function safeKey(email: string) {
  const clean = email.toLowerCase().trim();
  // Usando uma substituição simples para caracteres especiais para garantir compatibilidade
  return btoa(clean).replace(/[/+=]/g, '_');
}

export const syncService = {
  async saveUser(user: any) {
    try {
      const key = safeKey(user.email);
      const payload = {
        ...user,
        updatedAt: Date.now()
      };
      
      const response = await fetch(`${BASE_URL}u_${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return response.ok;
    } catch (e) {
      console.error("Sync: Falha ao salvar usuário na nuvem", e);
      return false;
    }
  },

  async findUser(email: string) {
    try {
      const key = safeKey(email);
      const res = await fetch(`${BASE_URL}u_${key}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error("Sync: Falha ao buscar usuário", e);
      return null;
    }
  },

  async pushData(email: string, data: any) {
    if (!email || email === 'guest@neuro.com') return false;
    try {
      const key = safeKey(email);
      const response = await fetch(`${BASE_URL}d_${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          updatedAt: Date.now()
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
      const key = safeKey(email);
      const res = await fetch(`${BASE_URL}d_${key}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }
};
