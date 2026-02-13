
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Timer, LayoutGrid, RefreshCw, ListTodo, Zap, AlertTriangle, 
  Plus, X, Trophy, Play, Pause, RotateCcw, 
  BrainCircuit, Anchor, Target, Flame, Sparkles, 
  Repeat, Award, TrendingUp, Sun, Moon, CheckCircle2,
  CalendarDays, Trash2, Star, CheckCircle, Info, Move, MousePointer2,
  ChevronRight, Brain, Lightbulb, ZapOff, BarChart3,
  Coffee, Utensils, Waves, Users, Wind, Battery, BatteryLow, BatteryMedium, BatteryFull,
  Check, ArrowLeft, ArrowRight, GripVertical, Wand2, Calendar, HelpCircle, Volume2, VolumeX, Loader2,
  Clock, CalendarRange, Binary, ShieldCheck, Palette, BookOpen, UtensilsCrossed, GraduationCap, Microscope
} from 'lucide-react';
import { Priority, Task, Habit, IdentityBoost, PanicSolution, RecurringTask, Frequency, User, BrainCapacity, DopamenuItem } from './types';
import { geminiService } from './services/geminiService';

const SOUNDS = {
  TASK_COMPLETE: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  HABIT_COMPLETE: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  TIMER_START: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  TIMER_END: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
  XP_GAIN: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
  LEVEL_UP: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'
};

const LEVELS = [
  { level: 1, minPoints: 0, title: "Neurônio Inicial", unlock: "Nenhum" },
  { level: 2, minPoints: 1000, title: "Faísca Sináptica", unlock: "Tema: Oceano Profundo", themeId: 'theme-ocean' },
  { level: 3, minPoints: 3000, title: "Rede Conectada", unlock: "Tema: Floresta Córtex", themeId: 'theme-forest' },
  { level: 4, minPoints: 6000, title: "Mestre Executivo", unlock: "Tema: Pulso Cibernético", themeId: 'theme-cyber' },
  { level: 5, minPoints: 10000, title: "Arquiteto Cerebral", unlock: "Estatísticas Avançadas", themeId: 'theme-gold' },
];

const INITIAL_DOPAMENU: DopamenuItem[] = [
  { id: '1', category: 'Starter', label: 'Caminhada de 5 min', description: 'Ativação motora rápida para sair da inércia.' },
  { id: '2', category: 'Starter', label: 'Beber água gelada', description: 'Choque sensorial leve para o sistema nervoso.' },
  { id: '3', category: 'Main', label: 'Ler 15 min', description: 'Dopamina de baixo esforço e alto valor.' },
  { id: '4', category: 'Main', label: 'Meditação breve', description: 'Reset sináptico.' },
  { id: '5', category: 'Side', label: 'Playlist de Foco', description: 'Estímulo auditivo paralelo.' },
  { id: '6', category: 'Dessert', label: 'Assistir 1 Episódio', description: 'Recompensa final após grandes blocos.' },
];

interface DailyMission {
  id: number;
  text: string;
  minutes: number;
  completed: boolean;
}

const TUTORIAL_STEPS = [
  {
    title: "Neuroprodutividade",
    theory: "O Córtex Pré-Frontal (CPF) é o CEO do cérebro, mas gasta energia excessiva em decisões triviais. Este app funciona como uma 'Prótese Cognitiva' para poupar seu CPF.",
    description: "Bem-vindo ao NeuroExecutor. Vamos configurar sua segunda mente para que você pare de lutar contra sua própria biologia.",
    icon: <BrainCircuit className="w-16 h-16 text-orange-500" />,
    tab: null
  },
  {
    title: "Capacidade Neural",
    theory: "Tentar fazer tarefas complexas em estado de fadiga gera cortisol (estresse). A neuroplasticidade ocorre melhor quando respeitamos nossos níveis de ativação (Arousal).",
    description: "No painel lateral, selecione como você está agora. O sistema destacará apenas o que seu cérebro consegue processar no momento.",
    icon: <BatteryMedium className="w-16 h-16 text-orange-400" />,
    tab: 'execute'
  },
  {
    title: "Efeito Zeigarnik",
    theory: "Tarefas incompletas 'rodam' em segundo plano, gerando ansiedade. O 'Brain Dump' libera a memória de trabalho do CPF.",
    description: "Use a aba 'Captura' para descarregar o caos. Depois, na 'Matriz', arraste as tarefas para categorizar o que é realmente vital.",
    icon: <ListTodo className="w-16 h-16 text-blue-500" />,
    tab: 'capture'
  },
  {
    title: "A Regra de 3",
    theory: "Grandes listas paralisam. O cérebro processa informações em blocos (chunking). 3 missões diárias é o 'ponto doce' para o foco sustentado.",
    description: "Na aba 'Focar', defina suas 3 missões. Use o Timebox clicando nos minutos para criar uma 'pressão positiva' e entrar em estado de flow.",
    icon: <Target className="w-16 h-16 text-red-500" />,
    tab: 'execute'
  },
  {
    title: "Ciclo Ultradiano",
    theory: "O foco não é linear. Trabalhamos em picos de ~90min. O timer ajuda você a respeitar o limite sináptico e pausar antes do burnout.",
    description: "Ao iniciar uma missão, ative o timer. Quando acabar, é obrigatório buscar uma recompensa no seu Dopamenu.",
    icon: <Timer className="w-16 h-16 text-orange-600" />,
    tab: 'execute'
  },
  {
    title: "Gânglios Basais",
    theory: "Hábitos são automatizados nos gânglios basais, consumindo quase zero energia do CPF. Usar 'Âncoras' facilita essa transição neural.",
    description: "Em 'Hábitos', use a técnica: 'Depois de [Âncora], eu vou [Ação]'. Isso cria um gatilho biológico instantâneo.",
    icon: <RefreshCw className="w-16 h-16 text-purple-500" />,
    tab: 'habits'
  }
];

const SynapseLogo = ({ className = "" }: { className?: string }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`}>
    <defs>
      <linearGradient id="logo-grad-fire" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="var(--accent-primary, #f97316)" />
        <stop offset="100%" stopColor="var(--accent-secondary, #ef4444)" />
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="14" fill="currentColor" fillOpacity="0.05" />
    <circle cx="16" cy="16" r="6" stroke="url(#logo-grad-fire)" strokeWidth="2" className="synapse-core" />
    <circle cx="16" cy="16" r="3" fill="url(#logo-grad-fire)" className="synapse-core" />
    <path d="M16 16L26 6" stroke="url(#logo-grad-fire)" strokeWidth="2.5" strokeLinecap="round" className="opacity-80" />
    <circle cx="26" cy="6" r="2" fill="var(--accent-secondary, #ef4444)" />
  </svg>
);

const SparkleParticles: React.FC = () => {
  const particles = Array.from({ length: 24 });
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible z-50">
      {particles.map((_, i) => {
        const angle = (i / particles.length) * Math.PI * 2 + (Math.random() * 0.5);
        const velocity = 80 + Math.random() * 100;
        const dx = Math.cos(angle) * velocity;
        const dy = Math.sin(angle) * velocity;
        const size = 3 + Math.random() * 6;
        return (
          <div
            key={i}
            className="absolute rounded-full animate-particle shadow-lg"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: i % 2 === 0 ? '#f97316' : '#facc15',
              '--dx': `${dx}px`,
              '--dy': `${dy}px`,
              animationDelay: `${Math.random() * 0.15}s`,
              transform: `rotate(${Math.random() * 360}deg)`
            } as any}
          />
        );
      })}
    </div>
  );
};

const App: React.FC = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const playAudio = useCallback((soundUrl: string) => {
    if (!soundEnabled) return;
    const audio = new Audio(soundUrl);
    audio.volume = 0.4;
    audio.play().catch(e => console.debug("Audio play blocked"));
  }, [soundEnabled]);

  // States
  const [activeTab, setActiveTab] = useState<'execute' | 'plan' | 'habits' | 'capture' | 'fixed' | 'upgrades' | 'dopamenu' | 'dashboard'>('execute');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [points, setPoints] = useState(0);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [visualTheme, setVisualTheme] = useState(() => localStorage.getItem('neuro-visual-theme') || 'theme-default');
  const [dopamenuItems, setDopamenuItems] = useState<DopamenuItem[]>(INITIAL_DOPAMENU);
  const [sparkleTaskId, setSparkleTaskId] = useState<string | null>(null);
  
  // Feedback states for animations
  const [justCompletedMissionId, setJustCompletedMissionId] = useState<number | null>(null);
  const [justCompletedTaskId, setJustCompletedTaskId] = useState<string | null>(null);

  // Daily Missions State
  const [dailyMissions, setDailyMissions] = useState<DailyMission[]>([
    { id: 1, text: '', minutes: 30, completed: false },
    { id: 2, text: '', minutes: 30, completed: false },
    { id: 3, text: '', minutes: 30, completed: false }
  ]);

  // Tutorial State
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);

  // Neural Levels Calculation
  const neuralProfile = useMemo(() => {
    const current = [...LEVELS].reverse().find(l => points >= l.minPoints) || LEVELS[0];
    const next = LEVELS.find(l => points < l.minPoints);
    const progress = next 
      ? ((points - current.minPoints) / (next.minPoints - current.minPoints)) * 100 
      : 100;
    return { ...current, nextLevel: next, progress };
  }, [points]);

  // Persistence Logic
  useEffect(() => {
    const localData = localStorage.getItem('neuro_executor_data_v4');
    if (localData) {
      const parsed = JSON.parse(localData);
      setTasks(parsed.tasks || []);
      setRecurringTasks(parsed.recurringTasks || []);
      setHabits(parsed.habits || []);
      setPoints(parsed.points || 0);
      setDopamenuItems(parsed.dopamenuItems || INITIAL_DOPAMENU);
      if (parsed.dailyMissions) setDailyMissions(parsed.dailyMissions);
    }
    setIsDataLoaded(true);
    if (!localStorage.getItem('neuro-tutorial-v4-seen')) {
      setTutorialStep(0);
    }
  }, []);

  useEffect(() => {
    if (!isDataLoaded) return;
    const dataToSave = { tasks, recurringTasks, habits, points, dopamenuItems, dailyMissions };
    localStorage.setItem('neuro_executor_data_v4', JSON.stringify(dataToSave));
  }, [tasks, recurringTasks, habits, points, dopamenuItems, dailyMissions, isDataLoaded]);

  // UI Flow States
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [currentArousal, setCurrentArousal] = useState<BrainCapacity>('Neutro');

  // Forms UI
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [habitForm, setHabitForm] = useState({ text: '', anchor: '', tinyAction: '' });
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [recurringForm, setRecurringForm] = useState({ text: '', frequency: Frequency.DAILY, energy: 'Baixa' as Task['energy'] });
  const [showDopamenuForm, setShowDopamenuForm] = useState(false);
  const [dopamenuForm, setDopamenuForm] = useState<Omit<DopamenuItem, 'id'>>({ category: 'Starter', label: '', description: '' });

  // Timer countdown
  useEffect(() => {
    let interval: any;
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
      playAudio(SOUNDS.TIMER_END);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft, playAudio]);

  // Handlers
  const addTask = (text: string, p: Priority = Priority.Q2) => {
    if (!text.trim()) return;
    const t: Task = {
      id: crypto.randomUUID(),
      text, priority: p, energy: 'Média', capacityNeeded: currentArousal,
      completed: false, subtasks: [], date: selectedDate, createdAt: Date.now()
    };
    setTasks(prev => [t, ...prev]);
  };

  const addHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitForm.text) return;
    const h: Habit = { id: crypto.randomUUID(), ...habitForm, streak: 0, lastCompleted: null, completedDates: [] };
    setHabits(prev => [h, ...prev]);
    setHabitForm({ text: '', anchor: '', tinyAction: '' });
    setShowHabitForm(false);
  };

  const updateHabit = (id: string, updates: Partial<Habit>) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  };

  const addRecurringTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recurringForm.text) return;
    const rt: RecurringTask = { id: crypto.randomUUID(), ...recurringForm, priority: Priority.Q2, completedDates: [] };
    setRecurringTasks(prev => [rt, ...prev]);
    setRecurringForm({ text: '', frequency: Frequency.DAILY, energy: 'Baixa' });
    setShowRecurringForm(false);
  };

  const addDopamenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dopamenuForm.label) return;
    const item: DopamenuItem = { id: crypto.randomUUID(), ...dopamenuForm };
    setDopamenuItems(prev => [...prev, item]);
    setDopamenuForm({ category: 'Starter', label: '', description: '' });
    setShowDopamenuForm(false);
  };

  const removeDopamenuItem = (id: string) => {
    setDopamenuItems(prev => prev.filter(item => item.id !== id));
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        if (!t.completed) {
          setPoints(p => p + 25);
          playAudio(SOUNDS.TASK_COMPLETE);
          setJustCompletedTaskId(id);
          setTimeout(() => setJustCompletedTaskId(null), 1000);
        }
        return { ...t, completed: !t.completed };
      }
      return t;
    }));
  };

  const updateTaskEnergy = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextEnergy: Task['energy'] = t.energy === 'Baixa' ? 'Média' : t.energy === 'Média' ? 'Alta' : 'Baixa';
        return { ...t, energy: nextEnergy };
      }
      return t;
    }));
  };

  const updateRecurringTaskEnergy = (id: string) => {
    setRecurringTasks(prev => prev.map(rt => {
      if (rt.id === id) {
        const nextEnergy: Task['energy'] = rt.energy === 'Baixa' ? 'Média' : rt.energy === 'Média' ? 'Alta' : 'Baixa';
        return { ...rt, energy: nextEnergy };
      }
      return rt;
    }));
  };

  const toggleRecurringTask = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    let justCompleted = false;
    setRecurringTasks(prev => prev.map(rt => {
      if (rt.id === id) {
        const isDoneToday = rt.completedDates.includes(today);
        if (!isDoneToday) {
          setPoints(p => p + 15);
          playAudio(SOUNDS.TASK_COMPLETE);
          justCompleted = true;
          return { ...rt, completedDates: [...rt.completedDates, today] };
        } else {
          return { ...rt, completedDates: rt.completedDates.filter(d => d !== today) };
        }
      }
      return rt;
    }));
    if (justCompleted) {
      setSparkleTaskId(id);
      setTimeout(() => setSparkleTaskId(null), 1000);
    }
  };

  const completeHabit = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    setHabits(prev => prev.map(h => {
      if (h.id === id && h.lastCompleted !== today) {
        setPoints(p => p + 50);
        playAudio(SOUNDS.HABIT_COMPLETE);
        return { 
          ...h, 
          streak: h.streak + 1, 
          lastCompleted: today, 
          completedDates: [...(h.completedDates || []), today] 
        };
      }
      return h;
    }));
  };

  const updateDailyMission = (id: number, updates: Partial<DailyMission>) => {
    setDailyMissions(prev => prev.map(m => {
      if (m.id === id) {
        if (updates.completed && !m.completed) {
          setPoints(p => p + 100);
          playAudio(SOUNDS.TASK_COMPLETE);
          setJustCompletedMissionId(id);
          setTimeout(() => setJustCompletedMissionId(null), 1000);
        }
        return { ...m, ...updates };
      }
      return m;
    }));
  };

  const handleTaskDrop = (taskId: string, newPriority: Priority) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, priority: newPriority } : t));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleDecompose = async (task: Task) => {
    if (isDecomposing) return;
    setIsDecomposing(true);
    try {
      const steps = await geminiService.decomposeTask(task.text);
      if (steps && steps.length > 0) {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, subtasks: steps } : t));
        setSelectedTask(prev => prev?.id === task.id ? { ...prev, subtasks: steps } : prev);
      }
    } catch (error) { console.error(error); } finally { setIsDecomposing(false); }
  };

  const handleAutoCategorize = async () => {
    if (isOptimizing || tasks.length === 0) return;
    setIsOptimizing(true);
    try {
      const updates = await geminiService.categorizeTasks(tasks.filter(t => !t.completed));
      if (updates && updates.length > 0) {
        setTasks(prev => prev.map(t => {
          const update = updates.find(u => u.id === t.id);
          return update ? { ...t, priority: update.priority, energy: update.energy } : t;
        }));
      }
    } catch (error) { console.error(error); } finally { setIsOptimizing(false); }
  };

  const handleThemeChange = (themeId: string) => {
    setVisualTheme(themeId);
    localStorage.setItem('neuro-visual-theme', themeId);
  };

  const nextTutorialStep = () => {
    if (tutorialStep === null) return;
    const nextStep = tutorialStep + 1;
    if (nextStep < TUTORIAL_STEPS.length) {
      const stepData = TUTORIAL_STEPS[nextStep];
      if (stepData.tab) setActiveTab(stepData.tab as any);
      setTutorialStep(nextStep);
    } else {
      setTutorialStep(null);
      localStorage.setItem('neuro-tutorial-v4-seen', 'true');
    }
  };

  const skipTutorial = () => {
    setTutorialStep(null);
    localStorage.setItem('neuro-tutorial-v4-seen', 'true');
  };

  // Metrics Logic
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });
  }, []);

  const dayTasks = useMemo(() => tasks.filter(t => t.date === selectedDate), [tasks, selectedDate]);
  const executableList = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const normalTasks = dayTasks.filter(t => !t.completed);
    const relevantRecurring = recurringTasks.filter(rt => !rt.completedDates.includes(today));
    const combined = [
      ...normalTasks,
      ...relevantRecurring.map(rt => ({ ...rt, completed: false, subtasks: [], date: today, createdAt: 0, capacityNeeded: 'Neutro' as BrainCapacity, isRecurring: true }))
    ];
    return combined.filter(t => {
      if (currentArousal === 'Exausto') return t.energy === 'Baixa';
      if (currentArousal === 'Neutro') return t.energy === 'Baixa' || t.energy === 'Média';
      return true;
    });
  }, [dayTasks, recurringTasks, currentArousal]);

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-all duration-700 bg-[#020617] text-white ${visualTheme}`}>
      {/* Sidebar */}
      <nav className={`fixed bottom-0 w-full backdrop-blur-xl border-t md:static md:w-72 md:h-screen md:border-r z-50 flex md:flex-col bg-[#0a1128]/95 border-slate-800`}>
        <div className="hidden md:flex flex-col p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><SynapseLogo /><h1 className="text-xl font-black italic text-orange-600 uppercase">Neuro</h1></div>
            <button onClick={() => setSoundEnabled(!soundEnabled)} title="Alternar Som" className="p-2 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white transition-colors">
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Nível Neural {neuralProfile.level}</p>
              <p className="text-[8px] font-black text-orange-500">{points} XP</p>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-orange-600 transition-all duration-1000" style={{ width: `${neuralProfile.progress}%` }}></div>
            </div>
            <p className="text-[8px] font-bold text-slate-600 uppercase text-right">{neuralProfile.title}</p>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Capacidade Atual</p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentArousal('Exausto')} className={`flex-1 p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${currentArousal === 'Exausto' ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-glow-blue animate-pulse-orange' : 'border-slate-800 opacity-40'}`}>
                <BatteryLow size={16}/><span className="text-[8px] font-black uppercase">Exausto</span>
              </button>
              <button onClick={() => setCurrentArousal('Neutro')} className={`flex-1 p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${currentArousal === 'Neutro' ? 'bg-orange-600/20 border-orange-500 text-orange-400 shadow-glow-orange animate-pulse-orange' : 'border-slate-800 opacity-40'}`}>
                <BatteryMedium size={16}/><span className="text-[8px] font-black uppercase">Neutro</span>
              </button>
              <button onClick={() => setCurrentArousal('Hiperfocado')} className={`flex-1 p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${currentArousal === 'Hiperfocado' ? 'bg-purple-600/20 border-purple-500 text-purple-400 shadow-glow-purple animate-pulse-orange' : 'border-slate-800 opacity-40'}`}>
                <BatteryFull size={16}/><span className="text-[8px] font-black uppercase">Pico</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 justify-around p-2 md:flex-col md:gap-2 md:px-4 md:justify-start">
          <NavButton icon={<Timer />} label="Focar" active={activeTab === 'execute'} onClick={() => setActiveTab('execute')} />
          <NavButton icon={<TrendingUp />} label="Evolução" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavButton icon={<ListTodo />} label="Captura" active={activeTab === 'capture'} onClick={() => setActiveTab('capture')} />
          <NavButton icon={<UtensilsCrossed />} label="Dopamenu" active={activeTab === 'dopamenu'} onClick={() => setActiveTab('dopamenu')} />
          <NavButton icon={<LayoutGrid />} label="Matriz" active={activeTab === 'plan'} onClick={() => setActiveTab('plan')} />
          <NavButton icon={<CalendarRange />} label="Rotinas" active={activeTab === 'fixed'} onClick={() => setActiveTab('fixed')} />
          <NavButton icon={<RefreshCw />} label="Hábitos" active={activeTab === 'habits'} onClick={() => setActiveTab('habits')} />
          <NavButton icon={<Binary />} label="Upgrades" active={activeTab === 'upgrades'} onClick={() => setActiveTab('upgrades')} />
        </div>

        <div className="hidden md:flex flex-col gap-2 p-4 mt-auto border-t border-slate-800/50">
          <button onClick={() => setTutorialStep(0)} className="flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-xs text-slate-500 hover:bg-slate-800/30 transition-colors"> <BookOpen size={18}/> Tutorial </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-8 p-4 md:p-10">
        <div className="max-w-5xl mx-auto space-y-10">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-10 animate-in fade-in duration-700">
               <div className="flex flex-col gap-2 px-4">
                  <h2 className="text-4xl font-black italic uppercase tracking-tighter text-orange-600">Dashboard Neural</h2>
                  <p className="text-xs text-slate-500 font-medium">Visualização da sua arquitetura de produtividade nos últimos 7 dias.</p>
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-3 p-8 border rounded-[48px] bg-slate-900/60 border-slate-800 space-y-8">
                     <div className="flex justify-between items-center">
                        <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Fluxo de Consistência Semanal</h3>
                     </div>
                     <div className="grid grid-cols-7 gap-4">
                        {last7Days.map((day) => {
                           const dayName = new Date(day + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
                           const habitCount = habits.filter(h => h.completedDates?.includes(day)).length;
                           const routineCount = recurringTasks.filter(rt => rt.completedDates?.includes(day)).length;
                           const isToday = day === selectedDate;
                           return (
                              <div key={day} className={`flex flex-col items-center gap-4 p-4 rounded-3xl transition-all ${isToday ? 'bg-orange-600/5 ring-1 ring-orange-500/20' : ''}`}>
                                 <span className={`text-[10px] font-black uppercase ${isToday ? 'text-orange-500' : 'text-slate-600'}`}>{dayName}</span>
                                 <div className="flex flex-col gap-2 flex-1 justify-end min-h-[120px]">
                                    <div className="w-4 bg-orange-600 rounded-full" style={{ height: `${Math.max(4, habitCount * 20)}px` }}></div>
                                    <div className="w-4 bg-purple-600 rounded-full" style={{ height: `${Math.max(4, routineCount * 20)}px` }}></div>
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  </div>
                  <div className="p-8 border rounded-[40px] bg-orange-600/5 border-orange-500/10 flex flex-col items-center justify-center text-center gap-4">
                     <Trophy className="text-orange-500" size={40}/>
                     <div><p className="text-4xl font-black italic text-orange-600">{points}</p></div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'execute' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-700">
              <div className="lg:col-span-2 space-y-8">
                {/* Timer */}
                <div className="p-12 text-center border rounded-[48px] bg-slate-900/60 border-slate-800 relative overflow-hidden shadow-2xl group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                    <div className="h-full bg-orange-600 transition-all duration-1000" style={{ width: `${(timeLeft / (90 * 60)) * 100}%` }}></div>
                  </div>
                  <h2 className="text-[100px] leading-none font-mono font-black tabular-nums mb-8">{formatTime(timeLeft)}</h2>
                  <div className="flex justify-center gap-6">
                    <button onClick={() => setIsTimerActive(!isTimerActive)} className="w-20 h-20 bg-orange-600 rounded-[32px] flex items-center justify-center shadow-glow-orange active:scale-95 transition-all">{isTimerActive ? <Pause size={32}/> : <Play size={32} fill="currentColor"/>}</button>
                    <button onClick={() => setTimeLeft(90*60)} className="w-20 h-20 bg-slate-800/80 rounded-[32px] flex items-center justify-center hover:text-white transition-colors"><RotateCcw size={32}/></button>
                  </div>
                </div>

                {/* Protocolo de 3 Missões Card */}
                <div className="p-10 border rounded-[48px] bg-slate-900/60 border-slate-800 shadow-xl space-y-6">
                  <h3 className="text-[11px] font-black uppercase text-orange-500 tracking-[0.3em] flex items-center gap-2">
                    <Target size={14} /> Protocolo: 3 Missões Diárias
                  </h3>
                  <div className="space-y-4">
                    {dailyMissions.map((mission) => {
                      const isJustCompleted = justCompletedMissionId === mission.id;
                      return (
                        <div key={mission.id} className={`p-6 rounded-[32px] border transition-all duration-500 flex items-center gap-6 relative overflow-hidden ${mission.completed ? 'bg-green-600/5 border-green-500/20 opacity-60' : 'bg-slate-800/30 border-slate-700/30'} ${isJustCompleted ? 'animate-glow-success border-green-500' : ''}`}>
                          <button 
                            onClick={() => updateDailyMission(mission.id, { completed: !mission.completed })} 
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${mission.completed ? 'bg-green-600 text-white' : 'bg-slate-900 border border-slate-700'} ${isJustCompleted ? 'animate-bounce' : ''}`}
                          >
                            <Check size={20} strokeWidth={3} className={mission.completed ? "animate-in zoom-in duration-300" : "text-transparent"} />
                          </button>
                          <input type="text" placeholder={`Missão #${mission.id}...`} className={`flex-1 bg-transparent border-none outline-none font-bold text-lg transition-all ${mission.completed ? 'line-through text-slate-500' : 'text-white'}`} value={mission.text} onChange={(e) => updateDailyMission(mission.id, { text: e.target.value })} />
                          <div className="flex gap-1">
                            {[15, 30, 45, 60].map(m => (
                              <button key={m} onClick={() => { setTimeLeft(m * 60); updateDailyMission(mission.id, { minutes: m }); }} className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${mission.minutes === m ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}>{m}m</button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Task Details Area */}
                <div className={`p-10 border rounded-[48px] bg-slate-900/60 border-slate-800 min-h-[250px] shadow-xl transition-all duration-700 ${justCompletedTaskId === selectedTask?.id ? 'animate-glow-success border-green-500' : ''}`}>
                  {selectedTask ? (
                    <div className="space-y-8 animate-in slide-in-from-bottom duration-300">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                           <h2 className={`text-4xl font-black transition-all ${selectedTask.completed ? 'line-through opacity-20' : ''}`}>{selectedTask.text}</h2>
                           <div className="flex gap-2 items-center">
                              <EnergyBadge energy={selectedTask.energy} onClick={() => updateTaskEnergy(selectedTask.id)} highlighted />
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{selectedTask.priority}</span>
                           </div>
                        </div>
                        <button onClick={() => setSelectedTask(null)} className="p-2 text-slate-600 hover:text-white transition-colors"><X/></button>
                      </div>
                      <div className="space-y-4">
                        {selectedTask.subtasks.map((s, i) => (
                          <div key={i} className="p-5 bg-slate-800/30 rounded-3xl flex items-center gap-5 border border-slate-700/30 transition-all hover:border-slate-600">
                            <span className="text-orange-500 font-black">{i+1}</span><p className="text-slate-300 font-medium">{s}</p>
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={() => toggleTask(selectedTask.id)} 
                        className={`w-full py-6 rounded-3xl font-black uppercase transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 ${selectedTask.completed ? 'bg-green-600/10 text-green-500 border border-green-600/30' : 'bg-orange-600 text-white shadow-glow-orange hover:bg-orange-500'}`}
                      >
                        {selectedTask.completed ? (
                          <><RefreshCw size={20}/> Reativar Fluxo</>
                        ) : (
                          <><Check size={20} strokeWidth={3}/> Concluir Missão (+XP)</>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="py-12 text-center opacity-10 flex flex-col items-center gap-6 animate-pulse"><Target size={60}/><p className="font-black uppercase text-[10px] tracking-widest">Selecione uma meta para focar</p></div>
                  )}
                </div>
              </div>

              {/* Fila Lateral */}
              <div className="space-y-6">
                <div className="p-8 border rounded-[40px] bg-slate-900/60 border-slate-800 shadow-lg">
                  <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-6">Fila de Execução</h3>
                  <div className="space-y-3">
                    {executableList.map(t => (
                      <button key={t.id} onClick={() => setSelectedTask(t as any)} className={`w-full p-5 text-left border rounded-[24px] transition-all group ${selectedTask?.id === t.id ? 'border-orange-500 bg-orange-500/5' : 'border-slate-800 bg-slate-800/20 hover:bg-slate-800/30 hover:border-slate-700'}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold truncate block transition-transform group-hover:translate-x-1">{t.text}</span>
                          <ChevronRight size={14} className={`transition-opacity ${selectedTask?.id === t.id ? 'opacity-100' : 'opacity-0'}`} />
                        </div>
                      </button>
                    ))}
                    {executableList.length === 0 && <p className="text-center py-10 text-[10px] text-slate-600 font-black uppercase opacity-40">Nenhuma tarefa pendente</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'capture' && (
            <div className="max-w-3xl mx-auto py-24 space-y-16 text-center animate-in zoom-in duration-500">
              <div className="space-y-4">
                <h2 className="text-6xl font-black italic uppercase leading-tight">Descarregar<br/>Mente</h2>
              </div>
              <div className="p-10 bg-slate-900 border border-slate-800 rounded-[64px] flex items-center gap-6 focus-within:ring-2 focus-within:ring-orange-600 transition-all shadow-2xl">
                <input autoFocus className="flex-1 bg-transparent border-none text-3xl font-black outline-none placeholder:text-slate-800" placeholder="O que está na cabeça?" value={newTaskText} onChange={e => setNewTaskText(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { addTask(newTaskText); setNewTaskText(""); setActiveTab('plan'); }}} />
                <button onClick={() => { addTask(newTaskText); setNewTaskText(""); setActiveTab('plan'); }} className="w-24 h-24 bg-orange-600 rounded-[40px] flex items-center justify-center shadow-glow-orange active:scale-95 transition-all"><Plus size={48}/></button>
              </div>
            </div>
          )}

          {activeTab === 'plan' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <MatrixQuadrant priority={Priority.Q1} title="Q1: Crítico e Urgente" color="bg-red-600/5 border-red-500/20" tasks={dayTasks.filter(t => t.priority === Priority.Q1 && !t.completed)} onSelect={(t) => { setSelectedTask(t); setActiveTab('execute'); }} onDrop={handleTaskDrop} onUpdateEnergy={updateTaskEnergy} currentArousal={currentArousal} />
                <MatrixQuadrant priority={Priority.Q2} title="Q2: Importante/Estratégico" color="bg-orange-600/5 border-orange-500/20" tasks={dayTasks.filter(t => t.priority === Priority.Q2 && !t.completed)} onSelect={(t) => { setSelectedTask(t); setActiveTab('execute'); }} onDrop={handleTaskDrop} onUpdateEnergy={updateTaskEnergy} currentArousal={currentArousal} />
                <MatrixQuadrant priority={Priority.Q3} title="Q3: Interrupções/Delegar" color="bg-blue-600/5 border-blue-500/20" tasks={dayTasks.filter(t => t.priority === Priority.Q3 && !t.completed)} onSelect={(t) => { setSelectedTask(t); setActiveTab('execute'); }} onDrop={handleTaskDrop} onUpdateEnergy={updateTaskEnergy} currentArousal={currentArousal} />
                <MatrixQuadrant priority={Priority.Q4} title="Q4: Eliminar Distrações" color="bg-slate-800/20 border-slate-700/50" tasks={dayTasks.filter(t => t.priority === Priority.Q4 && !t.completed)} onSelect={(t) => { setSelectedTask(t); setActiveTab('execute'); }} onDrop={handleTaskDrop} onUpdateEnergy={updateTaskEnergy} currentArousal={currentArousal} />
              </div>
            </div>
          )}

          {activeTab === 'fixed' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-between items-center px-4">
                <h2 className="text-4xl font-black italic uppercase text-purple-400">Rotinas Fixas</h2>
                <button onClick={() => setShowRecurringForm(true)} className="w-16 h-16 bg-purple-600 rounded-3xl flex items-center justify-center text-white shadow-glow-blue hover:scale-105 active:scale-95 transition-all"><Plus size={32}/></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {recurringTasks.map(rt => {
                  const isDoneToday = rt.completedDates.includes(selectedDate);
                  return (
                    <div key={rt.id} className={`p-8 bg-slate-900/60 border rounded-[40px] h-[300px] flex flex-col justify-between group transition-all relative overflow-visible ${isDoneToday ? 'border-green-500/30 bg-green-500/5' : 'border-slate-800 hover:border-purple-500/40 shadow-xl'}`}>
                      {sparkleTaskId === rt.id && <SparkleParticles />}
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className={`p-4 rounded-2xl transition-colors ${isDoneToday ? 'bg-green-600/10 text-green-400' : 'bg-purple-600/10 text-purple-400'}`}><Repeat size={24}/></div>
                          <EnergyBadge energy={rt.energy} onClick={() => updateRecurringTaskEnergy(rt.id)} highlighted />
                        </div>
                        <h3 className={`text-xl font-black uppercase transition-all ${isDoneToday ? 'opacity-40 line-through' : ''}`}>{rt.text}</h3>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => toggleRecurringTask(rt.id)} className={`flex-1 py-3 px-4 rounded-2xl text-[10px] font-black uppercase transition-all ${isDoneToday ? 'bg-green-600/20 text-green-500 border border-green-600/30' : 'bg-purple-600 text-white hover:bg-purple-500 shadow-glow-blue'}`}>
                          {isDoneToday ? 'Reativar' : 'Concluir'}
                        </button>
                        <button onClick={() => setRecurringTasks(prev => prev.filter(p => p.id !== rt.id))} className="p-3 bg-red-600/5 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'habits' && (
            <div className="space-y-12 animate-in slide-in-from-bottom duration-700">
              <div className="flex justify-between items-center px-4">
                <h2 className="text-4xl font-black italic uppercase text-orange-600">Hábitos</h2>
                <button onClick={() => setShowHabitForm(true)} className="w-16 h-16 bg-orange-600 rounded-3xl flex items-center justify-center text-white shadow-glow-orange hover:scale-105 active:scale-95 transition-all"><Plus size={32}/></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {habits.map(h => {
                  const isDoneToday = h.lastCompleted === selectedDate;
                  return (
                    <div key={h.id} className={`p-8 rounded-[40px] border transition-all min-h-[380px] flex flex-col justify-between ${isDoneToday ? 'bg-green-600/5 border-green-500/30 shadow-inner opacity-70' : 'bg-slate-900/60 border-slate-800 shadow-xl'}`}>
                      <div className="space-y-6">
                        <div className="flex justify-between items-start">
                          <Flame className={h.streak > 0 ? "text-orange-500 animate-pulse" : "text-slate-800"} size={28} />
                          <div className="text-right flex items-baseline gap-1">
                            <span className="text-4xl font-black italic leading-none">{h.streak}</span>
                            <p className="text-[10px] uppercase font-black text-slate-500 tracking-tighter">Dias</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-600 tracking-widest pl-1">O Hábito</label>
                            <input 
                              className="w-full bg-transparent border-none text-xl font-black uppercase outline-none focus:text-orange-500 transition-colors"
                              value={h.text}
                              onChange={(e) => updateHabit(h.id, { text: e.target.value })}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-600 tracking-widest pl-1">Âncora (Depois de...)</label>
                            <input 
                              className="w-full bg-slate-800/40 p-2 rounded-xl border border-transparent focus:border-orange-500/30 text-xs font-bold text-slate-400 outline-none transition-all"
                              value={h.anchor}
                              onChange={(e) => updateHabit(h.id, { anchor: e.target.value })}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-600 tracking-widest pl-1">Ação (Eu vou...)</label>
                            <input 
                              className="w-full bg-slate-800/40 p-2 rounded-xl border border-transparent focus:border-orange-500/30 text-xs font-bold text-slate-200 outline-none transition-all"
                              value={h.tinyAction}
                              onChange={(e) => updateHabit(h.id, { tinyAction: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-6">
                        <button onClick={() => completeHabit(h.id)} disabled={isDoneToday} className={`flex-1 py-4 rounded-2xl font-black text-xs transition-all ${isDoneToday ? 'bg-green-600/20 text-green-500 border border-green-600/20' : 'bg-orange-600 text-white hover:bg-orange-500 active:scale-95 shadow-glow-orange'}`}>
                          {isDoneToday ? 'Consolidado' : 'Reforçar Sinapse'}
                        </button>
                        <button onClick={() => setHabits(prev => prev.filter(p => p.id !== h.id))} className="p-4 bg-slate-800/50 text-slate-600 hover:text-red-500 rounded-2xl transition-all hover:bg-red-500/10">
                          <Trash2 size={18}/>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'upgrades' && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div className="px-4">
                 <h2 className="text-4xl font-black italic uppercase text-orange-600">Upgrades</h2>
                 <p className="text-xs text-slate-500 mt-1">Desbloqueie estilos com seu progresso neural.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {LEVELS.map(l => {
                  const isUnlocked = points >= l.minPoints;
                  return (
                    <div key={l.level} className={`p-8 rounded-[48px] border transition-all ${isUnlocked ? 'bg-[#0a1128] border-orange-500/20 shadow-2xl' : 'bg-slate-900/20 border-slate-800/50 grayscale opacity-40'}`}>
                       <h3 className="text-2xl font-black uppercase mb-2">{l.title}</h3>
                       <p className="text-xs text-slate-500 mb-6">{l.unlock}</p>
                       {isUnlocked && l.themeId && (
                         <button onClick={() => handleThemeChange(l.themeId!)} className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] transition-all ${visualTheme === l.themeId ? 'bg-orange-600 text-white shadow-glow-orange' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                           {visualTheme === l.themeId ? 'Estilo Ativo' : 'Ativar Estilo'}
                         </button>
                       )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'dopamenu' && (
            <div className="space-y-10 animate-in fade-in duration-700">
               <div className="flex justify-between items-center px-4">
                <h2 className="text-4xl font-black italic uppercase text-orange-600">Dopamenu</h2>
                <button onClick={() => setShowDopamenuForm(true)} className="w-16 h-16 bg-orange-600 rounded-3xl flex items-center justify-center text-white shadow-glow-orange hover:scale-105 active:scale-95 transition-all"><Plus size={32}/></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {['Starter', 'Main', 'Side', 'Dessert'].map((category) => (
                  <div key={category} className="p-8 bg-slate-900/40 border border-slate-800/50 rounded-[48px] space-y-6">
                    <h3 className="text-xl font-black uppercase italic text-orange-500">{category}</h3>
                    <div className="space-y-4">
                      {dopamenuItems.filter(item => item.category === category).map(item => (
                        <div key={item.id} className="p-6 bg-slate-800/20 border border-slate-700/30 rounded-3xl flex justify-between items-start transition-all hover:border-slate-600">
                          <div><h4 className="font-bold text-sm text-orange-400">{item.label}</h4><p className="text-[11px] text-slate-500">{item.description}</p></div>
                          <button onClick={() => removeDopamenuItem(item.id)} className="p-2 text-slate-600 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Tutorial Overlay e Modais seguem a mesma lógica... */}
      {tutorialStep !== null && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#0a1128] border border-orange-500/20 rounded-[56px] p-10 md:p-16 text-center space-y-10 shadow-3xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-800"><div className="h-full bg-orange-600 transition-all duration-500" style={{ width: `${((tutorialStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}></div></div>
             <div className="flex justify-center mb-4">{TUTORIAL_STEPS[tutorialStep].icon}</div>
             <div className="space-y-6">
                <div><h2 className="text-4xl font-black uppercase italic text-orange-500 tracking-tighter mb-2">{TUTORIAL_STEPS[tutorialStep].title}</h2></div>
                <div className="bg-slate-900/50 p-6 rounded-[32px] border border-slate-800 text-left"><p className="text-sm text-slate-300 italic">"{TUTORIAL_STEPS[tutorialStep].theory}"</p></div>
                <div className="space-y-3 text-left pl-4"><p className="text-base text-slate-200 font-medium leading-relaxed">{TUTORIAL_STEPS[tutorialStep].description}</p></div>
             </div>
             <div className="flex flex-col gap-4 pt-4">
                <button onClick={nextTutorialStep} className="w-full py-6 bg-orange-600 text-white rounded-[32px] font-black uppercase tracking-[0.2em] shadow-glow-orange flex items-center justify-center gap-3">
                  {tutorialStep === TUTORIAL_STEPS.length - 1 ? "Ativar Neurônios" : "Próxima Camada"}<ArrowRight size={24}/>
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Forms Modals */}
      {showHabitForm && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl">
          <form onSubmit={addHabit} className="w-full max-w-lg bg-[#0a1128] border border-slate-800 rounded-[56px] p-12 space-y-8 shadow-2xl">
            <h2 className="text-2xl font-black text-orange-600 uppercase">Novo Hábito</h2>
            <div className="space-y-4">
              <input required className="w-full py-4 px-6 rounded-2xl bg-slate-900 outline-none border border-slate-800 focus:border-orange-500 transition-colors" placeholder="Hábito" value={habitForm.text} onChange={e => setHabitForm({...habitForm, text: e.target.value})} />
              <input className="w-full py-4 px-6 rounded-2xl bg-slate-900 outline-none border border-slate-800 focus:border-orange-500 transition-colors" placeholder="Âncora" value={habitForm.anchor} onChange={e => setHabitForm({...habitForm, anchor: e.target.value})} />
              <input className="w-full py-4 px-6 rounded-2xl bg-slate-900 outline-none border border-slate-800 focus:border-orange-500 transition-colors" placeholder="Ação" value={habitForm.tinyAction} onChange={e => setHabitForm({...habitForm, tinyAction: e.target.value})} />
            </div>
            <button type="submit" className="w-full py-5 bg-orange-600 rounded-3xl font-black uppercase shadow-glow-orange hover:bg-orange-500 transition-all">Solidificar</button>
            <button type="button" onClick={() => setShowHabitForm(false)} className="w-full text-slate-500 font-bold uppercase text-xs tracking-widest hover:text-white transition-colors">Cancelar</button>
          </form>
        </div>
      )}

      {showRecurringForm && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl">
          <form onSubmit={addRecurringTask} className="w-full max-w-lg bg-[#0a1128] border border-slate-800 rounded-[56px] p-12 space-y-8 shadow-2xl">
            <h2 className="text-2xl font-black text-purple-400 uppercase">Nova Rotina</h2>
            <div className="space-y-4">
              <input required className="w-full py-4 px-6 rounded-2xl bg-slate-900 outline-none border border-slate-800 focus:border-purple-500 transition-colors" placeholder="Tarefa Recorrente" value={recurringForm.text} onChange={e => setRecurringForm({...recurringForm, text: e.target.value})} />
              <select className="w-full py-4 px-6 rounded-2xl bg-slate-900 outline-none appearance-none border border-slate-800 focus:border-purple-500 transition-colors" value={recurringForm.energy} onChange={e => setRecurringForm({...recurringForm, energy: e.target.value as any})}>
                <option value="Baixa">Baixa Energia</option><option value="Média">Energia Média</option><option value="Alta">Alta Energia</option>
              </select>
            </div>
            <button type="submit" className="w-full py-5 bg-purple-600 rounded-3xl font-black uppercase shadow-glow-blue hover:bg-purple-500 transition-all">Ativar Ciclo</button>
            <button type="button" onClick={() => setShowRecurringForm(false)} className="w-full text-slate-500 font-bold uppercase text-xs tracking-widest hover:text-white transition-colors">Cancelar</button>
          </form>
        </div>
      )}

      {showDopamenuForm && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl">
          <form onSubmit={addDopamenuItem} className="w-full max-w-lg bg-[#0a1128] border border-slate-800 rounded-[56px] p-12 space-y-8 shadow-2xl">
            <h2 className="text-2xl font-black text-orange-600 uppercase">Novo Item</h2>
            <div className="space-y-4">
              <input required className="w-full py-4 px-6 rounded-2xl bg-slate-900 outline-none border border-slate-800 focus:border-orange-500 transition-colors" placeholder="Atividade" value={dopamenuForm.label} onChange={e => setDopamenuForm({...dopamenuForm, label: e.target.value})} />
              <select className="w-full py-4 px-6 rounded-2xl bg-slate-900 outline-none appearance-none border border-slate-800 focus:border-orange-500 transition-colors" value={dopamenuForm.category} onChange={e => setDopamenuForm({...dopamenuForm, category: e.target.value as any})}>
                <option value="Starter">Starter</option><option value="Main">Main</option><option value="Side">Side</option><option value="Dessert">Dessert</option>
              </select>
            </div>
            <button type="submit" className="w-full py-5 bg-orange-600 rounded-3xl font-black uppercase shadow-glow-orange hover:bg-orange-500 transition-all">Adicionar</button>
            <button type="button" onClick={() => setShowDopamenuForm(false)} className="w-full text-slate-500 font-bold uppercase text-xs tracking-widest hover:text-white transition-colors">Cancelar</button>
          </form>
        </div>
      )}
    </div>
  );
};

const NavButton: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center p-4 rounded-[28px] transition-all md:flex-row md:justify-start md:gap-5 md:w-full md:px-8 md:py-5 ${active ? 'bg-orange-600 text-white shadow-2xl scale-[1.05]' : 'text-slate-500 hover:bg-slate-800/30'}`}>
    {icon}<span className="text-[10px] mt-2 font-black uppercase md:text-sm md:mt-0 md:tracking-widest">{label}</span>
  </button>
);

const EnergyBadge: React.FC<{ energy: Task['energy'], onClick?: () => void, highlighted?: boolean }> = ({ energy, onClick, highlighted }) => {
  const colors = { 
    'Baixa': highlighted ? 'bg-green-600 text-white shadow-glow-success' : 'bg-green-600/20 text-green-500', 
    'Média': highlighted ? 'bg-yellow-600 text-white shadow-glow-orange' : 'bg-yellow-600/20 text-yellow-500', 
    'Alta': highlighted ? 'bg-red-600 text-white shadow-glow-red' : 'bg-red-600/20 text-red-500' 
  };
  return (
    <span 
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className={`px-3 py-1 rounded-full text-[8px] font-black uppercase cursor-pointer select-none transition-all hover:scale-105 active:scale-95 ${colors[energy] || colors['Média']}`}
    >
      {energy}
    </span>
  );
};

const MatrixQuadrant: React.FC<{ priority: Priority, title: string, color: string, tasks: Task[], onSelect: (t: Task) => void, onDrop: (taskId: string, newPriority: Priority) => void, onUpdateEnergy: (id: string) => void, currentArousal: BrainCapacity }> = ({ priority, title, color, tasks, onSelect, onDrop, onUpdateEnergy, currentArousal }) => {
  const isCompatible = (taskEnergy: Task['energy']) => {
    if (currentArousal === 'Exausto') return taskEnergy === 'Baixa';
    if (currentArousal === 'Neutro') return taskEnergy === 'Baixa' || taskEnergy === 'Média';
    return true;
  };
  return (
    <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const tid = e.dataTransfer.getData("taskId"); if(tid) onDrop(tid, priority); }} className={`p-10 border rounded-[56px] ${color} min-h-[380px] transition-all group overflow-hidden shadow-sm hover:shadow-md`}>
      <h3 className="font-black uppercase text-[10px] tracking-[0.3em] text-slate-500 mb-8">{title}</h3>
      <div className="space-y-4">
        {tasks.map(t => {
          const compatible = isCompatible(t.energy);
          return (
            <div key={t.id} draggable onDragStart={e => e.dataTransfer.setData("taskId", t.id)} className={`p-6 bg-slate-900 border rounded-3xl flex justify-between items-center group cursor-grab shadow-lg transition-all ${compatible ? 'border-orange-500/30 hover:border-orange-500/60' : 'opacity-30 grayscale hover:grayscale-0 hover:opacity-100'}`}>
              <span onClick={() => onSelect(t)} className="text-sm font-black truncate flex-1 hover:text-orange-500 transition-colors">{t.text}</span>
              <EnergyBadge energy={t.energy} highlighted={compatible} onClick={() => onUpdateEnergy(t.id)} />
            </div>
          );
        })}
        {tasks.length === 0 && <p className="text-center py-20 text-[9px] font-black text-slate-700 uppercase tracking-widest opacity-30">Livre de pendências</p>}
      </div>
    </div>
  );
};

export default App;
