
import { User, Task, Habit, RecurringTask } from "../types";

// Bucket de produção único para o NeuroExecutor V1
const BASE_URL = "https://kvdb.io/NeuroExecutor_V1_Production_Cloud_777/";

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
      await fetch(`${BASE_URL}user_${key}`, {
        method: 'POST',
        body: JSON.stringify({ id: user.id, name: user.name, email: user.email, password: user.password })
      });
      return true;
    } catch (e) {
      console.error("Erro ao salvar usuário na nuvem", e);
      return false;
    }
  },

  async findUser(email: string) {
    try {
      const key = await hashString(email);
      const res = await fetch(`${BASE_URL}user_${key}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  async pushData(email: string, data: any) {
    try {
      const key = await hashString(email);
      await fetch(`${BASE_URL}data_${key}`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return true;
    } catch (e) {
      return false;
    }
  },

  async pullData(email: string) {
    try {
      const key = await hashString(email);
      const res = await fetch(`${BASE_URL}data_${key}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }
};
