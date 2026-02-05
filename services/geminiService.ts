
import { GoogleGenAI, Type } from "@google/genai";
import { Priority, Task, PanicSolution } from "../types";

// Complex tasks should use gemini-3-pro-preview for advanced reasoning
const modelName = 'gemini-3-pro-preview';

export const geminiService = {
  async categorizeTasks(tasks: Task[]): Promise<{ id: string; priority: Priority; energy: Task['energy'] }[]> {
    try {
      // Initialize ai instance with process.env.API_KEY directly as per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
      // response.text is a property, not a function
      return JSON.parse(response.text || '[]');
    } catch (error: any) {
      console.error("Erro ao categorizar tarefas:", error);
      return [];
    }
  },

  async decomposeTask(taskText: string): Promise<string[]> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
      const result = JSON.parse(response.text || '{"steps":[]}');
      return result.steps;
    } catch (error: any) {
      console.error("Erro ao decompor tarefa:", error);
      return ["Tente dividir a tarefa manualmente em passos menores (Erro de conexão)."];
    }
  },

  async rescueTask(taskText: string, obstacle: string): Promise<PanicSolution> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: modelName,
        contents: `O usuário está travado na tarefa "${taskText}" devido a: "${obstacle}". Identifique a barreira neuropsicológica e forneça um protocolo de 3 passos para destravar agora.`,
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
      return JSON.parse(response.text || '{}');
    } catch (error: any) {
      console.error("Erro no resgate neural:", error);
      return {
        diagnosis: "Falha na conexão neural.",
        steps: ["Respire fundo por 30 segundos.", "Faça a menor ação possível.", "Beba um copo de água."],
        encouragement: "Você consegue recomeçar, mesmo sem IA no momento."
      };
    }
  },

  async generateIdentityBoost(taskText: string): Promise<string> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: modelName,
        contents: `O usuário acabou de completar a tarefa: "${taskText}". Gere um feedback curto de 2 linhas focado em neuroplasticidade.`,
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
      const result = JSON.parse(response.text || '{"boost":""}');
      return result.boost;
    } catch (error: any) {
      console.error("Erro ao gerar boost:", error);
      return "Ótimo trabalho! Seu cérebro está criando novos caminhos de sucesso.";
    }
  }
};
