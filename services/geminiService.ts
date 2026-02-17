
import { GoogleGenAI, Type } from "@google/genai";
import { Priority, Task, DopamenuItem, BrainCapacity } from "../types";

const modelName = 'gemini-3-pro-preview';

const SYSTEM_INSTRUCTION = `Você é um especialista em Neuropsicologia da Produtividade e Funções Executivas. 
Sua missão é ajudar o usuário a superar a procrastinação, a paralisia de decisão e a fadiga mental. 
Ao categorizar ou decompor tarefas, utilize conceitos como 'Carga Cognitiva', 'Dopamina Sustentada' e 'Andaimação Neural'.
Não dê respostas óbvias; pense profundamente sobre a barreira psicológica de cada tarefa.`;

export const geminiService = {
  async parseNaturalTask(input: string): Promise<Partial<Task>> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analise esta intenção de tarefa: "${input}". 
        Retorne um objeto JSON com: priority (Q1, Q2, Q3 ou Q4), energy (Baixa, Média ou Alta) e subtasks (3 passos rápidos para começar agora). 
        IMPORTANTE: Não retorne um novo nome para a tarefa, foque apenas nos metadados.`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              priority: { type: Type.STRING, enum: Object.values(Priority) },
              energy: { type: Type.STRING, enum: ['Baixa', 'Média', 'Alta'] },
              subtasks: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['priority', 'energy', 'subtasks']
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error(error);
      return { priority: Priority.Q2, energy: 'Média', subtasks: [] };
    }
  },

  async categorizeTasks(tasks: Task[]): Promise<{ id: string; priority: Priority; energy: Task['energy'] }[]> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: modelName,
        contents: `Analise estas tarefas e categorize-as por Prioridade (Eisenhower) e Gasto de Energia (Baixa/Média/Alta). 
        Considere a complexidade inerente de cada texto: ${JSON.stringify(tasks.map(t => ({ id: t.id, text: t.text })))}`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          maxOutputTokens: 4000,
          thinkingConfig: { thinkingBudget: 2000 },
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
      return JSON.parse(response.text || '[]');
    } catch (error: any) {
      console.error("Erro ao categorizar tarefas:", error);
      return [];
    }
  },

  async suggestDopaMenuItem(brainState: BrainCapacity, existingItems: DopamenuItem[]): Promise<{ recommendation: string; item?: Partial<DopamenuItem> }> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `O usuário está em um estado cerebral: ${brainState}. 
        Com base no seu "Dopamenu" atual: ${JSON.stringify(existingItems.map(i => i.label))}, 
        recomende uma atividade (pode ser uma existente ou uma nova sugestão criativa). 
        Explique por que essa atividade ajudará a regular os níveis de dopamina agora.`,
        config: {
          systemInstruction: "Você é um Chef de Dopamina. Seu objetivo é sugerir a 'refeição neural' perfeita para o estado atual do usuário.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendation: { type: Type.STRING },
              item: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  category: { type: Type.STRING, enum: ['Starter', 'Main', 'Side', 'Dessert'] },
                  description: { type: Type.STRING },
                  effort: { type: Type.STRING, enum: ['Baixo', 'Médio', 'Alto'] }
                },
                required: ['label', 'category', 'description', 'effort']
              }
            },
            required: ['recommendation', 'item']
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error(error);
      return { recommendation: "Tente uma pausa de 5 minutos longe de telas." };
    }
  },

  async decomposeTask(taskText: string): Promise<string[]> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: modelName,
        contents: `Decomponha a tarefa "${taskText}" em 5 micro-passos. 
        O primeiro passo deve ser tão ridículo e fácil que é impossível não fazer (ex: 'abrir a tampa da caneta').`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          maxOutputTokens: 6000,
          thinkingConfig: { thinkingBudget: 4000 }, 
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
      return ["Inicie com a menor ação possível.", "Prepare seu ambiente.", "Foque por 5 minutos."];
    }
  },

  async generateIdentityBoost(taskText: string): Promise<string> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: modelName,
        contents: `O usuário completou: "${taskText}". Gere um feedback curto sobre reforço positivo e neuroplasticidade.`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
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
      return "Vitória neural registrada! Seu córtex pré-frontal está ficando mais forte.";
    }
  }
};
