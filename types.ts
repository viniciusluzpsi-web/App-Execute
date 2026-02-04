
export enum Priority {
  Q1 = 'Q1', // Faça agora
  Q2 = 'Q2', // Estratégico/Importante
  Q3 = 'Q3', // Interrupções
  Q4 = 'Q4'  // Eliminar
}

export enum Frequency {
  DAILY = 'Diário',
  WEEKLY = 'Semanal',
  MONTHLY = 'Mensal'
}

export interface Subtask {
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  text: string;
  priority: Priority;
  energy: 'Baixa' | 'Média' | 'Alta';
  completed: boolean;
  subtasks: string[];
  date: string;
  createdAt: number;
}

export interface RecurringTask {
  id: string;
  text: string;
  frequency: Frequency;
  priority: Priority;
  energy: 'Baixa' | 'Média' | 'Alta';
  completedDates: string[]; // List of ISO dates where this was completed
}

export interface Habit {
  id: string;
  text: string;
  anchor: string;
  tinyAction: string;
  streak: number;
  lastCompleted: string | null;
}

export interface IdentityBoost {
  text: string;
  taskTitle: string;
}

export interface PanicSolution {
  diagnosis: string;
  steps: string[];
  encouragement: string;
}
