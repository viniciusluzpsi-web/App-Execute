
export enum Priority {
  Q1 = 'Q1', // Importante e Urgente (Foco)
  Q2 = 'Q2', // Importante, não Urgente (Estratégico)
  Q3 = 'Q3', // Urgente, não Importante (Delegar)
  Q4 = 'Q4'  // Nem um nem outro (Eliminar)
}

export enum Frequency {
  DAILY = 'Diário',
  WEEKLY = 'Semanal',
  MONTHLY = 'Mensal',
  ANNUALLY = 'Anual'
}

export type BrainCapacity = 'Exausto' | 'Neutro' | 'Hiperfocado';
export type DayPeriod = 'Morning' | 'Day' | 'Evening' | 'Night';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface TimeboxEntry {
  id: string;
  start: string;
  end: string;
  activity: string;
  completed: boolean;
}

export interface Task {
  id: string;
  text: string;
  priority: Priority;
  energy: 'Baixa' | 'Média' | 'Alta';
  capacityNeeded: BrainCapacity; 
  completed: boolean;
  subtasks: string[];
  notes?: string; 
  date: string;
  createdAt: number;
  isRefining?: boolean; // Indica que a IA ainda está processando os detalhes
}

export interface RecurringTask {
  id: string;
  text: string;
  frequency: Frequency;
  priority: Priority;
  energy: 'Baixa' | 'Média' | 'Alta';
  completedDates: string[]; 
  period?: DayPeriod; 
  weekDays?: number[]; // 0=Dom, 1=Seg, ..., 6=Sab
}

export interface Habit {
  id: string;
  text: string;
  anchor: string;
  tinyAction: string;
  identity?: string; 
  streak: number;
  lastCompleted: string | null;
  completedDates: string[]; 
}

export interface DopamenuItem {
  id: string;
  category: 'Starter' | 'Main' | 'Side' | 'Dessert';
  label: string;
  description: string;
  effort: 'Baixo' | 'Médio' | 'Alto';
  duration?: string;
  iconName?: string;
}

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  unlocked: boolean;
  category: 'Focus' | 'AI' | 'Visual' | 'Energy';
  icon: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: number | null;
}

export interface PanicSolution {
  diagnosis: string;
  steps: string[];
  encouragement: string;
}
