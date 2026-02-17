
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Timer, LayoutGrid, RefreshCw, ListTodo, Zap, AlertTriangle, 
  Plus, X, Trophy, Play, Pause, RotateCcw, 
  BrainCircuit, Anchor, Target, Flame, Sparkles, 
  Repeat, Award, TrendingUp, Sun, Moon, CheckCircle2,
  Trash2, Star, CheckCircle, Info, Move,
  ChevronRight, Brain, Lightbulb, ZapOff, BarChart3,
  Coffee, Utensils, Waves, Users, Wind, Battery, BatteryLow, BatteryMedium, BatteryFull,
  Check, ArrowLeft, ArrowRight, GripVertical, Wand2, Calendar, HelpCircle, Volume2, VolumeX, Loader2,
  Clock, CalendarRange, Binary, ShieldCheck, Palette, BookOpen, UtensilsCrossed, GraduationCap, Microscope,
  Cloud, CloudOff, CloudSync, Mail, Rocket, BrainCog, StickyNote, ListChecks, Music, Activity, Star as StarIcon, Cpu,
  ChefHat, IceCream, Pizza, Cookie, ShieldAlert, ZapOff as ZapIcon, FastForward, Filter, Settings, Fingerprint,
  Sunrise, Sunset, MoonStar, Briefcase, Heart, Edit3, Sparkle, Swords, Gem, Lock, Unlock, Zap as ZapBolt,
  Zap as SparkleIcon, History, Fingerprint as IdentityIcon, Send, Brain as BrainIcon, LifeBuoy, FileText, Layers,
  Loader, RefreshCcw, Info as InfoIcon, ArrowUpRight, BookOpenCheck
} from 'lucide-react';
import { Priority, Task, Habit, RecurringTask, Frequency, BrainCapacity, DopamenuItem, DayPeriod, Upgrade, Achievement, TimeboxEntry } from './types';
import { geminiService } from './services/geminiService';
import { syncService } from './services/syncService';
import { GoogleGenAI, Type } from "@google/genai";

const SOUNDS = {
  TASK_COMPLETE: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  HABIT_COMPLETE: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  UPGRADE: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  BLOCK_SYNC: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3',
  CAPTURE: 'https://assets.mixkit.co/active_storage/sfx/2015/2015-preview.mp3',
};

const PERIOD_LABELS: Record<DayPeriod, string> = {
  Morning: 'Manhã',
  Day: 'Tarde',
  Evening: 'Noite',
  Night: 'Madrugada'
};

const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const TUTORIAL_DATA: Record<string, { title: string, steps: { text: string, concept: string, actionTip: string }[] }> = {
  capture: {
    title: "Sincronismo de Captura",
    steps: [
      { 
        text: "Escreva qualquer pensamento ou tarefa aqui. Não pare para organizar agora.", 
        concept: "Efeito Zeigarnik: O cérebro gasta energia mantendo 'lembretes' de tarefas inacabadas. Ao escrever, você encerra esse loop de processamento no córtex pré-frontal.",
        actionTip: "Use o campo de entrada para externalizar tudo o que 'pesa' na sua mente no momento."
      },
      { 
        text: "Nossa IA processará sua intenção para sugerir prioridade e micro-passos.", 
        concept: "Andaimação Neural: O cérebro resiste a tarefas vagas (ex: 'Estudar'). A IA quebra a resistência inicial ao transformar o vago em concreto.",
        actionTip: "Observe como a IA gera subtarefas ridiculamente fáceis para 'hackear' sua procrastinação."
      }
    ]
  },
  execute: {
    title: "Estado de Fluxo Assistido",
    steps: [
      { 
        text: "Trabalhe em blocos de 90 minutos usando o Timer de Fluxo.", 
        concept: "Ciclos Ultradianos: Nosso cérebro opera em picos de 90 min. Ignorar isso causa fadiga acumulada e perda de plasticidade sináptica.",
        actionTip: "Tente não alternar janelas durante o timer para proteger sua Atenção Sustentada."
      },
      { 
        text: "Planeje seus blocos no Timebox para evitar o cansaço da decisão.", 
        concept: "Fadiga de Decisão: Decidir 'o que fazer agora' a todo momento drena a glicose do lobo frontal. O plano antecipado preserva sua energia para a execução.",
        actionTip: "Preencha os horários do seu dia logo pela manhã ou na noite anterior."
      },
      { 
        text: "O sistema destaca tarefas baseadas na sua bateria biológica atual.", 
        concept: "Gestão de Bio-Energia: Executar tarefas complexas com energia baixa é a receita para o Burnout. Alinhe a carga cognitiva com seu estado hormonal.",
        actionTip: "Atualize sua energia na barra lateral sempre que sentir mudança no humor ou cansaço."
      }
    ]
  },
  plan: {
    title: "Arquitetura de Decisão",
    steps: [
      { 
        text: "Organize visualmente o que é Importante vs Urgente na Matriz.", 
        concept: "Gestão de Cortisol: A urgência libera cortisol. Focar no Quadrante 2 (Importante/Não Urgente) reduz o estresse crônico e aumenta a satisfação de longo prazo.",
        actionTip: "Priorize o quadrante laranja (Q2) para crescer estrategicamente."
      },
      { 
        text: "Arraste tarefas para redefinir prioridades conforme sua clareza mental.", 
        concept: "Flexibilidade Cognitiva: A capacidade de reajustar o curso sem frustração é uma função executiva vital para a resiliência.",
        actionTip: "Não tenha medo de mover tarefas se as circunstâncias do dia mudarem."
      }
    ]
  },
  habits: {
    title: "Mielinização Profunda",
    steps: [
      { 
        text: "Defina quem você QUER SER antes do que você quer FAZER.", 
        concept: "Hábitos de Identidade: A mudança duradoura ocorre nos Gânglios da Base quando a ação se torna parte do autoconceito ('Eu sou um corredor').",
        actionTip: "Escreva sua identidade no campo 'Identidade' (ex: 'Sou uma pessoa saudável')."
      },
      { 
        text: "Use uma Âncora: um hábito que já existe para 'pendurar' o novo.", 
        concept: "Encadeamento Neuronal: Pegamos uma trilha neural já pavimentada (ex: escovar dentes) e adicionamos uma nova sinapse ao final dela.",
        actionTip: "Sua âncora deve ser algo que você faz 100% das vezes sem falhar."
      }
    ]
  },
  fixed: {
    title: "Bio-Ritmos Circadianos",
    steps: [
      { 
        text: "Sincronize rotinas com os períodos do dia (Manhã, Tarde, Noite).", 
        concept: "Núcleo Supraquiasmático: Seu 'relógio mestre' espera certas atividades em certas horas para regular melatonina e dopamina.",
        actionTip: "Crie rotinas fixas para os momentos de transição do dia (acordar/trabalhar/dormir)."
      }
    ]
  }
};

const INITIAL_UPGRADES: Upgrade[] = [
  { id: 'u1', name: 'Decompositor IA v2', description: 'Decompõe tarefas em 8 passos em vez de 5.', cost: 500, unlocked: false, category: 'AI', icon: 'Wand2' },
  { id: 'u2', name: 'Timer de Dopamina', description: 'Visualização ultra-colorida no timer de foco.', cost: 1000, unlocked: false, category: 'Focus', icon: 'Zap' },
  { id: 'u3', name: 'Tema Cyberpunk', description: 'Visual neon e alto contraste.', cost: 1500, unlocked: false, category: 'Visual', icon: 'Palette' },
  { id: 'u4', name: 'Bio-Sync', description: 'Ajuste automático de tarefas baseado na hora do dia.', cost: 2000, unlocked: false, category: 'Energy', icon: 'Activity' },
];

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', title: 'Primeira Sinapse', description: 'Completou a primeira tarefa.', icon: 'Zap', unlockedAt: null },
  { id: 'a2', title: 'Consistência de Ferro', description: '7 dias seguidos de hábito.', icon: 'Flame', unlockedAt: null },
  { id: 'a3', title: 'Mestre do Foco', description: 'Terminou um timer de 90 minutos.', icon: 'Target', unlockedAt: null },
];

const App: React.FC = () => {
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('neuro-user-email') || '');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'none'>('none');
  const [lastRemoteUpdate, setLastRemoteUpdate] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('neuro-dark-mode') !== 'false');
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => localStorage.getItem('neuro-sound-enabled') !== 'false');
  const [activeTab, setActiveTab] = useState<'execute' | 'plan' | 'habits' | 'capture' | 'fixed' | 'upgrades' | 'dashboard'>('capture');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [points, setPoints] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [timebox, setTimebox] = useState<TimeboxEntry[]>([]);
  const [upgrades, setUpgrades] = useState<Upgrade[]>(INITIAL_UPGRADES);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [visualTheme, setVisualTheme] = useState(() => localStorage.getItem('neuro-visual-theme') || 'theme-default');
  const [userEnergy, setUserEnergy] = useState<'Baixa' | 'Média' | 'Alta'>('Média');
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  const [newTaskText, setNewTaskText] = useState("");
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState<DayPeriod>('Day');
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [editingRecurringTaskId, setEditingRecurringTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const editingTask = useMemo(() => tasks.find(t => t.id === editingTaskId) || null, [tasks, editingTaskId]);
  const timerRef = useRef<number | null>(null);
  const syncTimeoutRef = useRef<number | null>(null);
  const energyRank = { 'Baixa': 1, 'Média': 2, 'Alta': 3 };

  const playAudio = useCallback((url: string) => {
    if (!isSoundEnabled) return;
    new Audio(url).play().catch(() => {});
  }, [isSoundEnabled]);

  const toggleSound = () => {
    const newState = !isSoundEnabled;
    setIsSoundEnabled(newState);
    localStorage.setItem('neuro-sound-enabled', String(newState));
  };

  const toggleDarkMode = () => {
    const newState = !isDarkMode;
    setIsDarkMode(newState);
    localStorage.setItem('neuro-dark-mode', String(newState));
  };

  useEffect(() => {
    if (!isDarkMode) {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [isDarkMode]);

  const triggerPush = useCallback(async () => {
    if (!userEmail) return;
    setSyncStatus('syncing');
    const dataToPush = { tasks, recurringTasks, habits, points, upgrades, achievements, timebox };
    const success = await syncService.pushData(userEmail, dataToPush);
    if (success) {
      setSyncStatus('synced');
      setLastRemoteUpdate(Date.now());
    } else {
      setSyncStatus('error');
    }
  }, [userEmail, tasks, recurringTasks, habits, points, upgrades, achievements, timebox]);

  useEffect(() => {
    if (!isDataLoaded || !userEmail) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = window.setTimeout(triggerPush, 2000);
  }, [tasks, recurringTasks, habits, points, upgrades, achievements, timebox, userEmail, isDataLoaded]);

  useEffect(() => {
    if (!userEmail) return;
    const interval = setInterval(async () => {
      // Corrected: use 'userEmail' instead of undefined 'email'
      const remote = await syncService.pullData(userEmail);
      if (remote && remote.updatedAt > lastRemoteUpdate) {
        setTasks(remote.tasks || []);
        setRecurringTasks(remote.recurringTasks || []);
        setHabits(remote.habits || []);
        setPoints(remote.points || 0);
        setTimebox(remote.timebox || []);
        setUpgrades(remote.upgrades || INITIAL_UPGRADES);
        setAchievements(remote.achievements || INITIAL_ACHIEVEMENTS);
        setLastRemoteUpdate(remote.updatedAt);
        setSyncStatus('synced');
        playAudio(SOUNDS.BLOCK_SYNC);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [userEmail, lastRemoteUpdate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailValue = (e.target as any).email.value;
    if (!emailValue) return;
    setUserEmail(emailValue);
    localStorage.setItem('neuro-user-email', emailValue);
    setSyncStatus('syncing');
    const remote = await syncService.pullData(emailValue);
    if (remote) {
      setTasks(remote.tasks || []);
      setRecurringTasks(remote.recurringTasks || []);
      setHabits(remote.habits || []);
      setPoints(remote.points || 0);
      setTimebox(remote.timebox || []);
      setUpgrades(remote.upgrades || INITIAL_UPGRADES);
      setAchievements(remote.achievements || INITIAL_ACHIEVEMENTS);
      setLastRemoteUpdate(remote.updatedAt);
      setSyncStatus('synced');
    }
  };

  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerActive, timeLeft]);

  useEffect(() => {
    const updatePeriod = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) setCurrentPeriod('Morning');
      else if (hour >= 12 && hour < 18) setCurrentPeriod('Day');
      else if (hour >= 18 && hour < 22) setCurrentPeriod('Evening');
      else setCurrentPeriod('Night');
    };
    updatePeriod();
    const interval = setInterval(updatePeriod, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const local = localStorage.getItem('neuro_v11');
    if (local) {
      const p = JSON.parse(local);
      setTasks(p.tasks || []);
      setRecurringTasks(p.recurringTasks || []);
      setHabits(p.habits || []);
      setPoints(p.points || 0);
      setTimebox(p.timebox || []);
      setUpgrades(p.upgrades || INITIAL_UPGRADES);
      setAchievements(p.achievements || INITIAL_ACHIEVEMENTS);
    }
    setIsDataLoaded(true);
  }, []);

  useEffect(() => {
    if (!isDataLoaded) return;
    localStorage.setItem('neuro_v11', JSON.stringify({ tasks, recurringTasks, habits, points, upgrades, achievements, timebox }));
  }, [tasks, recurringTasks, habits, points, upgrades, achievements, timebox, isDataLoaded]);

  const handleSmartCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    const taskInput = newTaskText.trim();
    if (!taskInput) return;
    const tempId = crypto.randomUUID();
    const tempTask: Task = {
      id: tempId,
      text: taskInput,
      priority: Priority.Q2,
      energy: 'Média',
      capacityNeeded: 'Neutro',
      completed: false,
      subtasks: [],
      date: new Date().toISOString().split('T')[0],
      createdAt: Date.now(),
      isRefining: true
    };
    setTasks(prev => [tempTask, ...prev]);
    setNewTaskText("");
    setPoints(p => p + 15);
    playAudio(SOUNDS.CAPTURE);
    try {
      const parsed = await geminiService.parseNaturalTask(taskInput);
      setTasks(prev => prev.map(t => t.id === tempId ? {
        ...t,
        priority: (parsed.priority as Priority) || t.priority,
        energy: (parsed.energy as any) || t.energy,
        subtasks: parsed.subtasks || [],
        isRefining: false
      } : t));
    } catch (error) {
      setTasks(prev => prev.map(t => t.id === tempId ? { ...t, isRefining: false } : t));
    }
  };

  const completeTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    setPoints(p => p + 100);
    playAudio(SOUNDS.TASK_COMPLETE);
    if (editingTaskId === id) setEditingTaskId(null);
  };

  const updateTaskDetails = (id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = (e: React.DragEvent, priority: Priority) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    updateTaskDetails(taskId, { priority });
    playAudio(SOUNDS.UPGRADE);
  };

  const isTaskCompatible = (task: Task) => energyRank[task.energy] <= energyRank[userEnergy];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const addTimeboxSlot = () => {
    const lastEntry = timebox[timebox.length - 1];
    const nextStart = lastEntry ? lastEntry.end : "08:00";
    const nextEnd = lastEntry ? (parseInt(lastEntry.end.split(':')[0]) + 1).toString().padStart(2, '0') + ":00" : "09:00";
    
    const newEntry: TimeboxEntry = {
      id: crypto.randomUUID(),
      start: nextStart,
      end: nextEnd,
      activity: "",
      completed: false
    };
    setTimebox([...timebox, newEntry]);
  };

  const updateTimeboxEntry = (id: string, updates: Partial<TimeboxEntry>) => {
    setTimebox(prev => prev.map(entry => entry.id === id ? { ...entry, ...updates } : entry));
  };

  const removeTimeboxEntry = (id: string) => {
    setTimebox(prev => prev.filter(entry => entry.id !== id));
  };

  const handleEditHabit = (id: string) => {
    setEditingHabitId(id);
    setShowHabitForm(true);
  };

  const handleDeleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  const handleEditRecurring = (id: string) => {
    setEditingRecurringTaskId(id);
    setShowRecurringForm(true);
  };

  const handleDeleteRecurring = (id: string) => {
    setRecurringTasks(prev => prev.filter(rt => rt.id !== id));
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-all duration-300 ${!isDarkMode ? 'light-mode' : ''}`}>
      
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-72 h-screen theme-bg-sidebar border-r p-8 space-y-6 z-50 overflow-y-auto no-scrollbar">
        <div className="flex items-center gap-3"><SynapseLogo /><h1 className="text-2xl font-black italic text-orange-600 uppercase tracking-tighter">Neuro</h1></div>
        
        <div className="p-4 theme-bg-input border rounded-3xl space-y-3 relative group">
           <div className="flex justify-between items-center">
              <p className="text-[9px] font-black uppercase theme-text-muted tracking-widest">Neuro-Identity</p>
              <div className="flex gap-2 items-center">
                <button onClick={toggleDarkMode} title={isDarkMode ? "Modo Claro" : "Modo Escuro"} className="p-1.5 rounded-lg hover:bg-slate-800 transition-all text-slate-400 hover:text-orange-500 active:scale-90">
                   {isDarkMode ? <Sun size={14}/> : <Moon size={14}/>}
                </button>
                <button onClick={toggleSound} title={isSoundEnabled ? "Desativar Som" : "Ativar Som"} className="p-1.5 rounded-lg hover:bg-slate-800 transition-all text-slate-400 hover:text-orange-500 active:scale-90">
                   {isSoundEnabled ? <Volume2 size={14}/> : <VolumeX size={14}/>}
                </button>
                <div className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-green-500 shadow-glow-green' : syncStatus === 'syncing' ? 'bg-orange-500 animate-pulse' : syncStatus === 'error' ? 'bg-red-500' : 'bg-slate-700'}`}></div>
              </div>
           </div>
           {userEmail ? (
             <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold truncate theme-text-main">{userEmail}</span>
                <button onClick={() => { setUserEmail(''); localStorage.removeItem('neuro-user-email'); }} className="text-[8px] font-black uppercase text-red-500/60 hover:text-red-500 transition-colors">Sair / Desconectar</button>
             </div>
           ) : (
             <form onSubmit={handleLogin} className="flex flex-col gap-2">
                <input name="email" type="email" placeholder="Seu e-mail..." className="w-full theme-bg-body border theme-border rounded-xl px-3 py-2 text-[10px] outline-none focus:border-orange-500 transition-all" required />
                <button type="submit" className="w-full py-2 bg-orange-600 rounded-xl text-[9px] font-black uppercase shadow-glow-orange hover:scale-105 active:scale-95 transition-all text-white">Sincronizar Cloud</button>
             </form>
           )}
        </div>

        <div className="p-4 theme-bg-input border rounded-3xl space-y-3">
          <p className="text-[9px] font-black uppercase theme-text-muted tracking-widest text-center">Bateria Biológica</p>
          <div className="flex justify-between items-center gap-2">
            {[
              { val: 'Baixa', color: 'text-red-500', icon: <BatteryLow size={18}/> },
              { val: 'Média', color: 'text-yellow-500', icon: <BatteryMedium size={18}/> },
              { val: 'Alta', color: 'text-green-500', icon: <BatteryFull size={18}/> }
            ].map(e => (
              <button key={e.val} onClick={() => setUserEnergy(e.val as any)} className={`flex-1 flex flex-col items-center p-2 rounded-xl transition-all ${userEnergy === e.val ? 'bg-orange-600/10 border-orange-500/30 shadow-glow-orange scale-110' : 'opacity-40 hover:opacity-100'}`}>
                <div className={e.color}>{e.icon}</div>
                <span className="text-[8px] font-black uppercase mt-1">{e.val}</span>
              </button>
            ))}
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <NavBtn icon={<ListTodo/>} label="Captura" active={activeTab === 'capture'} onClick={() => setActiveTab('capture')}/>
          <NavBtn icon={<Timer/>} label="Executar" active={activeTab === 'execute'} onClick={() => setActiveTab('execute')}/>
          <NavBtn icon={<LayoutGrid/>} label="Matriz" active={activeTab === 'plan'} onClick={() => setActiveTab('plan')}/>
          <NavBtn icon={<RefreshCw/>} label="Hábitos" active={activeTab === 'habits'} onClick={() => setActiveTab('habits')}/>
          <NavBtn icon={<CalendarRange/>} label="Rotinas" active={activeTab === 'fixed'} onClick={() => setActiveTab('fixed')}/>
          <NavBtn icon={<TrendingUp/>} label="Evolução" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}/>
          <NavBtn icon={<Binary/>} label="Upgrades" active={activeTab === 'upgrades'} onClick={() => setActiveTab('upgrades')}/>
        </nav>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto p-4 md:p-10 pb-32 relative">
        {TUTORIAL_DATA[activeTab] && (
          <button 
            onClick={() => setTutorialStep(0)} 
            className="fixed top-6 right-6 z-40 w-12 h-12 theme-bg-card border theme-border rounded-full flex items-center justify-center text-orange-500 hover:scale-110 active:scale-95 transition-all shadow-xl animate-pulse"
            title="Aprender neuropsicologia desta aba"
          >
            <HelpCircle size={24}/>
          </button>
        )}

        <div className="max-w-6xl mx-auto space-y-10">
          {activeTab === 'capture' && (
            <div className="min-h-[80vh] flex flex-col justify-center animate-in fade-in zoom-in-95">
              <div className="text-center space-y-4 mb-12">
                <div className="w-20 h-20 bg-orange-600/10 rounded-full flex items-center justify-center mx-auto border border-orange-600/20 shadow-glow-orange"><BrainIcon className="text-orange-500" size={32}/></div>
                <h2 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter">Entrada Neural</h2>
                <p className="text-[11px] font-black theme-text-muted uppercase tracking-[0.4em]">Esvazie sua mente instantaneamente.</p>
              </div>
              <form onSubmit={handleSmartCapture} className="relative group max-w-2xl mx-auto w-full px-4 md:px-0">
                <div className="p-6 md:p-8 rounded-[48px] border-4 transition-all duration-500 theme-bg-card border-slate-800 focus-within:border-orange-600 shadow-glow-orange/20">
                  <div className="flex items-center gap-4">
                    <input autoFocus value={newTaskText} onChange={e => setNewTaskText(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-2xl md:text-3xl font-black theme-text-main" placeholder="No que você está pensando?" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSmartCapture(e); }} />
                    <button type="submit" className="w-14 h-14 md:w-16 md:h-16 bg-orange-600 rounded-3xl flex items-center justify-center shadow-glow-orange hover:scale-110 active:scale-95 transition-all text-white"><Plus size={32}/></button>
                  </div>
                </div>
              </form>
              <div className="max-w-xl mx-auto w-full mt-10 space-y-3 px-4 md:px-0">
                {tasks.slice(0, 3).map(t => (
                  <div key={t.id} className={`p-4 rounded-2xl theme-bg-card border theme-border flex items-center justify-between animate-in slide-in-from-top-4 ${t.isRefining ? 'border-orange-500/50 shadow-glow-orange/10 italic opacity-70' : ''}`}>
                    <div className="flex items-center gap-3">
                      {t.isRefining ? <Loader2 className="animate-spin text-orange-500" size={16}/> : <CheckCircle2 className="theme-text-muted opacity-40" size={16}/>}
                      <span className="text-xs font-bold uppercase tracking-tight theme-text-main">{t.text}</span>
                    </div>
                    {!t.isRefining && (
                      <button onClick={() => setEditingTaskId(t.id)} className="p-2 theme-text-muted hover:text-orange-500 transition-colors">
                        <Edit3 size={14}/>
                      </button>
                    )}
                    {t.isRefining && <span className="text-[8px] font-black uppercase text-orange-500 animate-pulse">Sintonizando IA...</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'execute' && (
            <div className="animate-in fade-in slide-in-from-bottom-10 space-y-12">
              <div className="flex flex-col lg:flex-row gap-10">
                <div className="flex-1 space-y-6">
                  <div className="p-10 theme-bg-card rounded-[64px] border theme-border flex flex-col items-center justify-center space-y-8 relative overflow-hidden group min-h-[400px] shadow-xl">
                    <div className="text-8xl md:text-9xl font-black italic tracking-tighter tabular-nums theme-text-main drop-shadow-2xl">{formatTime(timeLeft)}</div>
                    <div className="flex gap-4">
                      <button onClick={() => setIsTimerActive(!isTimerActive)} className="px-10 py-5 bg-orange-600 text-white rounded-3xl font-black uppercase flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-glow-orange">{isTimerActive ? <><Pause size={20}/> Pausar</> : <><Play size={20}/> Fluxo</>}</button>
                      <button onClick={() => setTimeLeft(90*60)} className="p-5 theme-bg-input border theme-border rounded-3xl hover:opacity-80 transition-colors theme-text-main"><RotateCcw size={20}/></button>
                    </div>
                  </div>

                  <div className="p-8 theme-bg-card/40 border theme-border rounded-[48px] space-y-6 shadow-sm">
                    <div className="flex justify-between items-center">
                       <div className="flex items-center gap-3">
                          <Clock className="text-orange-500" size={20}/>
                          <h3 className="text-xl font-black uppercase italic tracking-tighter theme-text-main">Timebox Diário</h3>
                       </div>
                       <button onClick={addTimeboxSlot} className="p-2 bg-orange-600/10 text-orange-500 rounded-xl hover:bg-orange-600 hover:text-white transition-all"><Plus size={18}/></button>
                    </div>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
                       {timebox.length === 0 ? (
                         <p className="text-center py-10 text-[10px] font-black uppercase theme-text-muted border border-dashed theme-border rounded-3xl">Nenhum bloco de tempo definido para hoje.</p>
                       ) : (
                         timebox.map((entry) => (
                           <div key={entry.id} className={`group flex items-center gap-4 p-4 rounded-3xl border transition-all ${entry.completed ? 'opacity-40 grayscale theme-bg-body' : 'theme-bg-card shadow-sm hover:border-orange-500/30'}`}>
                              <div className="flex flex-col gap-1 w-20">
                                 <input type="text" value={entry.start} onChange={e => updateTimeboxEntry(entry.id, { start: e.target.value })} className="bg-transparent text-[10px] font-black theme-text-muted outline-none w-full text-center hover:text-orange-500 transition-colors"/>
                                 <div className="h-px theme-bg-body w-full opacity-10"/>
                                 <input type="text" value={entry.end} onChange={e => updateTimeboxEntry(entry.id, { end: e.target.value })} className="bg-transparent text-[10px] font-black theme-text-muted outline-none w-full text-center hover:text-orange-500 transition-colors"/>
                              </div>
                              <input 
                                type="text" 
                                value={entry.activity} 
                                onChange={e => updateTimeboxEntry(entry.id, { activity: e.target.value })} 
                                placeholder="Descreva a atividade..."
                                className={`flex-1 bg-transparent font-bold text-sm outline-none ${entry.completed ? 'line-through theme-text-muted' : 'theme-text-main'}`}
                              />
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => updateTimeboxEntry(entry.id, { completed: !entry.completed })} className={`p-2 rounded-lg transition-all ${entry.completed ? 'text-green-500 bg-green-500/10' : 'theme-text-muted hover:text-green-500 hover:bg-green-500/10'}`}><Check size={16}/></button>
                                <button onClick={() => removeTimeboxEntry(entry.id)} className="p-2 rounded-lg theme-text-muted hover:text-red-500 hover:bg-red-500/10"><Trash2 size={16}/></button>
                              </div>
                           </div>
                         ))
                       )}
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-96 flex flex-col gap-6">
                  {(() => {
                    const recommended = tasks.find(t => !t.completed && isTaskCompatible(t) && !t.isRefining);
                    return recommended ? (
                      <div className="p-8 bg-orange-600 rounded-[48px] shadow-glow-orange flex flex-col justify-between min-h-[220px]">
                         <div className="space-y-2">
                           <span className="text-[10px] font-black uppercase text-white/70 tracking-widest">Bio-Compatível Agora</span>
                           <h4 className="text-2xl font-black uppercase leading-tight text-white">{recommended.text}</h4>
                         </div>
                         <button onClick={() => setEditingTaskId(recommended.id)} className="mt-8 flex items-center justify-center gap-3 py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase border border-white/20 transition-all text-white w-full">
                            <Edit3 size={16}/> Ajustar Detalhes
                         </button>
                      </div>
                    ) : (
                      <div className="p-8 theme-bg-card border border-dashed theme-border rounded-[48px] flex flex-col items-center justify-center text-center space-y-4 min-h-[220px]">
                         <ZapOff className="theme-text-muted opacity-30" size={48}/>
                         <p className="text-[11px] font-black uppercase theme-text-muted">Nenhuma tarefa pronta para sua energia {userEnergy}</p>
                      </div>
                    );
                  })()}

                  <div className="space-y-4">
                     <h3 className="text-[11px] font-black uppercase theme-text-muted tracking-widest px-2">Fila Bio-Compatível</h3>
                     <div className="space-y-3">
                       {tasks.filter(t => !t.completed && isTaskCompatible(t)).slice(0, 5).map(t => (
                         <div key={t.id} className="p-4 theme-bg-card border theme-border rounded-3xl flex items-center justify-between hover:border-orange-500/50 transition-all cursor-default shadow-sm group">
                            <div className="flex items-center gap-3 truncate">
                              <button onClick={() => setEditingTaskId(t.id)} className="p-1.5 theme-text-muted hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-all">
                                <Edit3 size={14}/>
                              </button>
                              <span className="text-xs font-bold uppercase truncate theme-text-main">{t.text}</span>
                            </div>
                            <button onClick={() => completeTask(t.id)} className="w-8 h-8 rounded-lg theme-bg-input border theme-border flex items-center justify-center hover:bg-orange-600 transition-all theme-text-main hover:text-white"><Check size={14}/></button>
                         </div>
                       ))}
                     </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'plan' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in pb-10">
              {[
                { q: Priority.Q1, label: 'Crise & Foco', color: 'border-red-500/30 theme-bg-card', text: 'text-red-500' },
                { q: Priority.Q2, label: 'Estratégico', color: 'border-orange-500/30 theme-bg-card', text: 'text-orange-500' },
                { q: Priority.Q3, label: 'Interrupções', color: 'border-blue-500/30 theme-bg-card', text: 'text-blue-500' },
                { q: Priority.Q4, label: 'Eliminar', color: 'theme-border theme-bg-card', text: 'theme-text-muted' }
              ].map(block => (
                <div key={block.q} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, block.q)} className={`p-8 rounded-[48px] border min-h-[400px] flex flex-col space-y-6 transition-all duration-300 ${block.color} hover:border-slate-500/50 shadow-sm`}>
                  <h3 className={`text-xl font-black uppercase italic tracking-tighter ${block.text}`}>{block.label}</h3>
                  <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
                    {tasks.filter(t => t.priority === block.q && !t.completed).map(t => (
                      <div key={t.id} draggable={!t.isRefining} onDragStart={(e) => handleDragStart(e, t.id)} onClick={() => !t.isRefining && setEditingTaskId(t.id)} className={`p-5 rounded-2xl border cursor-pointer group transition-all transform active:scale-95 ${isTaskCompatible(t) && !t.isRefining ? 'theme-bg-input theme-border shadow-sm' : 'opacity-50 theme-bg-body'} ${t.isRefining ? 'animate-pulse' : ''}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black uppercase theme-text-main">{t.text}</span>
                          {!t.isRefining ? <GripVertical size={14} className="theme-text-muted opacity-30 group-hover:opacity-100"/> : <Loader2 size={14} className="animate-spin text-orange-500"/>}
                        </div>
                        <div className="flex gap-2 mt-3">
                           <span className="text-[8px] font-black uppercase theme-bg-body px-2 py-0.5 rounded-full theme-text-muted border theme-border">{t.energy} Energia</span>
                           {t.subtasks.length > 0 && <span className="text-[8px] font-black uppercase theme-bg-body px-2 py-0.5 rounded-full text-blue-500 border theme-border">{t.subtasks.length} Subtarefas</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'habits' && <HabitsView habits={habits} setHabits={setHabits} setPoints={setPoints} playAudio={playAudio} setShowHabitForm={setShowHabitForm} onEdit={handleEditHabit} onDelete={handleDeleteHabit} />}
          {activeTab === 'fixed' && <FixedView recurringTasks={recurringTasks} setRecurringTasks={setRecurringTasks} currentPeriod={currentPeriod} setPoints={setPoints} setShowRecurringForm={setShowRecurringForm} onEdit={handleEditRecurring} onDelete={handleDeleteRecurring} playAudio={playAudio} />}
          {activeTab === 'dashboard' && <DashboardView tasks={tasks} habits={habits} points={points} achievements={achievements}/>}
          {activeTab === 'upgrades' && <UpgradesView upgrades={upgrades} points={points} setPoints={setPoints} setUpgrades={setUpgrades} playAudio={playAudio}/>}
        </div>
      </main>

      {/* TUTORIAL MODAL OVERLAY */}
      {tutorialStep !== null && TUTORIAL_DATA[activeTab] && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
           <div className="w-full max-w-lg theme-bg-card border-2 border-orange-500 shadow-glow-orange rounded-[48px] p-8 md:p-12 flex flex-col items-center text-center space-y-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 flex gap-1">
                 {TUTORIAL_DATA[activeTab].steps.map((_, i) => (
                    <div key={i} className={`flex-1 h-full transition-all duration-500 ${i <= tutorialStep ? 'bg-orange-500' : 'theme-bg-body'}`}></div>
                 ))}
              </div>

              <div className="w-20 h-20 bg-orange-600/10 rounded-full flex items-center justify-center border border-orange-500/30 text-orange-500 synapse-core">
                 <BrainIcon size={40}/>
              </div>

              <div className="space-y-2">
                 <h2 className="text-3xl font-black uppercase italic tracking-tighter text-orange-500">{TUTORIAL_DATA[activeTab].title}</h2>
                 <p className="text-[10px] font-black uppercase theme-text-muted tracking-[0.3em]">Módulo de Aprendizado {tutorialStep + 1}/{TUTORIAL_DATA[activeTab].steps.length}</p>
              </div>

              <div className="space-y-6">
                 <p className="text-2xl font-bold leading-tight theme-text-main">
                    {TUTORIAL_DATA[activeTab].steps[tutorialStep].text}
                 </p>

                 <div className="p-6 theme-bg-input rounded-3xl border theme-border w-full text-left space-y-4">
                    <div className="flex items-center gap-2 text-orange-400">
                       <BookOpenCheck size={18}/>
                       <span className="text-[10px] font-black uppercase tracking-widest">Base Neuropsicológica</span>
                    </div>
                    <p className="text-sm theme-text-main leading-relaxed italic">
                       {TUTORIAL_DATA[activeTab].steps[tutorialStep].concept}
                    </p>
                    
                    <div className="pt-2 flex items-start gap-3 border-t theme-border">
                       <div className="mt-1 text-green-500"><Zap size={14}/></div>
                       <div className="space-y-0.5">
                          <p className="text-[9px] font-black uppercase theme-text-muted">Dica de Ação</p>
                          <p className="text-xs font-semibold theme-text-main">{TUTORIAL_DATA[activeTab].steps[tutorialStep].actionTip}</p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="flex w-full gap-4">
                 <button 
                   onClick={() => tutorialStep > 0 ? setTutorialStep(tutorialStep - 1) : setTutorialStep(null)} 
                   className="flex-1 py-5 rounded-3xl font-black uppercase text-[11px] border theme-border hover:theme-bg-body transition-all theme-text-muted"
                 > 
                   {tutorialStep === 0 ? "Fechar" : "Voltar"}
                 </button>
                 <button 
                   onClick={() => tutorialStep < TUTORIAL_DATA[activeTab].steps.length - 1 ? setTutorialStep(tutorialStep + 1) : setTutorialStep(null)} 
                   className="flex-1 py-5 bg-orange-600 rounded-3xl font-black uppercase text-[11px] shadow-glow-orange hover:scale-105 active:scale-95 transition-all text-white"
                 > 
                   {tutorialStep < TUTORIAL_DATA[activeTab].steps.length - 1 ? "Próximo Passo" : "Entendi e Vou Praticar"}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* TASK DETAIL EDITOR MODAL */}
      {editingTask && (
        <div className="fixed inset-0 z-[8000] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md animate-in fade-in">
           <div className="w-full max-w-2xl theme-bg-card border theme-border rounded-[48px] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
              <div className="p-8 border-b theme-border flex justify-between items-center bg-black/5">
                 <div className="flex items-center gap-4 text-orange-600">
                    <Edit3 size={24}/>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter">Andaimação Neural</h2>
                 </div>
                 <button onClick={() => setEditingTaskId(null)} className="p-2 theme-text-muted hover:bg-black/10 rounded-full transition-colors">
                    <X size={24}/>
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-8 no-scrollbar">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase theme-text-muted tracking-widest">Intenção da Tarefa</label>
                    <input 
                      className="w-full theme-bg-input border theme-border p-4 rounded-2xl text-xl font-bold focus:border-orange-600 outline-none theme-text-main" 
                      value={editingTask.text} 
                      onChange={e => updateTaskDetails(editingTask.id, { text: e.target.value })} 
                    />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase theme-text-muted tracking-widest">Demanda Energética</label>
                       <div className="flex gap-2">
                          {['Baixa', 'Média', 'Alta'].map(ev => (
                            <button 
                              key={ev} 
                              onClick={() => updateTaskDetails(editingTask.id, { energy: ev as any })} 
                              className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${editingTask.energy === ev ? 'bg-orange-600 border-orange-500 text-white shadow-glow-orange' : 'theme-bg-input theme-text-muted theme-border hover:border-slate-500'}`}
                            > 
                              {ev} 
                            </button>
                          ))}
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase theme-text-muted tracking-widest">Prioridade Eisenhower</label>
                       <div className="flex gap-2">
                          {Object.values(Priority).map(p => (
                            <button 
                              key={p} 
                              onClick={() => updateTaskDetails(editingTask.id, { priority: p })} 
                              className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${editingTask.priority === p ? 'bg-blue-600 border-blue-500 text-white shadow-glow-blue' : 'theme-bg-input theme-text-muted theme-border hover:border-slate-500'}`}
                            > 
                              {p} 
                            </button>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase theme-text-muted tracking-widest">Notas de Execução</label>
                    <textarea 
                      className="w-full theme-bg-input border theme-border p-4 rounded-2xl min-h-[100px] text-sm focus:border-orange-600 outline-none resize-none theme-text-main" 
                      placeholder="Adicione detalhes, links ou contexto para reduzir a carga cognitiva no momento da ação..." 
                      value={editingTask.notes || ""} 
                      onChange={e => updateTaskDetails(editingTask.id, { notes: e.target.value })} 
                    />
                 </div>

                 <div className="space-y-4">
                    <div className="flex justify-between items-center">
                       <label className="text-[10px] font-black uppercase theme-text-muted tracking-widest">Micro-passos (Subtarefas)</label>
                       <button 
                         onClick={() => updateTaskDetails(editingTask.id, { subtasks: [...editingTask.subtasks, ""] })}
                         className="text-[9px] font-black uppercase text-orange-500 hover:text-orange-600 flex items-center gap-1"
                       >
                         <Plus size={12}/> Adicionar Passo
                       </button>
                    </div>
                    <div className="space-y-2">
                       {editingTask.subtasks.map((st, i) => (
                         <div key={i} className="flex gap-2 items-center">
                            <input 
                              className="flex-1 theme-bg-input border theme-border p-3 rounded-xl text-xs focus:border-blue-500 outline-none theme-text-main" 
                              value={st} 
                              placeholder="Passo simples e concreto..."
                              onChange={e => { 
                                const newSt = [...editingTask.subtasks]; 
                                newSt[i] = e.target.value; 
                                updateTaskDetails(editingTask.id, { subtasks: newSt }); 
                              }} 
                            />
                            <button 
                              onClick={() => { 
                                const newSt = editingTask.subtasks.filter((_, idx) => idx !== i); 
                                updateTaskDetails(editingTask.id, { subtasks: newSt }); 
                              }} 
                              className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                            >
                              <Trash2 size={16}/>
                            </button>
                         </div>
                       ))}
                       {editingTask.subtasks.length === 0 && (
                          <p className="text-center py-4 text-[10px] font-black uppercase theme-text-muted border border-dashed theme-border rounded-xl">
                             Nenhum micro-passo definido. Decompor tarefas ajuda a vencer a procrastinação.
                          </p>
                       )}
                    </div>
                 </div>
              </div>

              <div className="p-8 border-t theme-border flex gap-4 bg-black/5">
                 <button 
                   onClick={() => completeTask(editingTask.id)} 
                   className="flex-1 py-4 bg-green-600 rounded-2xl font-black uppercase text-xs shadow-glow-green hover:scale-105 active:scale-95 transition-all text-white"
                 >
                   Completar Tarefa
                 </button>
                 <button 
                   onClick={() => { 
                     setTasks(tasks.filter(t => t.id !== editingTask.id)); 
                     setEditingTaskId(null); 
                   }} 
                   className="px-6 py-4 bg-red-600/10 text-red-500 rounded-2xl font-black uppercase text-[10px] hover:bg-red-600 hover:text-white transition-all"
                 >
                   <Trash2 size={20}/>
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* MOBILE NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full theme-bg-sidebar backdrop-blur-xl border-t z-50 flex overflow-x-auto no-scrollbar px-4 py-3 gap-6 shadow-2xl">
        <MobIcon icon={<ListTodo/>} active={activeTab === 'capture'} onClick={() => setActiveTab('capture')}/>
        <MobIcon icon={<Timer/>} active={activeTab === 'execute'} onClick={() => setActiveTab('execute')}/>
        <MobIcon icon={<LayoutGrid/>} active={activeTab === 'plan'} onClick={() => setActiveTab('plan')}/>
        <MobIcon icon={<CalendarRange/>} active={activeTab === 'fixed'} onClick={() => setActiveTab('fixed')}/>
        <MobIcon icon={<RefreshCw/>} active={activeTab === 'habits'} onClick={() => setActiveTab('habits')}/>
        <MobIcon icon={<TrendingUp/>} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}/>
        <MobIcon icon={<Binary/>} active={activeTab === 'upgrades'} onClick={() => setActiveTab('upgrades')}/>
      </nav>

      {showHabitForm && <HabitForm habits={habits} setHabits={setHabits} setShowForm={setShowHabitForm} editingHabitId={editingHabitId} setEditingHabitId={setEditingHabitId} />}
      {showRecurringForm && <RecurringForm recurringTasks={recurringTasks} setRecurringTasks={setRecurringTasks} setShowForm={setShowRecurringForm} editingTaskId={editingRecurringTaskId} setEditingTaskId={setEditingRecurringTaskId} />}
    </div>
  );
};

/* VIEW COMPONENTS */

const HabitsView = ({ habits, setHabits, setPoints, playAudio, setShowHabitForm, onEdit, onDelete }: any) => (
  <div className="space-y-10 animate-in fade-in pb-10 px-4 md:px-0">
    <div className="flex justify-between items-end">
      <div><h2 className="text-4xl md:text-5xl font-black uppercase italic text-orange-600 tracking-tighter">Mielinização</h2><p className="text-[11px] font-black theme-text-muted uppercase tracking-widest mt-1">Repetição para automação neural.</p></div>
      <button onClick={() => setShowHabitForm(true)} className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center shadow-glow-orange hover:scale-110 active:scale-95 transition-all text-white"><Plus/></button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {habits.map((h: any) => {
        const today = new Date().toISOString().split('T')[0];
        const doneToday = h.lastCompleted === today;
        return (
          <div key={h.id} className="p-8 theme-bg-card border theme-border rounded-[48px] space-y-6 relative group/card hover:border-orange-500/30 transition-all shadow-sm">
            <div className="flex justify-between items-start">
              <h4 className="text-xl font-black uppercase pr-12 theme-text-main leading-tight">{h.identity}</h4>
              <div className="flex gap-1 mt-1">
                {Array.from({length: 3}).map((_, i) => (
                   <div key={i} className={`w-2.5 h-2.5 rounded-full ${h.streak > i ? 'bg-orange-500 shadow-glow-orange' : 'theme-bg-body'}`}/>
                ))}
              </div>
            </div>
            
            <div className="absolute top-8 right-8 flex gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
              <button onClick={() => onEdit(h.id)} className="p-2 theme-text-muted hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all"><Edit3 size={16}/></button>
              <button onClick={() => onDelete(h.id)} className="p-2 theme-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={16}/></button>
            </div>

            <p className="text-xs italic theme-text-muted border-l-2 theme-border pl-3">"{h.text}"</p>
            <button onClick={() => { if (h.lastCompleted === today) return; setHabits(habits.map((item: any) => item.id === h.id ? {...item, streak: item.streak + 1, lastCompleted: today} : item)); setPoints((p: number) => p + 50); playAudio(SOUNDS.HABIT_COMPLETE); }} disabled={doneToday} className={`w-full py-4 rounded-2xl font-black uppercase text-[11px] transition-all tracking-widest ${doneToday ? 'bg-green-600/10 text-green-500 border border-green-500/20' : 'bg-orange-600 shadow-glow-orange hover:scale-105 active:scale-95 text-white'}`}> {doneToday ? 'Neuralizado Hoje' : 'Reforçar Identidade'} </button>
          </div>
        )
      })}
    </div>
  </div>
);

const FixedView = ({ recurringTasks, setRecurringTasks, currentPeriod, setPoints, setShowRecurringForm, onEdit, onDelete, playAudio }: any) => {
  const currentDay = new Date().getDay();

  const isTaskForToday = (rt: RecurringTask) => {
    if (rt.frequency === Frequency.DAILY) return true;
    if (rt.frequency === Frequency.WEEKLY && rt.weekDays?.includes(currentDay)) return true;
    return false;
  };

  return (
    <div className="space-y-12 animate-in fade-in pb-10 px-4 md:px-0">
      <div className="flex justify-between items-end">
        <div><h2 className="text-4xl md:text-5xl font-black uppercase italic text-purple-400 tracking-tighter">Bio-Ciclos</h2><p className="text-[11px] font-black theme-text-muted uppercase tracking-widest mt-1">Sincronia circadiana e estrutural.</p></div>
        <button onClick={() => setShowRecurringForm(true)} className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center shadow-glow-blue hover:scale-110 active:scale-95 transition-all text-white"><Plus/></button>
      </div>
      <div className="space-y-8">
        {(['Morning', 'Day', 'Evening', 'Night'] as DayPeriod[]).map(p => {
          const periodTasks = recurringTasks.filter((rt: any) => rt.period === p);
          if (periodTasks.length === 0 && currentPeriod !== p) return null;

          return (
            <div key={p} className={`p-6 md:p-8 rounded-[40px] border transition-all duration-500 ${currentPeriod === p ? 'theme-bg-card border-purple-500/40 shadow-xl' : 'opacity-60 theme-bg-body grayscale theme-border'}`}>
              <div className="flex items-center gap-3 mb-6">
                 {p === 'Morning' && <Sunrise className="text-purple-400" size={20}/>}
                 {p === 'Day' && <Sun className="text-purple-400" size={20}/>}
                 {p === 'Evening' && <Sunset className="text-purple-400" size={20}/>}
                 {p === 'Night' && <MoonStar className="text-purple-400" size={20}/>}
                 <h3 className="font-black uppercase text-sm text-purple-400 tracking-widest italic">{PERIOD_LABELS[p]}</h3>
                 {currentPeriod === p && <span className="text-[8px] font-black uppercase bg-purple-500 text-white px-2 py-0.5 rounded-full animate-pulse">Ativo</span>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {periodTasks.map((rt: any) => {
                   const todayStr = new Date().toISOString().split('T')[0];
                   const done = rt.completedDates.includes(todayStr);
                   const isToday = isTaskForToday(rt);

                   return (
                    <div 
                      key={rt.id} 
                      className={`p-5 rounded-3xl flex justify-between items-center group transition-all border ${done ? 'grayscale opacity-50 theme-bg-body' : 'theme-bg-input theme-border hover:border-purple-500/50'} ${isToday && !done ? 'border-purple-500/50 shadow-md scale-[1.01]' : ''}`}
                    >
                      <div className="flex flex-col gap-1.5 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs md:text-sm font-bold uppercase truncate ${done ? 'line-through theme-text-muted' : 'theme-text-main'}`}>{rt.text}</span>
                          {isToday && !done && <span className="text-[8px] font-black uppercase bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">Hoje</span>}
                        </div>
                        <div className="flex items-center gap-3">
                           <span className="text-[8px] font-black uppercase theme-text-muted bg-black/5 theme-bg-body px-2 py-0.5 rounded-md">{rt.frequency}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onEdit(rt.id)} className="p-2 theme-text-muted hover:text-purple-400 hover:bg-purple-400/10 rounded-lg"><Edit3 size={14}/></button>
                          <button onClick={() => onDelete(rt.id)} className="p-2 theme-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 size={14}/></button>
                        </div>
                        <div 
                          onClick={() => { 
                            setRecurringTasks(recurringTasks.map((item: any) => item.id === rt.id ? {...item, completedDates: done ? item.completedDates.filter((d: string) => d !== todayStr) : [...item.completedDates, todayStr]} : item)); 
                            if(!done) { setPoints((pts: number) => pts + 25); playAudio(SOUNDS.TASK_COMPLETE); }
                          }} 
                          className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all ${done ? 'bg-green-600 shadow-glow-green scale-110 text-white' : 'theme-bg-sidebar border theme-border hover:border-purple-500 theme-text-muted'}`}>{done && <Check size={18}/>}</div>
                      </div>
                    </div>
                   );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DashboardView = ({ tasks, habits, points, achievements }: any) => (
  <div className="space-y-10 animate-in fade-in pb-10 px-4 md:px-0">
    <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter theme-text-main">Dashboard Neural</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard icon={<Target/>} val={tasks.filter((t: any) => t.completed).length} label="Concluídas"/>
      <StatCard icon={<Flame/>} val={Math.max(...habits.map((h: any) => h.streak), 0)} label="Melhor Streak"/>
      <StatCard icon={<Gem/>} val={points} label="Neuro-XP"/>
      <StatCard icon={<Award/>} val={achievements.filter((a: any) => a.unlockedAt).length} label="Conquistas"/>
    </div>
  </div>
);

const UpgradesView = ({ upgrades, points, setPoints, setUpgrades, playAudio }: any) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10 px-4 md:px-0">
    {upgrades.map((u: any) => (
      <div key={u.id} className={`p-8 rounded-[48px] border transition-all ${u.unlocked ? 'border-green-500/30 bg-green-500/5' : 'theme-bg-card theme-border shadow-sm'}`}>
        <div className="flex items-center gap-4 mb-4">
           <div className={`p-4 rounded-2xl ${u.unlocked ? 'bg-green-600 text-white' : 'theme-bg-input theme-text-muted'}`}><ZapBolt size={24}/></div>
           <h4 className="font-black uppercase text-xl theme-text-main">{u.name}</h4>
        </div>
        <p className="text-sm theme-text-muted mb-8 leading-relaxed">{u.description}</p>
        <button disabled={u.unlocked || points < u.cost} onClick={() => { setPoints(points - u.cost); setUpgrades(upgrades.map((up: any) => up.id === u.id ? {...up, unlocked: true} : up)); playAudio(SOUNDS.UPGRADE); }} className={`w-full py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all ${u.unlocked ? 'bg-green-600/20 text-green-500 cursor-default' : 'bg-orange-600 hover:scale-105 active:scale-95 text-white shadow-glow-orange disabled:opacity-30'}`}> {u.unlocked ? 'Integrado' : `${u.cost} XP - Sintetizar`} </button>
      </div>
    ))}
  </div>
);

const StatCard = ({ icon, val, label }: any) => (
  <div className="p-8 theme-bg-card border theme-border rounded-[48px] flex flex-col items-center gap-4 shadow-sm hover:border-orange-500/50 transition-all">
    <div className="text-orange-500 p-4 bg-orange-600/10 rounded-2xl">{icon}</div>
    <div className="text-center">
      <span className="block text-4xl font-black italic theme-text-main">{val}</span>
      <span className="text-[10px] font-black theme-text-muted uppercase tracking-[0.2em]">{label}</span>
    </div>
  </div>
);

const HabitForm = ({ habits, setHabits, setShowForm, editingHabitId, setEditingHabitId }: any) => {
  const editingHabit = useMemo(() => habits.find((h: any) => h.id === editingHabitId), [habits, editingHabitId]);

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-md">
      <form className="w-full max-w-lg theme-bg-card border theme-border rounded-[48px] p-8 md:p-10 space-y-6 shadow-2xl" onSubmit={e => { 
        e.preventDefault(); 
        const target = e.target as any; 
        if (editingHabitId) {
          setHabits(habits.map((h: any) => h.id === editingHabitId ? {
            ...h,
            text: target.text.value,
            anchor: target.anchor.value,
            tinyAction: target.tinyAction.value,
            identity: target.identity.value
          } : h));
        } else {
          const h: Habit = { id: crypto.randomUUID(), text: target.text.value, anchor: target.anchor.value, tinyAction: target.tinyAction.value, identity: target.identity.value, streak: 0, lastCompleted: null, completedDates: [] }; 
          setHabits([h, ...habits]); 
        }
        setShowForm(false);
        setEditingHabitId(null);
      }}>
        <h2 className="text-2xl font-black uppercase text-orange-600 italic">{editingHabitId ? 'Ajustar Mielinização' : 'Novo Hábito'}</h2>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase theme-text-muted tracking-widest">Identidade</label>
          <input name="identity" required defaultValue={editingHabit?.identity || ""} className="w-full p-4 rounded-xl theme-bg-input border theme-border theme-text-main outline-none focus:border-orange-500" placeholder="Ex: Sou o tipo de pessoa que..."/>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase theme-text-muted tracking-widest">O Hábito</label>
          <input name="text" required defaultValue={editingHabit?.text || ""} className="w-full p-4 rounded-xl theme-bg-input border theme-border theme-text-main outline-none focus:border-orange-500" placeholder="Ação"/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase theme-text-muted tracking-widest">Âncora</label>
            <input name="anchor" required defaultValue={editingHabit?.anchor || ""} className="w-full p-4 rounded-xl theme-bg-input border theme-border theme-text-main outline-none focus:border-orange-500" placeholder="Depois de..."/>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase theme-text-muted tracking-widest">Micro-ação</label>
            <input name="tinyAction" required defaultValue={editingHabit?.tinyAction || ""} className="w-full p-4 rounded-xl theme-bg-input border theme-border theme-text-main outline-none focus:border-orange-500" placeholder="Vou... (fácil)"/>
          </div>
        </div>
        <button type="submit" className="w-full py-5 bg-orange-600 rounded-2xl font-black uppercase shadow-glow-orange hover:scale-105 active:scale-95 transition-all text-white tracking-widest">
          {editingHabitId ? 'Atualizar Identidade' : 'Iniciar Repetição'}
        </button>
        <button type="button" onClick={() => { setShowForm(false); setEditingHabitId(null); }} className="w-full text-[10px] uppercase font-black theme-text-muted hover:text-orange-500 transition-colors tracking-widest">Cancelar</button>
      </form>
    </div>
  );
};

const RecurringForm = ({ recurringTasks, setRecurringTasks, setShowForm, editingTaskId, setEditingTaskId }: any) => {
  const editingTask = useMemo(() => recurringTasks.find((rt: any) => rt.id === editingTaskId), [recurringTasks, editingTaskId]);
  const [freq, setFreq] = useState<Frequency>(editingTask?.frequency || Frequency.DAILY);
  const [selectedDays, setSelectedDays] = useState<number[]>(editingTask?.weekDays || []);

  const toggleDay = (idx: number) => {
    setSelectedDays(prev => prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]);
  };

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-md">
      <form className="w-full max-w-lg theme-bg-card border theme-border rounded-[48px] p-8 md:p-10 space-y-6 shadow-2xl" onSubmit={e => { 
        e.preventDefault(); 
        const target = e.target as any; 
        if (editingTaskId) {
          setRecurringTasks(recurringTasks.map((rt: any) => rt.id === editingTaskId ? {
            ...rt,
            text: target.text.value, 
            frequency: freq, 
            energy: target.energy.value as any, 
            period: target.period.value, 
            weekDays: freq === Frequency.WEEKLY ? selectedDays : undefined
          } : rt));
        } else {
          const rt: RecurringTask = { 
            id: crypto.randomUUID(), 
            text: target.text.value, 
            frequency: freq, 
            priority: Priority.Q2, 
            energy: target.energy.value as any, 
            period: target.period.value, 
            completedDates: [],
            weekDays: freq === Frequency.WEEKLY ? selectedDays : undefined
          }; 
          setRecurringTasks([rt, ...recurringTasks]); 
        }
        setShowForm(false); 
        setEditingTaskId(null);
      }}>
        <h2 className="text-2xl font-black uppercase text-purple-400 italic">{editingTaskId ? 'Ajustar Ciclo' : 'Nova Rotina'}</h2>
        
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase theme-text-muted tracking-widest">O que se repete?</label>
          <input name="text" required defaultValue={editingTask?.text || ""} className="w-full p-4 rounded-xl theme-bg-input border theme-border theme-text-main focus:border-purple-500 outline-none" placeholder="Ex: Meditação matinal"/>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase theme-text-muted tracking-widest">Frequência</label>
            <select value={freq} onChange={(e) => setFreq(e.target.value as Frequency)} className="w-full p-4 rounded-xl theme-bg-input border theme-border font-bold theme-text-main outline-none appearance-none">
              {Object.values(Frequency).map(f => ( <option key={f} value={f} className="theme-bg-card">{f}</option> ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase theme-text-muted tracking-widest">Bio-Período</label>
            <select name="period" defaultValue={editingTask?.period || "Day"} className="w-full p-4 rounded-xl theme-bg-input border theme-border font-bold theme-text-main outline-none appearance-none">
              {Object.entries(PERIOD_LABELS).map(([val, label]) => ( <option key={val} value={val} className="theme-bg-card">{label}</option> ))}
            </select>
          </div>
        </div>

        {freq === Frequency.WEEKLY && (
          <div className="space-y-2 animate-in slide-in-from-top-2">
            <label className="text-[10px] font-black uppercase theme-text-muted tracking-widest">Dias da Semana</label>
            <div className="flex justify-between gap-1">
              {WEEK_DAYS.map((d, idx) => (
                <button 
                  key={idx} 
                  type="button" 
                  onClick={() => toggleDay(idx)}
                  className={`flex-1 py-3 rounded-xl text-xs font-black transition-all border ${selectedDays.includes(idx) ? 'bg-purple-600 border-purple-500 shadow-glow-blue text-white' : 'theme-bg-input theme-border theme-text-muted'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
           <label className="text-[10px] font-black uppercase theme-text-muted tracking-widest">Energia Necessária</label>
           <select name="energy" defaultValue={editingTask?.energy || "Média"} className="w-full p-4 rounded-xl theme-bg-input border theme-border font-bold theme-text-main outline-none appearance-none">
              <option value="Baixa" className="theme-bg-card">Baixa</option>
              <option value="Média" className="theme-bg-card">Média</option>
              <option value="Alta" className="theme-bg-card">Alta</option>
           </select>
        </div>

        <button type="submit" className="w-full py-5 bg-purple-600 rounded-2xl font-black shadow-glow-blue hover:scale-105 active:scale-95 transition-all uppercase text-white tracking-widest">
          {editingTaskId ? 'Salvar Alterações' : 'Sintetizar Ciclo'}
        </button>
        <button type="button" onClick={() => { setShowForm(false); setEditingTaskId(null); }} className="w-full text-[10px] uppercase font-black theme-text-muted hover:text-purple-400 transition-colors tracking-widest">Cancelar</button>
      </form>
    </div>
  );
};

const NavBtn: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all ${active ? 'bg-orange-600 text-white shadow-lg scale-105 shadow-glow-orange' : 'theme-text-muted hover:bg-black/5 hover:theme-bg-input'}`}>{icon} {label}</button>
);

const MobIcon: React.FC<{ icon: React.ReactNode, active: boolean, onClick: () => void }> = ({ icon, active, onClick }) => (
  <button onClick={onClick} className={`flex-shrink-0 p-4 rounded-2xl transition-all ${active ? 'bg-orange-600 text-white scale-110 shadow-lg shadow-glow-orange' : 'theme-text-muted hover:bg-black/5'}`}>{icon}</button>
);

const SynapseLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="14" fill="currentColor" fillOpacity="0.05" /><circle cx="16" cy="16" r="6" stroke="#f97316" strokeWidth="2.5"/><circle cx="16" cy="16" r="3" fill="#f97316" className="synapse-core"/><path d="M16 16L26 6" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round"/><circle cx="26" cy="6" r="2.5" fill="#ef4444"/>
  </svg>
);

export default App;
