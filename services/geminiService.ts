import { GoogleGenAI, Type } from "@google/genai";
import { Priority, Task, PanicSolution } from "../types";

// Inicialização seguindo as diretrizes (apiKey via named parameter)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelName = 'gemini-3-flash-preview';

export const geminiService = {
  async categorizeTasks(tasks: Task[]): Promise<{ id: string; priority: Priority; energy: Task['energy'] }[]> {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Analise as seguintes tarefas e categorize-as por Prioridade (Eisenhower: Q1-Urgente, Q2-Estratégico, Q3-Delegável, Q4-Eliminar) e Energia (Baixa, Média, Alta): ${JSON.stringify(tasks.map(t => ({ id: t.id, text: t.text })))}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              priority: { type: Type.STRING, enum: Object.values(Priority) },
              energy: { type: Type.STRING, enum: ['Baixa', 'Média', 'Alta'] }
            },
            required: ['id', 'priority', 'energy']
          }
        }
      }
    });
    // Propriedade .text direta (sem parênteses)
    const jsonStr = response.text || '[]';
    return JSON.parse(jsonStr);
  },

  async decomposeTask(taskText: string): Promise<string[]> {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Decomponha a tarefa "${taskText}" em 5 micro-passos minúsculos e granulares para reduzir a fricção executiva. Seja extremamente específico.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['steps']
        }
      }
    });
    const jsonStr = response.text || '{"steps":[]}';
    const result = JSON.parse(jsonStr);
    return result.steps;
  },

  async rescueTask(taskText: string, obstacle: string): Promise<PanicSolution> {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `O usuário está travado na tarefa "${taskText}" devido a: "${obstacle}". Identifique a barreira neuropsicológica (ex: paralisia por análise, medo do erro, falta de dopamina) e forneça um protocolo de 3 passos para destravar agora.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diagnosis: { type: Type.STRING },
            steps: { type: Type.ARRAY, items: { type: Type.STRING } },
            encouragement: { type: Type.STRING }
          },
          required: ['diagnosis', 'steps', 'encouragement']
        }
      }
    });
    const jsonStr = response.text || '{}';
    return JSON.parse(jsonStr);
  },

  async generateIdentityBoost(taskText: string): Promise<string> {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `O usuário acabou de completar a tarefa: "${taskText}". Gere um feedback curto de 2 linhas focado em neuroplasticidade e no reforço da identidade de alguém que executa com excelência.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            boost: { type: Type.STRING }
          },
          required: ['boost']
        }
      }
    });
    const jsonStr = response.text || '{"boost":""}';
    const result = JSON.parse(jsonStr);
    return result.boost;
  }
};