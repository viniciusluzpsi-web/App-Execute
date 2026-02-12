
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
  Clock, CalendarRange, Binary, ShieldCheck, Palette, BookOpen, UtensilsCrossed
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

const TUTORIAL_STEPS = [
  {
    title: "Bem-vindo à sua Segunda Mente",
    description: "O NeuroExecutor é um sistema de suporte às suas funções executivas, projetado para reduzir a paralisia de decisão e a fadiga mental. Vamos entender como ele funciona?",
    icon: <BrainCircuit className="w-16 h-16 text-orange-500" />,
    tab: null
  },
  {
    title: "Sua Capacidade Neural",
    description: "Antes de tudo: identifique como seu cérebro está agora no painel lateral. O sistema filtrará tarefas automaticamente para não sobrecarregar seu processamento.",
    icon: <BatteryMedium className="w-16 h-16 text-orange-400" />,
    tab: 'execute'
  },
  {
    title: "Dashboard de Consistência",
    description: "Acompanhe sua evolução semanal. O cérebro adora ver padrões de sucesso; isso reforça sua nova identidade produtiva.",
    icon: <TrendingUp className="w-16 h-16 text-orange-500" />,
    tab: 'dashboard'
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
  const particles = Array.from({ length: 12 });
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible z-50">
      {particles.map((_, i) => {
        const angle = (i / particles.length) * Math.PI * 2;
        const velocity = 40 + Math.random() * 60;
        const dx = Math.cos(angle) * velocity;
        const dy = Math.sin(angle) * velocity;
        return (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-particle shadow-lg"
            style={{
              backgroundColor: i % 2 === 0 ? '#f97316' : '#facc15',
              '--dx': `${dx}px`,
              '--dy': `${dy}px`,
              animationDelay: `${Math.random() * 0.1}s`
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
    const localData = localStorage.getItem('neuro_executor_data_v2');
    if (localData) {
      const parsed = JSON.parse(localData);
      setTasks(parsed.tasks || []);
      setRecurringTasks(parsed.recurringTasks || []);
      setHabits(parsed.habits || []);
      setPoints(parsed.points || 0);
      setDopamenuItems(parsed.dopamenuItems || INITIAL_DOPAMENU);
    }
    setIsDataLoaded(true);
    if (!localStorage.getItem('neuro-tutorial-seen')) {
      setTutorialStep(0);
    }
  }, []);

  useEffect(() => {
    if (!isDataLoaded) return;
    const dataToSave = { tasks, recurringTasks, habits, points, dopamenuItems };
    localStorage.setItem('neuro_executor_data_v2', JSON.stringify(dataToSave));
  }, [tasks, recurringTasks, habits, points, dopamenuItems, isDataLoaded]);

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
        }
        return { ...t, completed: !t.completed };
      }
      return t;
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
      localStorage.setItem('neuro-tutorial-seen', 'true');
    }
  };

  const skipTutorial = () => {
    setTutorialStep(null);
    localStorage.setItem('neuro-tutorial-seen', 'true');
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
      if (currentArousal === 'Hiperfocado') return true;
      return t.energy !== 'Alta';
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
              <button onClick={() => setCurrentArousal('Exausto')} className={`flex-1 p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${currentArousal === 'Exausto' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'border-slate-800 opacity-40'}`}>
                <BatteryLow size={16}/><span className="text-[8px] font-black uppercase">Exausto</span>
              </button>
              <button onClick={() => setCurrentArousal('Neutro')} className={`flex-1 p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${currentArousal === 'Neutro' ? 'bg-orange-600/20 border-orange-500 text-orange-400' : 'border-slate-800 opacity-40'}`}>
                <BatteryMedium size={16}/><span className="text-[8px] font-black uppercase">Neutro</span>
              </button>
              <button onClick={() => setCurrentArousal('Hiperfocado')} className={`flex-1 p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${currentArousal === 'Hiperfocado' ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'border-slate-800 opacity-40'}`}>
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
                        <div className="flex gap-4">
                           <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500"></div><span className="text-[8px] font-bold uppercase text-slate-400">Hábitos</span></div>
                           <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500"></div><span className="text-[8px] font-bold uppercase text-slate-400">Rotinas</span></div>
                        </div>
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
                                    <div className="w-4 bg-orange-600 rounded-full transition-all duration-1000" style={{ height: `${Math.max(4, habitCount * 20)}px` }}></div>
                                    <div className="w-4 bg-purple-600 rounded-full transition-all duration-1000" style={{ height: `${Math.max(4, routineCount * 20)}px` }}></div>
                                 </div>
                                 
                                 <span className="text-[8px] font-black text-slate-700">{day.split('-')[2]}</span>
                              </div>
                           );
                        })}
                     </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-8 border rounded-[40px] bg-orange-600/5 border-orange-500/10 flex flex-col items-center justify-center text-center gap-4">
                       <Trophy className="text-orange-500" size={40}/>
                       <div>
                          <p className="text-[8px] font-black uppercase text-slate-500 mb-1">XP Total</p>
                          <p className="text-4xl font-black italic tracking-tighter text-orange-600">{points}</p>
                       </div>
                    </div>
                    
                    <div className="p-8 border rounded-[40px] bg-slate-900 border-slate-800 space-y-4">
                       <h4 className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Resumo Neural</h4>
                       <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-slate-800/40 rounded-2xl border border-slate-800">
                             <span className="text-[10px] font-bold text-slate-400">Hábitos Ativos</span>
                             <span className="text-sm font-black text-white">{habits.length}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-slate-800/40 rounded-2xl border border-slate-800">
                             <span className="text-[10px] font-bold text-slate-400">Rotinas Fixas</span>
                             <span className="text-sm font-black text-white">{recurringTasks.length}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-slate-800/40 rounded-2xl border border-slate-800">
                             <span className="text-[10px] font-bold text-slate-400">Tarefas Pendentes</span>
                             <span className="text-sm font-black text-orange-500">{tasks.filter(t => !t.completed).length}</span>
                          </div>
                       </div>
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 border rounded-[48px] bg-slate-900/60 border-slate-800">
                     <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-6">Mapeamento de Hábitos</h3>
                     <div className="space-y-4">
                        {habits.map(h => {
                           const completionsThisWeek = last7Days.filter(d => h.completedDates?.includes(d)).length;
                           return (
                              <div key={h.id} className="space-y-2">
                                 <div className="flex justify-between text-[10px] font-bold">
                                    <span className="text-slate-300 truncate max-w-[150px] uppercase">{h.text}</span>
                                    <span className="text-orange-500">{completionsThisWeek}/7 dias</span>
                                 </div>
                                 <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-0.5">
                                    {last7Days.map(day => (
                                       <div key={day} className={`flex-1 h-full rounded-full ${h.completedDates?.includes(day) ? 'bg-orange-600' : 'bg-slate-700/30'}`}></div>
                                    ))}
                                 </div>
                              </div>
                           )
                        })}
                     </div>
                  </div>

                  <div className="p-8 border rounded-[48px] bg-slate-900/60 border-slate-800">
                     <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-6">Eficiência de Rotinas</h3>
                     <div className="space-y-4">
                        {recurringTasks.map(rt => {
                           const completionsThisWeek = last7Days.filter(d => rt.completedDates?.includes(d)).length;
                           return (
                              <div key={rt.id} className="space-y-2">
                                 <div className="flex justify-between text-[10px] font-bold">
                                    <span className="text-slate-300 truncate max-w-[150px] uppercase">{rt.text}</span>
                                    <span className="text-purple-500">{completionsThisWeek}/7 dias</span>
                                 </div>
                                 <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-0.5">
                                    {last7Days.map(day => (
                                       <div key={day} className={`flex-1 h-full rounded-full ${rt.completedDates?.includes(day) ? 'bg-purple-600' : 'bg-slate-700/30'}`}></div>
                                    ))}
                                 </div>
                              </div>
                           )
                        })}
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'execute' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-700">
              <div className="lg:col-span-2 space-y-8">
                <div className="p-12 text-center border rounded-[48px] bg-slate-900/60 border-slate-800 relative overflow-hidden shadow-2xl group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-slate-800 overflow-hidden">
                    <div className="h-full bg-orange-600 transition-all duration-1000" style={{ width: `${(timeLeft / (90 * 60)) * 100}%` }}></div>
                  </div>
                  <span className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase mb-4 block">Ciclo Ultradiano</span>
                  <h2 className="text-[100px] leading-none font-mono font-black tracking-tighter tabular-nums mb-8">{formatTime(timeLeft)}</h2>
                  <div className="flex justify-center gap-6">
                    <button onClick={() => { setIsTimerActive(!isTimerActive); if(!isTimerActive) playAudio(SOUNDS.TIMER_START); }} className="w-20 h-20 bg-orange-600 rounded-[32px] text-white shadow-glow-orange flex items-center justify-center hover:bg-orange-500 transition-all active:scale-95">
                      {isTimerActive ? <Pause size={32}/> : <Play size={32} fill="currentColor"/>}
                    </button>
                    <button onClick={() => { setTimeLeft(90*60); setIsTimerActive(false); }} className="w-20 h-20 bg-slate-800/80 rounded-[32px] text-slate-400 flex items-center justify-center hover:text-white transition-colors"> <RotateCcw size={32}/> </button>
                  </div>
                </div>

                <div className="p-10 border rounded-[48px] bg-slate-900/60 border-slate-800 min-h-[350px] shadow-xl backdrop-blur-sm">
                  {selectedTask ? (
                    <div className="space-y-8 animate-in slide-in-from-bottom duration-300">
                      <div className="flex justify-between items-start">
                        <div className="space-y-3">
                          <h2 className={`text-4xl font-black ${selectedTask.completed ? 'line-through opacity-20' : ''}`}>{selectedTask.text}</h2>
                          <div className="flex gap-2">
                            <span className="px-3 py-1 bg-orange-600/20 text-orange-500 rounded-full text-[8px] font-black uppercase tracking-widest">{selectedTask.priority}</span>
                            <EnergyBadge energy={selectedTask.energy} />
                          </div>
                        </div>
                        <button onClick={() => setSelectedTask(null)} className="p-2 text-slate-500 hover:text-white transition-colors"><X /></button>
                      </div>
                      <div className="space-y-4">
                        {selectedTask.subtasks.map((s, i) => (
                          <div key={i} className="p-5 bg-slate-800/30 rounded-3xl flex items-center gap-5 border border-slate-700/30">
                            <span className="text-[10px] font-black text-orange-500 w-8 h-8 flex items-center justify-center bg-orange-500/10 rounded-full border border-orange-500/20">{i+1}</span>
                            <p className="text-sm font-medium opacity-80">{s}</p>
                          </div>
                        ))}
                        {selectedTask.subtasks.length === 0 && !(selectedTask as any).isRecurring && (
                          <button onClick={() => handleDecompose(selectedTask)} disabled={isDecomposing} className="w-full py-16 border-2 border-dashed border-slate-800 rounded-[32px] flex flex-col items-center gap-3 opacity-40 hover:opacity-100 hover:border-orange-500/50 transition-all group">
                            {isDecomposing ? <Loader2 className="animate-spin text-orange-500" /> : <Sparkles className="group-hover:text-orange-500"/>}
                            <span className="text-[10px] font-black uppercase tracking-widest">{isDecomposing ? 'Processando Neurônios...' : 'Chunking IA (Desmembrar)'}</span>
                          </button>
                        )}
                      </div>
                      <button 
                        onClick={() => {
                          if((selectedTask as any).isRecurring) { toggleRecurringTask(selectedTask.id); setSelectedTask(null); } 
                          else { toggleTask(selectedTask.id); }
                        }} 
                        className={`w-full py-6 rounded-3xl font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 ${selectedTask.completed ? 'bg-green-600/20 text-green-500 border border-green-500/50' : 'bg-orange-600 text-white'} shadow-glow-orange`}
                      >
                        {selectedTask.completed ? "Reativar Alvo" : "Completar Missão (+XP)"}
                      </button>
                    </div>
                  ) : (
                    <div className="py-24 text-center opacity-10 flex flex-col items-center gap-6">
                      <Target size={100}/>
                      <p className="text-2xl font-black uppercase italic tracking-tighter">Próximo Alvo Neural</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-8 border rounded-[40px] bg-slate-900/60 border-slate-800 shadow-lg">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Fila de Execução</h3>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  </div>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                      {executableList.map(t => (
                        <button 
                          key={t.id} 
                          onClick={() => setSelectedTask(t as any)} 
                          className={`w-full p-5 text-left border rounded-[24px] transition-all group relative overflow-hidden ${selectedTask?.id === t.id ? 'bg-orange-600/10 border-orange-500 ring-1 ring-orange-500' : 'border-slate-800 bg-slate-800/20 hover:bg-slate-800/40'}`}
                        >
                          <div className="flex justify-between items-center gap-3">
                            <p className="text-sm font-bold truncate group-hover:translate-x-1 transition-transform">{t.text}</p>
                            {(t as any).isRecurring && <Repeat size={12} className="text-purple-400 shrink-0" />}
                          </div>
                        </button>
                      ))}
                      {executableList.length === 0 && (
                        <div className="text-center py-20 opacity-30">
                          <CheckCircle2 className="mx-auto mb-2" size={32} />
                          <p className="text-[10px] uppercase font-black">Limpo</p>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dopamenu' && (
            <div className="space-y-10 animate-in fade-in duration-700">
               <div className="flex justify-between items-center px-4">
                <div className="space-y-2">
                  <h2 className="text-4xl font-black italic uppercase tracking-tighter text-orange-600">Dopamenu</h2>
                  <p className="text-xs text-slate-500 font-medium">Recompensas saudáveis para manter o motor neural lubrificado.</p>
                </div>
                <button onClick={() => setShowDopamenuForm(true)} className="w-16 h-16 bg-orange-600 rounded-3xl flex items-center justify-center text-white shadow-glow-orange hover:scale-110 transition-transform active:scale-95">
                  <Plus size={32}/>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {['Starter', 'Main', 'Side', 'Dessert'].map((category) => (
                  <div key={category} className="p-8 bg-slate-900/40 border border-slate-800/50 rounded-[48px] space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-600/10 text-orange-500 rounded-xl">
                        {category === 'Starter' ? <Zap size={20}/> : category === 'Main' ? <Utensils size={20}/> : category === 'Side' ? <Waves size={20}/> : <Star size={20}/>}
                      </div>
                      <h3 className="text-xl font-black uppercase italic tracking-wider">{category === 'Starter' ? 'Entradas (5-10min)' : category === 'Main' ? 'Pratos Principais (30min+)' : category === 'Side' ? 'Acompanhamentos' : 'Sobremesas (Grandes vitórias)'}</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {dopamenuItems.filter(item => item.category === category).map(item => (
                        <div key={item.id} className="p-6 bg-slate-800/20 border border-slate-700/30 rounded-3xl group flex justify-between items-start transition-all hover:bg-slate-800/40">
                          <div className="space-y-1">
                            <h4 className="font-bold text-orange-400 uppercase text-sm tracking-wide">{item.label}</h4>
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{item.description}</p>
                          </div>
                          <button onClick={() => removeDopamenuItem(item.id)} className="p-2 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      ))}
                      {dopamenuItems.filter(item => item.category === category).length === 0 && (
                        <div className="py-8 text-center opacity-20 italic text-xs">Vazio</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'plan' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 gap-4">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter">Matriz de Eisenhower</h2>
                <div className="flex gap-4">
                  <button onClick={handleAutoCategorize} disabled={isOptimizing} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-[10px] font-black uppercase flex items-center gap-2 shadow-xl shadow-blue-900/20 disabled:opacity-50 transition-all">
                    {isOptimizing ? <Loader2 size={14} className="animate-spin"/> : <Brain size={14}/>} Otimizar IA
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <MatrixQuadrant priority={Priority.Q1} title="Q1: Crítico e Urgente" color="bg-red-600/5 border-red-500/20" tasks={dayTasks.filter(t => t.priority === Priority.Q1 && !t.completed)} onSelect={(t) => { setSelectedTask(t); setActiveTab('execute'); }} onDrop={handleTaskDrop} />
                <MatrixQuadrant priority={Priority.Q2} title="Q2: Importante/Estratégico" color="bg-orange-600/5 border-orange-500/20" tasks={dayTasks.filter(t => t.priority === Priority.Q2 && !t.completed)} onSelect={(t) => { setSelectedTask(t); setActiveTab('execute'); }} onDrop={handleTaskDrop} />
                <MatrixQuadrant priority={Priority.Q3} title="Q3: Interrupções/Delegar" color="bg-blue-600/5 border-blue-500/20" tasks={dayTasks.filter(t => t.priority === Priority.Q3 && !t.completed)} onSelect={(t) => { setSelectedTask(t); setActiveTab('execute'); }} onDrop={handleTaskDrop} />
                <MatrixQuadrant priority={Priority.Q4} title="Q4: Eliminar Distrações" color="bg-slate-800/20 border-slate-700/50" tasks={dayTasks.filter(t => t.priority === Priority.Q4 && !t.completed)} onSelect={(t) => { setSelectedTask(t); setActiveTab('execute'); }} onDrop={handleTaskDrop} />
              </div>
            </div>
          )}

          {activeTab === 'upgrades' && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div className="px-4">
                 <h2 className="text-4xl font-black italic uppercase tracking-tighter text-orange-600">Upgrade Neural</h2>
                 <p className="text-xs text-slate-500 font-medium mt-1">Desbloqueie novas arquiteturas e camadas visuais com seu esforço cognitivo.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {LEVELS.map(l => {
                  const isUnlocked = points >= l.minPoints;
                  return (
                    <div key={l.level} className={`p-8 rounded-[48px] border transition-all ${isUnlocked ? 'bg-[#0a1128] border-orange-500/20' : 'bg-slate-900/20 border-slate-800/50 grayscale opacity-40'}`}>
                       <div className="flex justify-between items-start mb-6">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isUnlocked ? 'bg-orange-600/10 text-orange-500' : 'bg-slate-800 text-slate-600'}`}>
                             {l.level === 1 ? <Neuron size={28}/> : l.level === 5 ? <Award size={28}/> : <Binary size={28}/>}
                          </div>
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">NVL {l.level}</span>
                       </div>
                       <h3 className="text-2xl font-black uppercase mb-2">{l.title}</h3>
                       <p className="text-xs text-slate-500 mb-6">{l.unlock}</p>
                       
                       {isUnlocked && l.themeId && (
                         <button 
                           onClick={() => handleThemeChange(l.themeId!)} 
                           className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all ${visualTheme === l.themeId ? 'bg-orange-600 text-white shadow-glow-orange' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                         >
                           <Palette size={14}/> {visualTheme === l.themeId ? 'Tema Ativo' : 'Ativar Estilo'}
                         </button>
                       )}
                       {!isUnlocked && (
                         <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-4">
                            <div className="h-full bg-slate-700 transition-all" style={{ width: `${Math.min(100, (points / l.minPoints) * 100)}%` }}></div>
                         </div>
                       )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'fixed' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-between items-center px-4">
                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-purple-400">Rotinas Fixas</h2>
                <button onClick={() => setShowRecurringForm(true)} className="w-16 h-16 bg-purple-600 rounded-3xl flex items-center justify-center text-white shadow-glow-blue hover:scale-110 transition-transform active:scale-95">
                  <Plus size={32}/>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {recurringTasks.map(rt => {
                  const isDoneToday = rt.completedDates.includes(selectedDate);
                  return (
                    <div key={rt.id} className={`p-8 bg-slate-900/60 border rounded-[40px] flex flex-col justify-between h-[300px] group transition-all relative overflow-visible ${isDoneToday ? 'border-green-500/30 bg-green-500/5 animate-glow-success' : 'border-slate-800 hover:border-purple-500/40'}`}>
                      {sparkleTaskId === rt.id && <SparkleParticles />}
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div className={`p-4 rounded-2xl transition-colors ${isDoneToday ? 'bg-green-600/10 text-green-400' : 'bg-purple-600/10 text-purple-400'}`}>
                            {rt.frequency === Frequency.DAILY ? <Sun size={24}/> : rt.frequency === Frequency.WEEKLY ? <CalendarDays size={24}/> : <Calendar size={24}/>}
                          </div>
                          <EnergyBadge energy={rt.energy} />
                        </div>
                        <h3 className={`text-xl font-black uppercase transition-opacity ${isDoneToday ? 'opacity-40 line-through' : ''}`}>{rt.text}</h3>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => toggleRecurringTask(rt.id)} className={`flex-1 py-3 px-4 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${isDoneToday ? 'bg-green-600/20 text-green-500' : 'bg-purple-600 text-white hover:bg-purple-500'}`}>
                          {isDoneToday ? 'Reativar' : 'Concluir'}
                        </button>
                        <button onClick={() => setRecurringTasks(prev => prev.filter(p => p.id !== rt.id))} className="p-3 bg-red-600/5 text-red-500/50 hover:text-red-500 hover:bg-red-600/10 rounded-2xl transition-all">
                            <Trash2 size={16}/>
                        </button>
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
                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-orange-600">Andaimação Neural</h2>
                <button onClick={() => setShowHabitForm(true)} className="w-16 h-16 bg-orange-600 rounded-3xl flex items-center justify-center text-white shadow-glow-orange hover:scale-110 transition-transform active:scale-95">
                  <Plus size={32}/>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {habits.map(h => {
                  const isDoneToday = h.lastCompleted === selectedDate;
                  return (
                    <div key={h.id} className={`p-8 rounded-[40px] border transition-all flex flex-col justify-between h-[300px] group ${isDoneToday ? 'bg-green-600/5 border-green-500/30' : 'bg-slate-900/60 border-slate-800 hover:border-orange-500/50'}`}>
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <Flame className={h.streak > 0 ? "text-orange-500 animate-pulse" : "text-slate-800"} size={28} />
                          <div className="text-right"><span className="text-4xl font-black italic leading-none">{h.streak}</span><p className="text-[10px] font-black text-slate-500 uppercase">DIAS</p></div>
                        </div>
                        <h3 className="text-xl font-black leading-tight mb-2 uppercase">{h.text}</h3>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => completeHabit(h.id)} disabled={isDoneToday} className={`flex-1 py-4 rounded-2xl font-black uppercase text-xs transition-all ${isDoneToday ? 'bg-green-600/20 text-green-500' : 'bg-orange-600 text-white hover:bg-orange-500'}`}>
                          {isDoneToday ? 'Finalizado hoje' : 'Ativar Hábito'}
                        </button>
                        <button onClick={() => setHabits(prev => prev.filter(p => p.id !== h.id))} className="p-4 bg-slate-800 text-slate-600 hover:text-red-500 rounded-2xl transition-colors">
                          <Trash2 size={18}/>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'capture' && (
            <div className="max-w-3xl mx-auto py-24 space-y-16 text-center animate-in zoom-in duration-500">
              <div className="space-y-4">
                <h2 className="text-6xl font-black italic tracking-tighter uppercase leading-tight">Descarregar<br/>Mente</h2>
                <p className="text-sm text-slate-500 font-medium tracking-wide">Capture o caos antes que ele se torne sobrecarga cognitiva.</p>
              </div>
              <div className="p-10 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-[64px] shadow-2xl flex items-center gap-6 focus-within:ring-2 focus-within:ring-orange-600 focus-within:border-transparent transition-all group">
                <input 
                  autoFocus 
                  className="flex-1 bg-transparent border-none text-3xl font-black outline-none placeholder:text-slate-800 transition-colors focus:placeholder:text-slate-700" 
                  placeholder="O que está na sua cabeça?" 
                  value={newTaskText} 
                  onChange={e => setNewTaskText(e.target.value)} 
                  onKeyDown={e => { 
                    if(e.key === 'Enter') { 
                      addTask(newTaskText); 
                      setNewTaskText(""); 
                      setActiveTab('plan'); 
                    } 
                  }} 
                />
                <button 
                  onClick={() => { 
                    addTask(newTaskText); 
                    setNewTaskText(""); 
                    setActiveTab('plan'); 
                  }} 
                  className="w-24 h-24 bg-orange-600 rounded-[40px] flex items-center justify-center hover:scale-105 transition-all shadow-glow-orange"
                >
                  <Plus size={48} className="text-white"/>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Tutorial Overlay */}
      {tutorialStep !== null && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0a1128] border border-orange-500/20 rounded-[56px] p-12 text-center space-y-8 shadow-3xl relative overflow-hidden">
             {/* Progress Bar */}
             <div className="absolute top-0 left-0 w-full h-1 bg-slate-800">
                <div className="h-full bg-orange-600 transition-all duration-500" style={{ width: `${((tutorialStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}></div>
             </div>

             <div className="flex justify-center mb-4">
                {TUTORIAL_STEPS[tutorialStep].icon}
             </div>
             
             <div className="space-y-4">
                <h2 className="text-3xl font-black uppercase italic text-orange-500">{TUTORIAL_STEPS[tutorialStep].title}</h2>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">
                  {TUTORIAL_STEPS[tutorialStep].description}
                </p>
             </div>

             <div className="flex flex-col gap-4">
                <button 
                  onClick={nextTutorialStep} 
                  className="w-full py-5 bg-orange-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-glow-orange hover:bg-orange-500 transition-all flex items-center justify-center gap-2 group"
                >
                  {tutorialStep === TUTORIAL_STEPS.length - 1 ? "Começar Jornada" : "Entendi, Próximo"}
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={skipTutorial} 
                  className="text-xs font-black text-slate-500 uppercase hover:text-white transition-colors"
                >
                  Pular Tutorial
                </button>
             </div>
             
             <div className="flex justify-center gap-1.5">
                {TUTORIAL_STEPS.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all ${i === tutorialStep ? 'w-8 bg-orange-600' : 'w-1.5 bg-slate-800'}`}></div>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* Forms Modals */}
      {showHabitForm && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in">
          <form onSubmit={addHabit} className="w-full max-w-lg bg-[#0a1128] border border-slate-800 rounded-[56px] p-12 space-y-8 shadow-3xl">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black uppercase italic text-orange-600">Nova Arquitetura</h2>
              <button type="button" onClick={() => setShowHabitForm(false)} className="p-2 text-slate-500 hover:text-white"><X/></button>
            </div>
            <div className="space-y-6">
              <input required className="w-full py-4 px-6 rounded-2xl bg-slate-900 border border-slate-800 outline-none focus:border-orange-600 transition-colors" placeholder="Hábito Alvo" value={habitForm.text} onChange={e => setHabitForm({...habitForm, text: e.target.value})} />
              <input required className="w-full py-4 px-6 rounded-2xl bg-slate-900 border border-slate-800 outline-none focus:border-orange-600 transition-colors" placeholder="Âncora (Depois de...)" value={habitForm.anchor} onChange={e => setHabitForm({...habitForm, anchor: e.target.value})} />
              <input required className="w-full py-4 px-6 rounded-2xl bg-slate-900 border border-slate-800 outline-none focus:border-orange-600 transition-colors" placeholder="Micro-ação (Vou...)" value={habitForm.tinyAction} onChange={e => setHabitForm({...habitForm, tinyAction: e.target.value})} />
            </div>
            <button type="submit" className="w-full py-5 bg-orange-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-glow-orange">Solidificar</button>
          </form>
        </div>
      )}

      {showDopamenuForm && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in">
          <form onSubmit={addDopamenuItem} className="w-full max-w-lg bg-[#0a1128] border border-slate-800 rounded-[56px] p-12 space-y-8 shadow-3xl">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black uppercase italic text-orange-600">Novo Item de Recarga</h2>
              <button type="button" onClick={() => setShowDopamenuForm(false)} className="p-2 text-slate-500 hover:text-white"><X/></button>
            </div>
            <div className="space-y-6">
              <input required className="w-full py-4 px-6 rounded-2xl bg-slate-900 border border-slate-800 outline-none focus:border-orange-600 transition-colors" placeholder="Nome da Atividade" value={dopamenuForm.label} onChange={e => setDopamenuForm({...dopamenuForm, label: e.target.value})} />
              <textarea required className="w-full py-4 px-6 rounded-2xl bg-slate-900 border border-slate-800 outline-none focus:border-orange-600 transition-colors resize-none h-24" placeholder="Descrição curta (por que funciona?)" value={dopamenuForm.description} onChange={e => setDopamenuForm({...dopamenuForm, description: e.target.value})} />
              <select className="w-full py-4 px-6 rounded-2xl bg-slate-900 border border-slate-800 outline-none focus:border-orange-600 appearance-none transition-colors" value={dopamenuForm.category} onChange={e => setDopamenuForm({...dopamenuForm, category: e.target.value as any})}>
                <option value="Starter">Entrada (Curto)</option>
                <option value="Main">Prato Principal (Médio)</option>
                <option value="Side">Acompanhamento (Paralelo)</option>
                <option value="Dessert">Sobremesa (Grande)</option>
              </select>
            </div>
            <button type="submit" className="w-full py-5 bg-orange-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-glow-orange">Adicionar ao Menu</button>
          </form>
        </div>
      )}

      {showRecurringForm && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in">
          <form onSubmit={addRecurringTask} className="w-full max-w-lg bg-[#0a1128] border border-slate-800 rounded-[56px] p-12 space-y-8 shadow-3xl">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black uppercase italic text-purple-400">Rotina Fixa</h2>
              <button type="button" onClick={() => setShowRecurringForm(false)} className="p-2 text-slate-500 hover:text-white"><X/></button>
            </div>
            <div className="space-y-6">
              <input required className="w-full py-4 px-6 rounded-2xl bg-slate-900 border border-slate-800 outline-none focus:border-purple-600 transition-colors" placeholder="Tarefa Recorrente" value={recurringForm.text} onChange={e => setRecurringForm({...recurringForm, text: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <select className="w-full py-4 px-6 rounded-2xl bg-slate-900 border border-slate-800 outline-none focus:border-purple-600 appearance-none transition-colors" value={recurringForm.frequency} onChange={e => setRecurringForm({...recurringForm, frequency: e.target.value as Frequency})}>
                  {Object.values(Frequency).map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <select className="w-full py-4 px-6 rounded-2xl bg-slate-900 border border-slate-800 outline-none focus:border-purple-600 appearance-none transition-colors" value={recurringForm.energy} onChange={e => setRecurringForm({...recurringForm, energy: e.target.value as any})}>
                  <option value="Baixa">Baixa Energia</option>
                  <option value="Média">Energia Média</option>
                  <option value="Alta">Alta Energia</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full py-5 bg-purple-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-glow-blue">Ativar Ciclo</button>
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

const EnergyBadge: React.FC<{ energy: Task['energy'] }> = ({ energy }) => {
  const colors = { 'Baixa': 'bg-green-600/20 text-green-500', 'Média': 'bg-yellow-600/20 text-yellow-500', 'Alta': 'bg-red-600/20 text-red-500' };
  return <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${colors[energy] || colors['Média']}`}>{energy}</span>;
};

const Neuron = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 9V3"/><path d="M12 15v6"/><path d="M9 12H3"/><path d="M15 12h6"/><path d="m19 5-3.5 3.5"/><path d="m5 19 3.5-3.5"/><path d="m19 19-3.5-3.5"/><path d="m5 5 3.5 3.5"/></svg>
);

const MatrixQuadrant: React.FC<{ priority: Priority, title: string, color: string, tasks: Task[], onSelect: (t: Task) => void, onDrop: (taskId: string, newPriority: Priority) => void }> = ({ priority, title, color, tasks, onSelect, onDrop }) => {
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-orange-500', 'ring-offset-2', 'ring-offset-slate-950'); };
  const handleDragLeave = (e: React.DragEvent) => e.currentTarget.classList.remove('ring-2', 'ring-orange-500', 'ring-offset-2', 'ring-offset-slate-950');
  const handleOnDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('ring-2', 'ring-orange-500', 'ring-offset-2', 'ring-offset-slate-950');
    const taskId = e.dataTransfer.getData("taskId");
    if(taskId) onDrop(taskId, priority);
  };
  return (
    <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleOnDrop} className={`p-10 border rounded-[56px] ${color} min-h-[380px] shadow-sm relative transition-all group overflow-hidden`}>
      <h3 className="font-black uppercase text-[10px] tracking-[0.3em] text-slate-500 mb-8 flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${priority === Priority.Q1 ? 'bg-red-500' : priority === Priority.Q2 ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
        {title}
      </h3>
      <div className="space-y-4 max-h-[280px] overflow-y-auto pr-3">
        {tasks.map(t => (
          <div key={t.id} draggable onDragStart={(e) => { e.dataTransfer.setData("taskId", t.id); e.currentTarget.classList.add('opacity-40'); }} onDragEnd={(e) => e.currentTarget.classList.remove('opacity-40')} className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl flex justify-between items-center group cursor-grab hover:border-slate-700 transition-all shadow-lg">
            <span onClick={() => onSelect(t)} className="text-sm font-black truncate flex-1">{t.text}</span>
            <div className="flex items-center gap-2">
              <EnergyBadge energy={t.energy} />
              <button onClick={() => onSelect(t)} className="opacity-0 group-hover:opacity-100 p-2 bg-orange-600 text-white rounded-xl transition-all"><Target size={16}/></button>
            </div>
          </div>
        ))}
        {tasks.length === 0 && <div className="h-40 flex items-center justify-center border-2 border-dashed border-slate-800/30 rounded-3xl"><p className="text-[9px] font-black text-slate-700 uppercase">Vazio</p></div>}
      </div>
    </div>
  );
};

export default App;
