
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

export interface Task {
  id: string;
  text: string;
  priority: Priority;
  energy: 'Baixa' | 'Média' | 'Alta';
  capacityNeeded: BrainCapacity;
  completed: boolean;
  subtasks: string[];
  date: string;
  createdAt: number;
  isRefining?: boolean;
}

export interface Habit {
  id: string;
  text: string;
  anchor: string;
  tinyAction: string;
  identity: string;
  streak: number;
  lastCompleted: string | null;
  completedDates: string[];
}

export interface RecurringTask {
  id: string;
  text: string;
  frequency: Frequency;
  energy: 'Baixa' | 'Média' | 'Alta';
  anchor: string; 
  description: string;
  lastCompleted: string | null;
  completedDates: string[];
}

export interface TimeboxEntry {
  id: string;
  activity: string;
  start: string;
  end: string;
  completed: boolean;
}

export interface DopamenuItem {
  id: string;
  label: string;
  category: 'Starter' | 'Main' | 'Side' | 'Dessert';
  description: string;
  effort: 'Baixo' | 'Médio' | 'Alto';
}

export interface Reward {
  id: string;
  name: string;
  cost: number;
  description: string;
  icon: string;
  redemptions: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}
