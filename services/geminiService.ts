
import { GoogleGenAI, Type } from "@google/genai";
import { Priority, Task, PanicSolution } from "../types";

// Complex tasks should use gemini-3-pro-preview for advanced reasoning
const modelName = 'gemini-3-pro-preview';

// System Instruction robusta para garantir o "pensamento" neuropsicológico
const SYSTEM_INSTRUCTION = `Você é um especialista em Neuropsicologia da Produtividade e Funções Executivas. 
Sua missão é ajudar o usuário a superar a procrastinação, a paralisia de decisão e a fadiga mental. 
Ao categorizar ou decompor tarefas, utilize conceitos como 'Carga Cognitiva', 'Dopamina Sustentada' e 'Andaimação Neural'.
Não dê respostas óbvias; pense profundamente sobre a barreira psicológica de cada tarefa.`;

export const geminiService = {
  async categorizeTasks(tasks: Task[]): Promise<{ id: string; priority: Priority; energy: Task['energy'] }[]> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: modelName,
        contents: `Analise estas tarefas e categorize-as por Prioridade (Eisenhower) e Gasto de Energia (Baixa/Média/Alta). 
        Considere a complexidade inerente de cada texto: ${JSON.stringify(tasks.map(t => ({ id: t.id, text: t.text })))}`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          // Set both maxOutputTokens and thinkingBudget together as per guidelines
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

  async decomposeTask(taskText: string): Promise<string[]> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: modelName,
        contents: `Decomponha a tarefa "${taskText}" em 5 micro-passos. 
        O primeiro passo deve ser tão ridículo e fácil que é impossível não fazer (ex: 'abrir a tampa da caneta').`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          // Set both maxOutputTokens and thinkingBudget together as per guidelines
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

  async rescueTask(taskText: string, obstacle: string): Promise<PanicSolution> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: modelName,
        contents: `O usuário está paralisado na tarefa "${taskText}" pelo motivo: "${obstacle}". 
        Forneça um diagnóstico neuropsicológico e um protocolo de resgate imediato.`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          // Set both maxOutputTokens and thinkingBudget together as per guidelines
          maxOutputTokens: 12000,
          thinkingConfig: { thinkingBudget: 8000 }, 
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
        diagnosis: "Sobrecarga de processamento.",
        steps: ["Afaste-se da tela por 2 minutos.", "Beba água gelada.", "Escreva apenas a primeira palavra da tarefa."],
        encouragement: "O progresso é melhor que a perfeição."
      };
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
