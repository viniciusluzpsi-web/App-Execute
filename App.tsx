
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Timer, LayoutGrid, RefreshCw, ListTodo, Zap, AlertTriangle, 
  Plus, X, Trophy, Play, Pause, RotateCcw, 
  BrainCircuit, Anchor, Target, Flame, Sparkles, 
  Repeat, Award, TrendingUp, Sun, Moon, CheckCircle2,
  LogOut, User as UserIcon, Mail, Lock, ArrowRight, UserCheck,
  CalendarDays, Trash2, Star, CheckCircle, Info, Move, MousePointer2,
  ChevronRight, Brain, Lightbulb, ZapOff, Cloud, CloudCheck, CloudOff,
  Coffee, Utensils, Waves, Users, Wind, Battery, BatteryLow, BatteryMedium, BatteryFull,
  Check, ArrowLeft, GripVertical, Wand2, Calendar, HelpCircle, Volume2, VolumeX
} from 'lucide-react';
import { Priority, Task, Habit, IdentityBoost, PanicSolution, RecurringTask, Frequency, User, BrainCapacity, DopamenuItem } from './types';
import { geminiService } from './services/geminiService';
import { syncService } from './services/syncService';

// Sound Assets (Standard UI sounds)
const SOUNDS = {
  TASK_COMPLETE: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  HABIT_COMPLETE: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  TIMER_START: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  TIMER_END: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
  XP_GAIN: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'
};

const SynapseLogo = ({ className = "" }: { className?: string }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={`shrink-0 ${className}`}>
    <defs>
      <linearGradient id="logo-grad-fire" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#ef4444" />
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="14" fill="currentColor" fillOpacity="0.05" />
    <circle cx="16" cy="16" r="6" stroke="url(#logo-grad-fire)" strokeWidth="2" className="synapse-core" />
    <circle cx="16" cy="16" r="3" fill="url(#logo-grad-fire)" className="synapse-core" />
    <path d="M16 16L26 6" stroke="url(#logo-grad-fire)" strokeWidth="2.5" strokeLinecap="round" className="opacity-80" />
    <circle cx="26" cy="6" r="2" fill="#ef4444" />
  </svg>
);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('neuro-session');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  // Sound Control
  const [soundEnabled, setSoundEnabled] = useState(true);

  const playAudio = useCallback((soundUrl: string) => {
    if (!soundEnabled) return;
    const audio = new Audio(soundUrl);
    audio.volume = 0.4;
    audio.play().catch(e => console.debug("Audio play blocked by browser interaction policy"));
  }, [soundEnabled]);

  // State Management
  const [activeTab, setActiveTab] = useState<'execute' | 'plan' | 'habits' | 'capture' | 'dopamenu'>('execute');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [points, setPoints] = useState(0);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [theme] = useState<'light' | 'dark'>(() => (localStorage.getItem('neuro-theme') as 'light' | 'dark') || 'dark');
  
  const [dopamenuItems, setDopamenuItems] = useState<DopamenuItem[]>([
    { category: 'Starter', label: 'Meditação 2 min', description: 'Vitória rápida para baixar o cortisol.' },
    { category: 'Starter', label: 'Arrumar Cama', description: 'Sinaliza ordem para o córtex pré-frontal.' },
    { category: 'Main', label: 'Exercício Aeróbico', description: 'Pico de dopamina sustentado por 3h.' },
    { category: 'Main', label: 'Leitura Focada', description: 'Recarga profunda de significado.' },
    { category: 'Side', label: 'Música Ambiente', description: 'Reduz o ruído cognitivo de fundo.' },
    { category: 'Side', label: 'Body Doubling', description: 'Presença virtual para ancoragem social.' },
    { category: 'Dessert', label: 'Ver um Meme', description: 'Micro-dose indulgente (usar com moderação).' },
    { category: 'Dessert', label: 'Pausa para Café', description: 'Estímulo rápido de vigilância.' },
  ]);

  // Form States
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [habitForm, setHabitForm] = useState({ text: '', anchor: '', tinyAction: '' });
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [recurringForm, setRecurringForm] = useState({ text: '', frequency: Frequency.DAILY, energy: 'Baixa' as Task['energy'] });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [captureEnergy, setCaptureEnergy] = useState<Task['energy']>('Média');

  // Tutorial States
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showPlanTutorial, setShowPlanTutorial] = useState(false);
  const [planTutorialStep, setPlanTutorialStep] = useState(0);

  // Timer & UI States
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [panicTask, setPanicTask] = useState<Task | null>(null);
  const [panicSolution, setPanicSolution] = useState<PanicSolution | null>(null);
  const [isRescuing, setIsRescuing] = useState(false);
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [obstacleInput, setObstacleInput] = useState("");
  const [currentArousal, setCurrentArousal] = useState<BrainCapacity>('Neutro');
  const [isBodyDoubling, setIsBodyDoubling] = useState(false);
  const [showBreathingPause, setShowBreathingPause] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  
  // Auth States
  const [isRegistering, setIsRegistering] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // Initial Tutorial Check
  useEffect(() => {
    if (currentUser) {
      const hasSeen = localStorage.getItem(`neuro-tutorial-${currentUser.id}`);
      if (!hasSeen) setShowTutorial(true);
    }
  }, [currentUser]);

  // Plan Tutorial Check
  useEffect(() => {
    if (activeTab === 'plan' && currentUser) {
      const hasSeen = localStorage.getItem(`neuro-plan-tutorial-${currentUser.id}`);
      if (!hasSeen) setShowPlanTutorial(true);
    }
  }, [activeTab, currentUser]);

  // Sync Logic
  useEffect(() => {
    if (!currentUser) return;
    const loadData = async () => {
      setSyncStatus('syncing');
      const cloud = await syncService.pullData(currentUser.email);
      if (cloud) {
        if (cloud.tasks) setTasks(cloud.tasks);
        if (cloud.recurringTasks) setRecurringTasks(cloud.recurringTasks);
        if (cloud.habits) setHabits(cloud.habits);
        if (cloud.points !== undefined) setPoints(cloud.points);
        if (cloud.dopamenuItems) setDopamenuItems(cloud.dopamenuItems);
      }
      setSyncStatus('synced');
    };
    loadData();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || currentUser.id === 'guest') return;
    const save = async () => {
      setSyncStatus('syncing');
      const success = await syncService.pushData(currentUser.email, { 
        tasks, recurringTasks, habits, points, dopamenuItems 
      });
      setSyncStatus(success ? 'synced' : 'error');
    };
    const t = setTimeout(save, 1500);
    return () => clearTimeout(t);
  }, [tasks, recurringTasks, habits, points, dopamenuItems, currentUser]);

  useEffect(() => {
    let interval: any = null;
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isTimerActive) {
      setIsTimerActive(false);
      setShowBreathingPause(true);
      playAudio(SOUNDS.TIMER_END);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft, playAudio]);

  const toggleTimer = () => {
    const newState = !isTimerActive;
    setIsTimerActive(newState);
    if (newState) {
      playAudio(SOUNDS.TIMER_START);
    }
  };

  // Actions
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingAuth(true);
    const cloudUser = await syncService.findUser(authEmail);
    if (cloudUser && cloudUser.password === authPassword) {
      const u = { id: cloudUser.id, name: cloudUser.name, email: cloudUser.email };
      localStorage.setItem('neuro-session', JSON.stringify(u));
      setCurrentUser(u);
    } else { alert("Email ou senha incorretos."); }
    setIsLoadingAuth(false);
  };

  const handleRegister = async () => {
    setIsLoadingAuth(true);
    try {
      const existing = await syncService.findUser(authEmail);
      if (existing) {
        alert("Este email já está cadastrado.");
        setIsLoadingAuth(false);
        return;
      }
      const id = crypto.randomUUID();
      const newUser = { id, name: authName, email: authEmail, password: authPassword };
      const success = await syncService.saveUser(newUser);
      if (success) {
        const u = { id: newUser.id, name: newUser.name, email: newUser.email };
        localStorage.setItem('neuro-session', JSON.stringify(u));
        setCurrentUser(u);
      } else {
        alert("Erro ao criar conta.");
      }
    } catch (e) {
      alert("Erro ao conectar ao serviço de sincronização.");
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const addTask = (text: string, p: Priority = Priority.Q2, energy: Task['energy'] = captureEnergy) => {
    if (!text.trim()) return;
    const t: Task = {
      id: crypto.randomUUID(),
      text, priority: p, energy, capacityNeeded: currentArousal,
      completed: false, subtasks: [], date: selectedDate, createdAt: Date.now()
    };
    setTasks(prev => [...prev, t]);
  };

  const handleAutoCategorize = async () => {
    if (dayTasks.length === 0) return;
    setIsOptimizing(true);
    try {
      const results = await geminiService.categorizeTasks(dayTasks);
      setTasks(prev => prev.map(t => {
        const suggestion = results.find(r => r.id === t.id);
        if (suggestion) {
          return { ...t, priority: suggestion.priority, energy: suggestion.energy };
        }
        return t;
      }));
    } catch (e) {
      console.error("Erro na otimização:", e);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitForm.text.trim()) return;
    const h: Habit = {
      id: crypto.randomUUID(),
      text: habitForm.text,
      anchor: habitForm.anchor || 'Momento âncora',
      tinyAction: habitForm.tinyAction || 'Micro-ação',
      streak: 0,
      lastCompleted: null
    };
    setHabits(prev => [...prev, h]);
    setHabitForm({ text: '', anchor: '', tinyAction: '' });
    setShowHabitForm(false);
  };

  const handleAddRecurring = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recurringForm.text.trim()) return;
    const rt: RecurringTask = {
      id: crypto.randomUUID(),
      text: recurringForm.text,
      frequency: recurringForm.frequency,
      priority: Priority.Q2,
      energy: recurringForm.energy,
      completedDates: []
    };
    setRecurringTasks(prev => [...prev, rt]);
    setRecurringForm({ text: '', frequency: Frequency.DAILY, energy: 'Baixa' });
    setShowRecurringForm(false);
  };

  const toggleRecurringTask = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    setRecurringTasks(prev => prev.map(rt => {
      if (rt.id === id) {
        const alreadyDone = isRecurringDoneToday(rt);
        if (!alreadyDone) {
          setPoints(p => p + 15);
          playAudio(SOUNDS.TASK_COMPLETE);
          return { ...rt, completedDates: [...rt.completedDates, today] };
        } else {
          return { ...rt, completedDates: rt.completedDates.filter(d => d !== today) };
        }
      }
      return rt;
    }));
  };

  const isRecurringDoneToday = (rt: RecurringTask) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    if (rt.frequency === Frequency.DAILY) {
      return rt.completedDates.includes(todayStr);
    }
    
    // Para frequências maiores, verificamos se a última data de conclusão pertence ao período atual
    const lastDateStr = rt.completedDates[rt.completedDates.length - 1];
    if (!lastDateStr) return false;
    
    const lastDate = new Date(lastDateStr);
    
    if (rt.frequency === Frequency.WEEKLY) {
      const diff = today.getTime() - lastDate.getTime();
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      return diff < oneWeek && getWeekNumber(today) === getWeekNumber(lastDate);
    }
    
    if (rt.frequency === Frequency.MONTHLY) {
      return today.getMonth() === lastDate.getMonth() && today.getFullYear() === lastDate.getFullYear();
    }
    
    if (rt.frequency === Frequency.ANNUALLY) {
      return today.getFullYear() === lastDate.getFullYear();
    }
    
    return false;
  };

  const getWeekNumber = (d: Date) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
  };

  const deleteHabit = (id: string) => {
    if(confirm("Deseja remover este hábito?")) {
      setHabits(prev => prev.filter(h => h.id !== id));
    }
  };

  const deleteRecurring = (id: string) => {
    if(confirm("Deseja remover esta rotina?")) {
      setRecurringTasks(prev => prev.filter(rt => rt.id !== id));
    }
  };

  const completeHabit = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    setHabits(prev => prev.map(h => {
      if (h.id === id && h.lastCompleted !== today) {
        setPoints(p => p + 50);
        playAudio(SOUNDS.HABIT_COMPLETE);
        return { ...h, streak: h.streak + 1, lastCompleted: today };
      }
      return h;
    }));
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

  const handleTaskDrop = (taskId: string, newPriority: Priority) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, priority: newPriority } : t));
  };

  const handleDecompose = async (task: Task) => {
    setIsDecomposing(true);
    try {
      const steps = await geminiService.decomposeTask(task.text);
      setTasks(ts => ts.map(t => t.id === task.id ? { ...t, subtasks: steps } : t));
    } finally { setIsDecomposing(false); }
  };

  const handleDopamenuAction = (label: string) => {
    setPoints(p => p + 10);
    playAudio(SOUNDS.XP_GAIN);
    alert(`Recompensa "${label}" registrada! +10 XP.`);
  };

  const addDopamenuItem = (category: DopamenuItem['category']) => {
    const label = prompt(`O que adicionar em ${category}?`);
    const description = prompt(`Breve descrição da recompensa:`);
    if (label && description) {
      setDopamenuItems(prev => [...prev, { category, label, description }]);
    }
  };

  const removeDopamenuItem = (label: string) => {
    if (confirm(`Remover "${label}" do menu?`)) {
      setDopamenuItems(prev => prev.filter(i => i.label !== label));
    }
  };

  // Memoized Filters
  const dayTasks = useMemo(() => tasks.filter(t => t.date === selectedDate), [tasks, selectedDate]);
  const filteredTasks = useMemo(() => {
    return dayTasks.filter(t => {
      if (currentArousal === 'Exausto') return t.energy === 'Baixa';
      if (currentArousal === 'Hiperfocado') return true;
      return t.energy !== 'Alta';
    });
  }, [dayTasks, currentArousal]);

  const isDark = theme === 'dark';

  const tutorialSteps = [
    { title: "NeuroExecutor", description: "Sua prótese para o córtex pré-frontal. Gerencie energia e supere bloqueios.", icon: <SynapseLogo className="w-16 h-16" />, color: "text-orange-600" },
    { title: "Foco (90 min)", description: "Ciclos ultradianos para máxima eficiência sem fadiga.", icon: <Timer size={48} />, color: "text-blue-500", target: "execute" },
    { title: "Matriz Eisenhower", description: "Arraste e solte tarefas ou use o botão 'Focar' para priorizar seu fluxo.", icon: <LayoutGrid size={48} />, color: "text-purple-500", target: "plan" },
    { title: "Otimização IA", description: "Deixe nossa IA categorizar sua energia e prioridades automaticamente.", icon: <Brain size={48} />, color: "text-blue-400" },
    { title: "Dieta de Dopamina", description: "Recompensas saudáveis para manter o motor mental girando.", icon: <Coffee size={48} />, color: "text-orange-500", target: "dopamenu" },
    { title: "Andaimação Neural", description: "Construa hábitos sólidos usando âncoras e micro-ações.", icon: <RefreshCw size={48} />, color: "text-green-500", target: "habits" },
    { title: "Resgate Neural com IA", description: "Se travar, nosso protocolo de IA ajuda a desmembrar a tarefa.", icon: <AlertTriangle size={48} />, color: "text-red-500" }
  ];

  const planTutorialSteps = [
    { 
      title: "Dominando a Matriz", 
      description: "Esta é a Matriz de Eisenhower. Ela separa o que é importante do que é apenas urgente, reduzindo o estresse de decisão do seu cérebro.",
      icon: <LayoutGrid size={40} className="text-purple-500" />
    },
    { 
      title: "Arraste e Solte", 
      description: "Sua mente muda, e sua prioridade também. Arraste qualquer tarefa entre os quadrantes para redefinir sua estratégia visualmente.",
      icon: <Move size={40} className="text-blue-500" />
    },
    { 
      title: "Mira no Alvo", 
      description: "Viu o botão de alvo? Ao clicar nele, você define essa tarefa como o foco imediato. Menos hesitação, mais execução.",
      icon: <Target size={40} className="text-orange-500" />
    },
    { 
      title: "Energia Neural", 
      description: "Toda tarefa consome glicose. Categorize-as por energia para saber o que fazer quando estiver exausto ou no pico de foco.",
      icon: <Zap size={40} className="text-yellow-500" />
    }
  ];

  const handleTutorialNext = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(prev => prev + 1);
      const target = tutorialSteps[tutorialStep + 1].target;
      if (target) setActiveTab(target as any);
    } else {
      setShowTutorial(false);
      if (currentUser) localStorage.setItem(`neuro-tutorial-${currentUser.id}`, 'true');
    }
  };

  const handlePlanTutorialNext = () => {
    if (planTutorialStep < planTutorialSteps.length - 1) {
      setPlanTutorialStep(prev => prev + 1);
    } else {
      setShowPlanTutorial(false);
      if (currentUser) localStorage.setItem(`neuro-plan-tutorial-${currentUser.id}`, 'true');
    }
  };

  if (!currentUser) return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${isDark ? 'bg-[#020617]' : 'bg-slate-50'}`}>
      <div className={`w-full max-w-md p-10 rounded-[48px] border shadow-2xl ${isDark ? 'bg-[#0a1128] border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-col items-center mb-10">
          <SynapseLogo className="w-16 h-16 mb-4" />
          <h1 className="text-3xl font-black italic tracking-tighter text-orange-600 uppercase">NeuroExecutor</h1>
        </div>
        <form onSubmit={isRegistering ? (e) => { e.preventDefault(); handleRegister(); } : handleLogin} className="space-y-4">
          {isRegistering && <input required className="w-full py-4 px-6 rounded-2xl border bg-transparent" placeholder="Seu Nome" value={authName} onChange={e => setAuthName(e.target.value)} />}
          <input required type="email" className="w-full py-4 px-6 rounded-2xl border bg-transparent" placeholder="Email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
          <input required type="password" className="w-full py-4 px-6 rounded-2xl border bg-transparent" placeholder="Senha" value={authPassword} onChange={e => setAuthPassword(e.target.value)} />
          <button type="submit" className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-orange-500 transition-all shadow-glow-orange">
            {isLoadingAuth ? "Processando..." : (isRegistering ? "Criar Minha Rede" : "Entrar no Fluxo")}
          </button>
        </form>
        <button onClick={() => setIsRegistering(!isRegistering)} className="w-full mt-6 text-xs font-bold text-slate-500 uppercase">
          {isRegistering ? "Já sou membro" : "Não tenho conta ainda"}
        </button>
        <button onClick={() => setCurrentUser({ id: 'guest', name: 'Visitante', email: 'guest@neuro.com' })} className="w-full mt-2 text-xs font-bold text-slate-500 uppercase underline opacity-60">Entrar como Visitante</button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-500 ${isDark ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar */}
      <nav className={`fixed bottom-0 w-full backdrop-blur-xl border-t md:static md:w-72 md:h-screen md:border-r z-50 flex md:flex-col ${isDark ? 'bg-[#0a1128]/95 border-slate-800' : 'bg-white/95 border-slate-200'}`}>
        <div className="hidden md:flex flex-col p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"><SynapseLogo /><h1 className="text-xl font-black italic text-orange-600">EXECUTE</h1></div>
            <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors">
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
          
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Capacidade Neural</p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentArousal('Exausto')} className={`flex-1 p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${currentArousal === 'Exausto' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'border-slate-800 opacity-40'}`}>
                <BatteryLow size={16}/><span className="text-[8px] font-black">EXAUSTO</span>
              </button>
              <button onClick={() => setCurrentArousal('Neutro')} className={`flex-1 p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${currentArousal === 'Neutro' ? 'bg-orange-600/20 border-orange-500 text-orange-400' : 'border-slate-800 opacity-40'}`}>
                <BatteryMedium size={16}/><span className="text-[8px] font-black">NEUTRO</span>
              </button>
              <button onClick={() => setCurrentArousal('Hiperfocado')} className={`flex-1 p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${currentArousal === 'Hiperfocado' ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'border-slate-800 opacity-40'}`}>
                <BatteryFull size={16}/><span className="text-[8px] font-black">PICO</span>
              </button>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
             <div><p className="text-[10px] font-black text-slate-500">XP</p><p className="text-2xl font-black text-orange-500">{points}</p></div>
             <Trophy className="text-orange-500 opacity-40" />
          </div>
        </div>

        <div className="flex flex-1 justify-around p-2 md:flex-col md:gap-2 md:px-4 md:justify-start">
          <NavButton icon={<Timer />} label="Focar" active={activeTab === 'execute'} onClick={() => setActiveTab('execute')} />
          <NavButton icon={<LayoutGrid />} label="Matriz" active={activeTab === 'plan'} onClick={() => setActiveTab('plan')} />
          <NavButton icon={<RefreshCw />} label="Hábitos" active={activeTab === 'habits'} onClick={() => setActiveTab('habits')} />
          <NavButton icon={<Coffee />} label="Dopamenu" active={activeTab === 'dopamenu'} onClick={() => setActiveTab('dopamenu')} />
          <NavButton icon={<ListTodo />} label="Captura" active={activeTab === 'capture'} onClick={() => setActiveTab('capture')} />
        </div>

        <div className="hidden md:flex flex-col gap-2 p-4 mt-auto border-t border-slate-800/50">
           <div className="px-4 py-2 flex items-center justify-between text-[10px] font-black text-slate-500 uppercase">
              {syncStatus === 'synced' ? <span className="flex items-center gap-1 text-green-500"><CloudCheck size={14}/> Nuvem</span> : <span className="flex items-center gap-1 text-orange-500"><RefreshCw size={14} className="animate-spin"/> Sync</span>}
           </div>
          <button onClick={() => { localStorage.removeItem('neuro-session'); setCurrentUser(null); }} className="flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-xs text-red-500 hover:bg-red-500/10"> <LogOut size={18}/> Sair </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-8 p-4 md:p-10">
        <div className="max-w-5xl mx-auto space-y-10">
          
          {activeTab === 'execute' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-700">
              <div className="lg:col-span-2 space-y-8">
                {/* Timer Section */}
                <div className="p-12 text-center border rounded-[48px] bg-slate-900/60 border-slate-800 relative overflow-hidden shadow-2xl">
                  {isBodyDoubling && <div className="absolute inset-0 bg-orange-600/5 animate-pulse pointer-events-none" />}
                  <span className="text-[10px] font-black text-slate-500 tracking-[0.3em] uppercase mb-4 block">Fluxo Ultradiano</span>
                  <h2 className="text-[100px] leading-none font-mono font-black tracking-tighter tabular-nums mb-8">{formatTime(timeLeft)}</h2>
                  <div className="flex justify-center gap-6">
                    <button onClick={toggleTimer} className="w-20 h-20 bg-orange-600 rounded-[32px] text-white shadow-glow-orange flex items-center justify-center hover:bg-orange-500 transition-all">
                      {isTimerActive ? <Pause size={32}/> : <Play size={32} fill="currentColor"/>}
                    </button>
                    <button onClick={() => setTimeLeft(90*60)} className="w-20 h-20 bg-slate-800 rounded-[32px] text-slate-400 flex items-center justify-center"> <RotateCcw size={32}/> </button>
                  </div>
                </div>

                {/* Active Task Card */}
                <div className="p-10 border rounded-[48px] bg-slate-900/60 border-slate-800 min-h-[350px] shadow-xl">
                  {selectedTask ? (
                    <div className="space-y-8">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                           <h2 className={`text-4xl font-black ${selectedTask.completed ? 'line-through opacity-20' : ''}`}>{selectedTask.text}</h2>
                           <div className="flex gap-2">
                              <span className="px-3 py-1 bg-orange-600/20 text-orange-500 rounded-full text-[8px] font-black uppercase">{selectedTask.priority}</span>
                              <EnergyBadge energy={selectedTask.energy} />
                           </div>
                        </div>
                        <button onClick={() => setPanicTask(selectedTask)} className="p-5 bg-red-600/10 text-red-500 rounded-[28px] hover:bg-red-600 hover:text-white transition-all"> <AlertTriangle size={28}/> </button>
                      </div>
                      
                      <div className="space-y-4">
                        {selectedTask.subtasks.map((s, i) => (
                          <div key={i} className="p-5 bg-slate-800/30 rounded-3xl flex items-center gap-5 border border-slate-700/50 group">
                            <span className="text-[10px] font-black text-orange-500 w-6 h-6 flex items-center justify-center bg-orange-500/10 rounded-full">{i+1}</span>
                            <p className="text-sm font-medium opacity-80">{s}</p>
                          </div>
                        ))}
                        {selectedTask.subtasks.length === 0 && (
                          <button onClick={() => handleDecompose(selectedTask)} className="w-full py-16 border-2 border-dashed border-slate-800 rounded-[32px] flex flex-col items-center gap-3 opacity-40 hover:opacity-100 transition-all group">
                            {isDecomposing ? <RefreshCw className="animate-spin text-orange-500" /> : <Sparkles />}
                            <span className="text-[10px] font-black uppercase">Desmembrar com IA (Chunking)</span>
                          </button>
                        )}
                      </div>
                      <button onClick={() => toggleTask(selectedTask.id)} className={`w-full py-6 rounded-3xl font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 ${selectedTask.completed ? 'bg-green-600' : 'bg-orange-600'} text-white`}>
                        {selectedTask.completed ? "Reativar" : "Concluir Missão (+25 XP)"}
                      </button>
                    </div>
                  ) : (
                    <div className="py-24 text-center opacity-10 flex flex-col items-center gap-4">
                       <Target size={80}/>
                       <p className="text-xl font-black uppercase">Defina seu alvo</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Today's Sidebar */}
              <div className="space-y-6">
                <div className="p-8 border rounded-[40px] bg-slate-900/60 border-slate-800 shadow-lg">
                   <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-6">Execução Pendente</h3>
                   <div className="space-y-3">
                      {filteredTasks.filter(t => !t.completed).map(t => (
                        <button key={t.id} onClick={() => setSelectedTask(t)} className={`w-full p-5 text-left border rounded-[24px] transition-all group ${selectedTask?.id === t.id ? 'bg-orange-600/10 border-orange-500 ring-1 ring-orange-500' : 'border-slate-800 bg-slate-800/20 hover:bg-slate-800/40'}`}>
                           <p className="text-sm font-bold truncate group-hover:translate-x-1 transition-transform">{t.text}</p>
                        </button>
                      ))}
                      {filteredTasks.filter(t => !t.completed).length === 0 && (
                        <div className="py-12 text-center italic text-slate-700 text-xs">Sem tarefas críticas.</div>
                      )}
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'plan' && (
            <div className="space-y-6 relative">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 gap-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-black italic uppercase">Matriz de Eisenhower</h2>
                  <button onClick={() => { setPlanTutorialStep(0); setShowPlanTutorial(true); }} className="p-2 text-slate-600 hover:text-orange-500 transition-colors" title="Ajuda">
                    <HelpCircle size={20} />
                  </button>
                </div>
                <button 
                  onClick={handleAutoCategorize}
                  disabled={isOptimizing || dayTasks.length === 0}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl disabled:opacity-50 w-full sm:w-auto"
                >
                  {isOptimizing ? <RefreshCw size={14} className="animate-spin"/> : <Brain size={14}/>}
                  Otimização Neural (IA)
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom duration-700">
                <MatrixQuadrant priority={Priority.Q1} title="Q1: Crítico e Urgente" color="bg-red-600/5 border-red-500/20" tasks={dayTasks.filter(t => t.priority === Priority.Q1 && !t.completed)} onSelect={(t) => { setSelectedTask(t); setActiveTab('execute'); }} onDrop={handleTaskDrop} />
                <MatrixQuadrant priority={Priority.Q2} title="Q2: Estratégico/Importante" color="bg-orange-600/5 border-orange-500/20" tasks={dayTasks.filter(t => t.priority === Priority.Q2 && !t.completed)} onSelect={(t) => { setSelectedTask(t); setActiveTab('execute'); }} onDrop={handleTaskDrop} />
                <MatrixQuadrant priority={Priority.Q3} title="Q3: Delegar/Reduzir" color="bg-blue-600/5 border-blue-500/20" tasks={dayTasks.filter(t => t.priority === Priority.Q3 && !t.completed)} onSelect={(t) => { setSelectedTask(t); setActiveTab('execute'); }} onDrop={handleTaskDrop} />
                <MatrixQuadrant priority={Priority.Q4} title="Q4: Eliminar Distrações" color="bg-slate-800/20 border-slate-700/50" tasks={dayTasks.filter(t => t.priority === Priority.Q4 && !t.completed)} onSelect={(t) => { setSelectedTask(t); setActiveTab('execute'); }} onDrop={handleTaskDrop} />
              </div>

              {/* Plan Tutorial Overlay */}
              {showPlanTutorial && (
                <div className="fixed inset-0 z-[1001] flex items-center justify-center p-6 bg-[#020617]/40 backdrop-blur-sm animate-in fade-in duration-300">
                  <div className="w-full max-w-md bg-[#0a1128] border border-orange-500/30 rounded-[48px] p-10 shadow-3xl transform transition-all scale-100">
                    <div className="flex flex-col items-center text-center space-y-6">
                      <div className="p-5 bg-white/5 rounded-full animate-pulse-orange">
                        {planTutorialSteps[planTutorialStep].icon}
                      </div>
                      <div className="space-y-3">
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-orange-500">{planTutorialSteps[planTutorialStep].title}</h2>
                        <p className="text-slate-400 text-sm leading-relaxed font-medium">{planTutorialSteps[planTutorialStep].description}</p>
                      </div>
                      <div className="flex gap-2 w-full pt-4">
                        <div className="flex-1 flex gap-1 justify-center items-center">
                          {planTutorialSteps.map((_, i) => (
                            <div key={i} className={`h-1 rounded-full transition-all ${i === planTutorialStep ? 'w-6 bg-orange-600' : 'w-2 bg-slate-800'}`} />
                          ))}
                        </div>
                        <button onClick={handlePlanTutorialNext} className="px-8 py-3 bg-orange-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-glow-orange hover:bg-orange-500 transition-all">
                          {planTutorialStep === planTutorialSteps.length - 1 ? "Entendi" : "Próximo"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'habits' && (
            <div className="space-y-12 animate-in slide-in-from-bottom duration-700">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Habits Section */}
                  <div className="space-y-8">
                     <h2 className="text-3xl font-black flex items-center gap-4 italic uppercase text-orange-600"><RefreshCw size={28} /> Hábitos Atômicos</h2>
                     <div className="space-y-4">
                        {habits.map(h => (
                          <div key={h.id} className="p-6 border rounded-[32px] bg-slate-900 border-slate-800 flex justify-between items-center group shadow-md hover:border-orange-500/30 transition-all">
                             <div className="space-y-1">
                                <p className="font-black text-lg">{h.text}</p>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Âncora: {h.anchor}</p>
                             </div>
                             <div className="flex items-center gap-4">
                                <div className="text-center">
                                   <Flame size={20} className={h.streak > 0 ? "text-orange-500" : "text-slate-800"} />
                                   <span className="text-[10px] font-black">{h.streak}</span>
                                </div>
                                <button 
                                  onClick={() => completeHabit(h.id)} 
                                  disabled={h.lastCompleted === new Date().toISOString().split('T')[0]}
                                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${h.lastCompleted === new Date().toISOString().split('T')[0] ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-500 hover:bg-orange-600 hover:text-white'}`}
                                >
                                   {h.lastCompleted === new Date().toISOString().split('T')[0] ? <Check size={24}/> : <Plus size={24}/>}
                                </button>
                                <button onClick={() => deleteHabit(h.id)} className="p-2 text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                             </div>
                          </div>
                        ))}
                        
                        {!showHabitForm ? (
                          <button onClick={() => setShowHabitForm(true)} className="w-full py-8 border-2 border-dashed border-slate-800 rounded-[32px] opacity-40 hover:opacity-100 transition-all flex items-center justify-center gap-2">
                             <Plus size={20}/> Novo Hábito Neural
                          </button>
                        ) : (
                          <form onSubmit={handleAddHabit} className="p-8 border-2 border-orange-500/30 rounded-[32px] bg-slate-900 space-y-4 animate-in zoom-in-95">
                             <input required className="w-full p-4 bg-slate-800 rounded-2xl border-none outline-none text-sm" placeholder="Nome do hábito..." value={habitForm.text} onChange={e => setHabitForm({...habitForm, text: e.target.value})} />
                             <input className="w-full p-4 bg-slate-800 rounded-2xl border-none outline-none text-sm" placeholder="Âncora (Ex: Após o banho)" value={habitForm.anchor} onChange={e => setHabitForm({...habitForm, anchor: e.target.value})} />
                             <input className="w-full p-4 bg-slate-800 rounded-2xl border-none outline-none text-sm" placeholder="Micro-ação (Ex: Meditar 1 min)" value={habitForm.tinyAction} onChange={e => setHabitForm({...habitForm, tinyAction: e.target.value})} />
                             <div className="flex gap-2">
                                <button type="submit" className="flex-1 py-4 bg-orange-600 rounded-2xl font-black text-xs uppercase">Salvar Hábito</button>
                                <button type="button" onClick={() => setShowHabitForm(false)} className="px-6 py-4 bg-slate-800 rounded-2xl font-black text-xs uppercase">X</button>
                             </div>
                          </form>
                        )}
                     </div>
                  </div>

                  {/* Recurring Routines (Tarefas Fixas) */}
                  <div className="space-y-8">
                     <h2 className="text-3xl font-black flex items-center gap-4 italic uppercase text-blue-500"><Repeat size={28} /> Tarefas Fixas</h2>
                     <div className="space-y-10">
                        {/* Grupos por Frequência */}
                        {[Frequency.DAILY, Frequency.WEEKLY, Frequency.MONTHLY, Frequency.ANNUALLY].map(freq => {
                          const tasksOfFreq = recurringTasks.filter(rt => rt.frequency === freq);
                          if (tasksOfFreq.length === 0 && !showRecurringForm) return null;
                          if (tasksOfFreq.length === 0 && showRecurringForm && recurringForm.frequency !== freq) return null;

                          return (
                            <div key={freq} className="space-y-4">
                              <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-800 pb-2">{freq}</h3>
                              <div className="space-y-3">
                                {tasksOfFreq.map(rt => {
                                  const done = isRecurringDoneToday(rt);
                                  return (
                                    <div key={rt.id} className="p-5 border rounded-3xl bg-slate-900 border-slate-800 flex justify-between items-center group hover:border-blue-500/30 transition-all">
                                      <div className="flex items-center gap-4">
                                        <button 
                                          onClick={() => toggleRecurringTask(rt.id)}
                                          className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all ${done ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-800 text-transparent hover:border-blue-500'}`}
                                        >
                                          <Check size={18} />
                                        </button>
                                        <div className="space-y-1">
                                          <p className={`font-black text-base ${done ? 'line-through opacity-40' : ''}`}>{rt.text}</p>
                                          <div className="flex gap-2">
                                            <EnergyBadge energy={rt.energy} />
                                          </div>
                                        </div>
                                      </div>
                                      <button onClick={() => deleteRecurring(rt.id)} className="p-2 text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}

                        {!showRecurringForm ? (
                          <button onClick={() => setShowRecurringForm(true)} className="w-full py-8 border-2 border-dashed border-slate-800 rounded-[32px] opacity-40 hover:opacity-100 transition-all flex items-center justify-center gap-2">
                             <Plus size={20}/> Nova Tarefa Fixa
                          </button>
                        ) : (
                          <form onSubmit={handleAddRecurring} className="p-8 border-2 border-blue-500/30 rounded-[32px] bg-slate-900 space-y-6 animate-in zoom-in-95">
                             <div className="space-y-4">
                               <input required className="w-full p-4 bg-slate-800 rounded-2xl border-none outline-none text-sm" placeholder="O que se repete?" value={recurringForm.text} onChange={e => setRecurringForm({...recurringForm, text: e.target.value})} />
                               
                               <div className="space-y-2">
                                 <p className="text-[10px] font-black uppercase text-slate-500">Frequência</p>
                                 <div className="grid grid-cols-2 gap-2">
                                   {[Frequency.DAILY, Frequency.WEEKLY, Frequency.MONTHLY, Frequency.ANNUALLY].map(f => (
                                     <button key={f} type="button" onClick={() => setRecurringForm({...recurringForm, frequency: f})} className={`p-3 rounded-xl text-[10px] font-black uppercase border transition-all ${recurringForm.frequency === f ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-800 text-slate-500'}`}>
                                       {f}
                                     </button>
                                   ))}
                                 </div>
                               </div>

                               <div className="space-y-2">
                                 <p className="text-[10px] font-black uppercase text-slate-500">Gasto de Energia</p>
                                 <div className="flex gap-2">
                                   {(['Baixa', 'Média', 'Alta'] as Task['energy'][]).map(e => (
                                     <button key={e} type="button" onClick={() => setRecurringForm({...recurringForm, energy: e})} className={`flex-1 p-3 rounded-xl text-[10px] font-black uppercase border transition-all ${recurringForm.energy === e ? 'bg-slate-700 border-slate-600 text-white' : 'border-slate-800 text-slate-500'}`}>
                                       {e}
                                     </button>
                                   ))}
                                 </div>
                               </div>
                             </div>

                             <div className="flex gap-2">
                                <button type="submit" className="flex-1 py-4 bg-blue-600 rounded-2xl font-black text-xs uppercase shadow-glow-blue">Salvar Rotina</button>
                                <button type="button" onClick={() => setShowRecurringForm(false)} className="px-6 py-4 bg-slate-800 rounded-2xl font-black text-xs uppercase">X</button>
                             </div>
                          </form>
                        )}
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'dopamenu' && (
            <div className="space-y-12 animate-in zoom-in-95 duration-700">
               <div className="text-center space-y-3">
                  <h2 className="text-5xl font-black italic tracking-tighter uppercase">Dopamenu</h2>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Gestão de Recompensa Saudável</p>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(['Starter', 'Main', 'Side', 'Dessert'] as const).map(cat => (
                    <div key={cat} className="p-10 border rounded-[56px] bg-slate-900/40 border-slate-800 group relative">
                       <div className="flex items-center justify-between mb-8">
                          <h3 className="text-[10px] font-black uppercase text-orange-500 flex items-center gap-3 tracking-widest">
                             {cat === 'Starter' ? 'Entradas (2-5 min)' : cat === 'Main' ? 'Principais (Recarga)' : cat === 'Side' ? 'Acompanhamentos' : 'Sobremesas (Moderação)'}
                          </h3>
                          <button onClick={() => addDopamenuItem(cat)} className="p-2 bg-white/5 hover:bg-orange-500/20 rounded-full transition-all">
                             <Plus size={16} />
                          </button>
                       </div>
                       <div className="space-y-4">
                          {dopamenuItems.filter(i => i.category === cat).map((item, idx) => (
                            <div key={idx} className="relative group/item">
                              <button 
                                onClick={() => handleDopamenuAction(item.label)}
                                className="w-full p-6 rounded-[32px] bg-slate-900 border border-slate-800 text-left hover:scale-[1.02] active:scale-95 transition-all flex flex-col gap-1 pr-12"
                              >
                                 <p className="text-lg font-black group-hover:text-orange-500">{item.label}</p>
                                 <p className="text-[10px] text-slate-500 uppercase">{item.description}</p>
                              </button>
                              <button onClick={() => removeDopamenuItem(item.label)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-800 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all">
                                 <Trash2 size={16}/>
                              </button>
                            </div>
                          ))}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'capture' && (
            <div className="max-w-3xl mx-auto py-24 space-y-16 text-center animate-in fade-in duration-1000">
               <div className="space-y-4">
                 <h2 className="text-6xl font-black italic tracking-tighter uppercase">Captura Atômica</h2>
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Remova a carga mental agora</p>
               </div>
               
               <div className="space-y-8">
                 <div className="p-10 bg-slate-900 border border-slate-800 rounded-[64px] shadow-2xl flex items-center gap-6 group hover:border-orange-500/50 transition-all">
                    <input autoFocus className="flex-1 bg-transparent border-none text-3xl font-black outline-none placeholder:text-slate-800" placeholder="O que está na mente?" value={newTaskText} onChange={e => setNewTaskText(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { addTask(newTaskText); setNewTaskText(""); setActiveTab('plan'); }}} />
                    <button onClick={() => { addTask(newTaskText); setNewTaskText(""); setActiveTab('plan'); }} className="w-24 h-24 bg-orange-600 rounded-[40px] flex items-center justify-center shadow-glow-orange active:scale-90 transition-all"><Plus size={48} className="text-white"/></button>
                 </div>

                 <div className="flex flex-col items-center gap-4 animate-in slide-in-from-bottom duration-500">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Estimativa de Gasto Energético</p>
                    <div className="flex gap-4 w-full max-w-sm">
                      {(['Baixa', 'Média', 'Alta'] as Task['energy'][]).map(e => (
                        <button key={e} onClick={() => setCaptureEnergy(e)} className={`flex-1 py-4 rounded-3xl text-xs font-black uppercase border-2 transition-all ${captureEnergy === e ? (e === 'Baixa' ? 'bg-green-600 border-green-600' : e === 'Média' ? 'bg-yellow-600 border-yellow-600' : 'bg-red-600 border-red-600') + ' text-white scale-110 shadow-xl' : 'border-slate-800 text-slate-500 hover:border-slate-700'}`}>
                          {e}
                        </button>
                      ))}
                    </div>
                 </div>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Tutorial */}
      {showTutorial && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-[#0a1128] border border-slate-800 rounded-[56px] p-12 shadow-2xl">
            <div className="flex flex-col items-center text-center space-y-8">
              <div className={`${tutorialSteps[tutorialStep].color} p-6 bg-white/5 rounded-[40px]`}>{tutorialSteps[tutorialStep].icon}</div>
              <div className="space-y-4">
                <h2 className="text-3xl font-black italic uppercase">{tutorialSteps[tutorialStep].title}</h2>
                <p className="text-slate-400 leading-relaxed font-medium">{tutorialSteps[tutorialStep].description}</p>
              </div>
              <button onClick={handleTutorialNext} className="w-full py-5 bg-orange-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-glow-orange hover:bg-orange-500 transition-all">
                {tutorialStep === tutorialSteps.length - 1 ? "Entendido" : "Próximo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panic Modal */}
      {panicTask && (
        <div className="fixed inset-0 z-[400] backdrop-blur-3xl flex items-center justify-center p-4 bg-red-950/90">
          <div className="w-full max-w-xl p-12 rounded-[56px] border border-red-500/30 bg-slate-900 shadow-2xl animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-10"><h2 className="text-3xl font-black text-red-500 uppercase tracking-tighter italic flex items-center gap-4"><AlertTriangle size={32}/> Resgate Neural</h2><button onClick={() => { setPanicTask(null); setPanicSolution(null); }}><X /></button></div>
             {!panicSolution ? (
               <div className="space-y-8">
                 <p className="text-lg font-medium opacity-80 leading-relaxed">Qual o bloqueio para <strong>"{panicTask.text}"</strong>?</p>
                 <textarea className="w-full p-8 rounded-[32px] border bg-slate-800/50 border-slate-700 outline-none min-h-[160px] text-xl" value={obstacleInput} onChange={e => setObstacleInput(e.target.value)} />
                 <button onClick={async () => { setIsRescuing(true); const res = await geminiService.rescueTask(panicTask.text, obstacleInput); setPanicSolution(res); setIsRescuing(false); }} className="w-full py-6 bg-red-600 text-white rounded-[32px] font-black uppercase flex items-center justify-center gap-4 transition-all">{isRescuing ? <RefreshCw className="animate-spin" size={24}/> : "Gerar Protocolo"}</button>
               </div>
             ) : (
               <div className="space-y-8">
                 <div className="p-8 bg-red-600/10 border border-red-500/20 rounded-[40px] space-y-2"><p className="text-[10px] font-black text-red-500 uppercase">Diagnóstico</p><p className="text-xl font-bold italic">"{panicSolution.diagnosis}"</p></div>
                 <div className="space-y-4">{panicSolution.steps.map((s, i) => (<div key={i} className="p-6 bg-slate-800 rounded-[32px] flex items-center gap-6 border border-slate-700"><span className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-black">{i+1}</span><p className="text-sm font-medium leading-relaxed">{s}</p></div>))}</div>
                 <button onClick={() => { setPanicTask(null); setPanicSolution(null); }} className="w-full py-6 border-2 border-slate-800 rounded-[32px] font-black uppercase text-xs tracking-widest text-slate-500">Voltar à Ativa</button>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

const NavButton: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center p-4 rounded-[28px] transition-all md:flex-row md:justify-start md:gap-5 md:w-full md:px-8 md:py-5 ${active ? 'bg-orange-600 text-white shadow-2xl scale-[1.05]' : 'text-slate-500 hover:bg-slate-800/50'}`}>
    {icon}<span className="text-[10px] mt-2 font-black uppercase md:text-sm md:mt-0 md:tracking-widest">{label}</span>
  </button>
);

const EnergyBadge: React.FC<{ energy: Task['energy'] }> = ({ energy }) => {
  const colors = {
    'Baixa': 'bg-green-600/20 text-green-500',
    'Média': 'bg-yellow-600/20 text-yellow-500',
    'Alta': 'bg-red-600/20 text-red-500'
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${colors[energy]}`}>
      {energy} Energia
    </span>
  );
};

const MatrixQuadrant: React.FC<{ priority: Priority, title: string, color: string, tasks: Task[], onSelect: (t: Task) => void, onDrop: (taskId: string, newPriority: Priority) => void }> = ({ priority, title, color, tasks, onSelect, onDrop }) => {
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-orange-500', 'bg-orange-500/10'); };
  const handleDragLeave = (e: React.DragEvent) => { e.currentTarget.classList.remove('ring-2', 'ring-orange-500', 'bg-orange-500/10'); };
  const handleOnDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('ring-2', 'ring-orange-500', 'bg-orange-500/10');
    const taskId = e.dataTransfer.getData("taskId");
    if(taskId) onDrop(taskId, priority);
  };

  return (
    <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleOnDrop} className={`p-10 border rounded-[48px] ${color} min-h-[420px] shadow-sm transition-all duration-200 relative`}>
      <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-500 mb-8">{title}</h3>
      <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2 scrollbar-thin">
        {tasks.map(t => (
          <div key={t.id} draggable onDragStart={(e) => e.dataTransfer.setData("taskId", t.id)} className="w-full p-6 text-left bg-slate-900 border border-slate-800 rounded-3xl flex justify-between items-center hover:border-orange-500/50 transition-all cursor-grab active:cursor-grabbing shadow-sm group">
            <div className="flex flex-col gap-2 flex-1">
              <span onClick={() => onSelect(t)} className="text-sm font-black truncate opacity-80">{t.text}</span>
              <div className="flex gap-2">
                <EnergyBadge energy={t.energy} />
              </div>
            </div>
            <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
               <button 
                onClick={() => onSelect(t)}
                title="Focar nesta tarefa"
                className="w-10 h-10 flex items-center justify-center bg-orange-600/10 hover:bg-orange-600 text-orange-500 hover:text-white rounded-2xl transition-all shadow-lg active:scale-90"
               >
                 <Target size={20} />
               </button>
               <GripVertical size={16} className="text-slate-700" />
            </div>
          </div>
        ))}
        {tasks.length === 0 && <div className="py-16 text-center opacity-10 font-black text-xs uppercase italic tracking-widest border-2 border-dashed border-slate-800 rounded-[32px]">Deposite Tarefas</div>}
      </div>
    </div>
  );
};

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default App;
