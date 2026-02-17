
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
  Loader, RefreshCcw, Info as InfoIcon
} from 'lucide-react';
import { Priority, Task, Habit, RecurringTask, Frequency, BrainCapacity, DopamenuItem, DayPeriod, Upgrade, Achievement, PanicSolution, TimeboxEntry } from './types';
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

const TUTORIAL_DATA: Record<string, { title: string, steps: { target: string, text: string, concept: string }[] }> = {
  capture: {
    title: "Sincronismo de Captura",
    steps: [
      { target: "input", text: "Escreva qualquer pensamento aqui. Não se preocupe com a organização ainda.", concept: "Externalização RAM: Tirar a ideia da cabeça libera recursos do córtex pré-frontal para o processamento, não apenas para o armazenamento." },
      { target: "ia-refinement", text: "Nossa IA processará sua intenção e definirá automaticamente a prioridade e os passos iniciais.", concept: "Andaimação Neural: Reduzimos a 'fricção de início' ao decompor objetivos vagos em ações concretas." }
    ]
  },
  execute: {
    title: "Estado de Fluxo",
    steps: [
      { target: "timer", text: "Trabalhe em blocos de 90 minutos para respeitar seus Ciclos Ultradianos.", concept: "Ritmo Ultradiano: O cérebro opera em ciclos de alta performance de ~90 min seguidos de 15-20 min de fadiga." },
      { target: "timebox", text: "Planeje seu dia em blocos de tempo para evitar o cansaço da decisão contínua.", concept: "Timeboxing: Alocar períodos específicos para tarefas reduz a carga cognitiva de 'o que fazer agora'." },
      { target: "energy-match", text: "O sistema destaca tarefas que combinam com seu nível de energia atual.", concept: "Gestão de Bio-Energia: Executar tarefas de alta carga com baixa energia causa 'burnout' cognitivo precoce." },
      { target: "rescue", text: "Se sentir paralisia, use o Protocolo de Resgate IA.", concept: "Inibição de Resposta: A paralisia geralmente é uma sobrecarga de amígdala. A IA atua como um lobo frontal externo." }
    ]
  },
  plan: {
    title: "Arquitetura de Decisão",
    steps: [
      { target: "matrix", text: "Organize visualmente o que é Importante vs Urgente.", concept: "Matriz de Eisenhower: Focar no Quadrante 2 (Importante/Não Urgente) reduz o cortisol a longo prazo." },
      { target: "drag-drop", text: "Arraste para redefinir prioridades conforme sua clareza mental muda.", concept: "Flexibilidade Cognitiva: A capacidade de reajustar planos é uma função executiva vital." }
    ]
  },
  habits: {
    title: "Mielinização Profunda",
    steps: [
      { target: "identity", text: "Defina quem você quer SER, não apenas o que quer FAZER.", concept: "Hábitos de Identidade: A mudança de hábito mais forte ocorre quando ela se torna parte do seu autoconceito." },
      { target: "anchor", text: "Use uma âncora: algo que você já faz para 'pendurar' o novo hábito.", concept: "Encadeamento de Hábitos: Utiliza caminhos neurais já estabelecidos para facilitar a nova automação." }
    ]
  },
  fixed: {
    title: "Bio-Ciclos",
    steps: [
      { target: "circadian", text: "Sincronize rotinas com os períodos do dia e frequências específicas.", concept: "Ritmo Circadiano: Seu cérebro produz diferentes neuroquímicos (cortisol/melatonina) baseados na luz e horário. Tarefas recorrentes reforçam a estrutura do dia." }
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
  const [rescueProtocol, setRescueProtocol] = useState<PanicSolution | null>(null);
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const editingTask = useMemo(() => tasks.find(t => t.id === editingTaskId) || null, [tasks, editingTaskId]);
  const timerRef = useRef<number | null>(null);
  const syncTimeoutRef = useRef<number | null>(null);
  const energyRank = { 'Baixa': 1, 'Média': 2, 'Alta': 3 };

  const playAudio = useCallback((url: string) => {
    new Audio(url).play().catch(() => {});
  }, []);

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
    const email = (e.target as any).email.value;
    if (!email) return;
    setUserEmail(email);
    localStorage.setItem('neuro-user-email', email);
    setSyncStatus('syncing');
    const remote = await syncService.pullData(email);
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
  }, [isTimerActive]);

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

  const handleRescue = async () => {
    const activeTask = tasks.find(t => !t.completed && isTaskCompatible(t));
    if (!activeTask) return;
    try {
      const rescue = await geminiService.rescueTask(activeTask.text, "Paralisia de baixa energia ou sobrecarga cognitiva");
      setRescueProtocol(rescue);
    } catch (e) {}
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

  // Timebox Handlers
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

  return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-[#020617] text-white transition-all duration-700 ${visualTheme} ${!isDarkMode ? 'light-mode' : ''}`}>
      
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-72 h-screen border-r border-slate-800 bg-[#0a1128]/95 p-8 space-y-6 z-50 overflow-y-auto no-scrollbar">
        <div className="flex items-center gap-3"><SynapseLogo /><h1 className="text-xl font-black italic text-orange-600 uppercase">Neuro</h1></div>
        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-3xl space-y-3 relative group">
           <div className="flex justify-between items-center">
              <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Neuro-Identity</p>
              <div className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-green-500 shadow-glow-green' : syncStatus === 'syncing' ? 'bg-orange-500 animate-pulse' : syncStatus === 'error' ? 'bg-red-500' : 'bg-slate-700'}`}></div>
           </div>
           {userEmail ? (
             <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold truncate text-slate-300">{userEmail}</span>
                <button onClick={() => { setUserEmail(''); localStorage.removeItem('neuro-user-email'); }} className="text-[8px] font-black uppercase text-red-500/60 hover:text-red-500 transition-colors">Sair / Desconectar</button>
             </div>
           ) : (
             <form onSubmit={handleLogin} className="flex flex-col gap-2">
                <input name="email" type="email" placeholder="Seu e-mail..." className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-[10px] outline-none focus:border-orange-500 transition-all" required />
                <button type="submit" className="w-full py-2 bg-orange-600 rounded-xl text-[9px] font-black uppercase shadow-glow-orange hover:scale-105 active:scale-95 transition-all">Sincronizar Cloud</button>
             </form>
           )}
        </div>
        <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-3xl space-y-3">
          <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest text-center">Bateria Biológica</p>
          <div className="flex justify-between items-center gap-2">
            {[
              { val: 'Baixa', color: 'text-red-500', icon: <BatteryLow size={18}/> },
              { val: 'Média', color: 'text-yellow-500', icon: <BatteryMedium size={18}/> },
              { val: 'Alta', color: 'text-green-500', icon: <BatteryFull size={18}/> }
            ].map(e => (
              <button key={e.val} onClick={() => setUserEnergy(e.val as any)} className={`flex-1 flex flex-col items-center p-2 rounded-xl transition-all ${userEnergy === e.val ? 'bg-slate-800 shadow-glow-orange scale-110' : 'opacity-40 hover:opacity-60'}`}>
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
          <button onClick={() => setTutorialStep(0)} className="fixed top-6 right-6 z-40 w-12 h-12 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-orange-500 hover:scale-110 active:scale-95 transition-all shadow-glow-orange/20">
            <HelpCircle size={24}/>
          </button>
        )}

        <div className="max-w-6xl mx-auto space-y-10">
          {activeTab === 'capture' && (
            <div className="min-h-[80vh] flex flex-col justify-center animate-in fade-in zoom-in-95">
              <div className="text-center space-y-4 mb-12">
                <div className="w-20 h-20 bg-orange-600/10 rounded-full flex items-center justify-center mx-auto border border-orange-600/20 shadow-glow-orange"><BrainIcon className="text-orange-500" size={32}/></div>
                <h2 className="text-5xl font-black uppercase italic tracking-tighter">Entrada Neural</h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Esvazie sua mente instantaneamente.</p>
              </div>
              <form onSubmit={handleSmartCapture} className="relative group max-w-2xl mx-auto w-full">
                <div className="p-8 rounded-[48px] border-4 transition-all duration-500 bg-[#0a1128] border-slate-800 focus-within:border-orange-600 shadow-glow-orange/20">
                  <div className="flex items-center gap-4">
                    <input autoFocus value={newTaskText} onChange={e => setNewTaskText(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-3xl font-black" placeholder="No que você está pensando?" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSmartCapture(e); }} />
                    <button type="submit" className="w-16 h-16 bg-orange-600 rounded-3xl flex items-center justify-center shadow-glow-orange hover:scale-110 active:scale-95 transition-all"><Plus size={32}/></button>
                  </div>
                </div>
              </form>
              <div className="max-w-xl mx-auto w-full mt-10 space-y-3">
                {tasks.slice(0, 3).map(t => (
                  <div key={t.id} className={`p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-between animate-in slide-in-from-top-4 ${t.isRefining ? 'border-orange-500/50 shadow-glow-orange/10 italic opacity-70' : ''}`}>
                    <div className="flex items-center gap-3">
                      {t.isRefining ? <Loader2 className="animate-spin text-orange-500" size={16}/> : <CheckCircle2 className="text-slate-600" size={16}/>}
                      <span className="text-xs font-bold uppercase tracking-tight">{t.text}</span>
                    </div>
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
                  <div className="p-10 bg-slate-900 rounded-[64px] border border-slate-800 flex flex-col items-center justify-center space-y-8 relative overflow-hidden group min-h-[400px]">
                    <div className="text-9xl font-black italic tracking-tighter tabular-nums text-white drop-shadow-2xl">{formatTime(timeLeft)}</div>
                    <div className="flex gap-4">
                      <button onClick={() => setIsTimerActive(!isTimerActive)} className="px-10 py-5 bg-white text-black rounded-3xl font-black uppercase flex items-center gap-3 hover:scale-105 active:scale-95 transition-all">{isTimerActive ? <><Pause size={20}/> Pausar</> : <><Play size={20}/> Fluxo</>}</button>
                      <button onClick={() => setTimeLeft(90*60)} className="p-5 bg-slate-800 rounded-3xl hover:bg-slate-700 transition-colors"><RotateCcw size={20}/></button>
                    </div>
                  </div>

                  <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-[48px] space-y-6">
                    <div className="flex justify-between items-center">
                       <div className="flex items-center gap-3">
                          <Clock className="text-orange-500" size={20}/>
                          <h3 className="text-xl font-black uppercase italic tracking-tighter">Timebox Diário</h3>
                       </div>
                       <button onClick={addTimeboxSlot} className="p-2 bg-orange-600/10 text-orange-500 rounded-xl hover:bg-orange-600 hover:text-white transition-all"><Plus size={18}/></button>
                    </div>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
                       {timebox.length === 0 ? (
                         <p className="text-center py-10 text-[10px] font-black uppercase text-slate-600 border border-dashed border-slate-800 rounded-3xl">Nenhum bloco de tempo definido para hoje.</p>
                       ) : (
                         timebox.map((entry) => (
                           <div key={entry.id} className={`group flex items-center gap-4 p-4 rounded-3xl border transition-all ${entry.completed ? 'bg-slate-950/50 border-slate-900 opacity-50' : 'bg-[#0a1128] border-slate-800 shadow-glow-orange/5 hover:border-orange-500/30'}`}>
                              <div className="flex flex-col gap-1 w-20">
                                 <input type="text" value={entry.start} onChange={e => updateTimeboxEntry(entry.id, { start: e.target.value })} className="bg-transparent text-[10px] font-black text-slate-500 outline-none w-full text-center hover:text-orange-500 transition-colors"/>
                                 <div className="h-px bg-slate-800 w-full"/>
                                 <input type="text" value={entry.end} onChange={e => updateTimeboxEntry(entry.id, { end: e.target.value })} className="bg-transparent text-[10px] font-black text-slate-500 outline-none w-full text-center hover:text-orange-500 transition-colors"/>
                              </div>
                              <input 
                                type="text" 
                                value={entry.activity} 
                                onChange={e => updateTimeboxEntry(entry.id, { activity: e.target.value })} 
                                placeholder="Descreva a atividade..."
                                className={`flex-1 bg-transparent font-bold text-sm outline-none ${entry.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}
                              />
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => updateTimeboxEntry(entry.id, { completed: !entry.completed })} className={`p-2 rounded-lg transition-all ${entry.completed ? 'text-green-500 bg-green-500/10' : 'text-slate-500 hover:text-green-500 hover:bg-green-500/10'}`}><Check size={16}/></button>
                                <button onClick={() => removeTimeboxEntry(entry.id)} className="p-2 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-500/10"><Trash2 size={16}/></button>
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
                      <div className="p-8 bg-orange-600 rounded-[48px] shadow-glow-orange flex flex-col justify-between">
                         <div className="space-y-2">
                           <span className="text-[10px] font-black uppercase text-white/60">Bio-Compatível Agora</span>
                           <h4 className="text-2xl font-black uppercase leading-tight">{recommended.text}</h4>
                         </div>
                         <button onClick={handleRescue} className="mt-8 flex items-center gap-3 py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase border border-white/20 transition-all">
                            <LifeBuoy size={16} className="ml-4"/> Protocolo IA de Resgate
                         </button>
                      </div>
                    ) : (
                      <div className="p-8 bg-slate-900/50 border border-slate-800 border-dashed rounded-[48px] flex flex-col items-center justify-center text-center space-y-4">
                         <ZapOff className="text-slate-700" size={48}/>
                         <p className="text-[10px] font-black uppercase text-slate-500">Nenhuma tarefa pronta para sua energia {userEnergy}</p>
                      </div>
                    );
                  })()}

                  <div className="space-y-4">
                     <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2">Fila Bio-Compatível</h3>
                     <div className="space-y-3">
                       {tasks.filter(t => !t.completed && isTaskCompatible(t)).slice(0, 5).map(t => (
                         <div key={t.id} className="p-4 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-between">
                            <span className="text-xs font-bold uppercase truncate pr-4">{t.text}</span>
                            <button onClick={() => completeTask(t.id)} className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-orange-600 transition-all"><Check size={14}/></button>
                         </div>
                       ))}
                     </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'plan' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
              {[
                { q: Priority.Q1, label: 'Crise & Foco', color: 'border-red-500/30 bg-red-500/5' },
                { q: Priority.Q2, label: 'Estratégico', color: 'border-orange-500/30 bg-orange-500/5' },
                { q: Priority.Q3, label: 'Interrupções', color: 'border-blue-500/30 bg-blue-500/5' },
                { q: Priority.Q4, label: 'Eliminar', color: 'border-slate-800 bg-slate-900/40' }
              ].map(block => (
                <div key={block.q} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, block.q)} className={`p-8 rounded-[48px] border min-h-[400px] flex flex-col space-y-6 transition-all duration-300 ${block.color} hover:border-white/20`}>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter">{block.label}</h3>
                  <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
                    {tasks.filter(t => t.priority === block.q && !t.completed).map(t => (
                      <div key={t.id} draggable={!t.isRefining} onDragStart={(e) => handleDragStart(e, t.id)} onClick={() => !t.isRefining && setEditingTaskId(t.id)} className={`p-5 rounded-2xl border cursor-pointer group transition-all transform active:scale-95 ${isTaskCompatible(t) && !t.isRefining ? 'bg-[#0a1128] border-slate-800 shadow-glow-orange/5' : 'bg-slate-950/40 border-slate-900 opacity-40'} ${t.isRefining ? 'animate-pulse' : ''}`}>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black uppercase text-slate-200">{t.text}</span>
                          {!t.isRefining ? <GripVertical size={14} className="text-slate-700 group-hover:text-slate-500"/> : <Loader2 size={14} className="animate-spin text-orange-500"/>}
                        </div>
                        <div className="flex gap-2 mt-3">
                           <span className="text-[7px] font-black uppercase bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">{t.energy} Energia</span>
                           {t.subtasks.length > 0 && <span className="text-[7px] font-black uppercase bg-slate-800 px-2 py-0.5 rounded-full text-blue-500">{t.subtasks.length} Subtarefas</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'habits' && <HabitsView habits={habits} setHabits={setHabits} setPoints={setPoints} playAudio={playAudio} setShowHabitForm={setShowHabitForm}/>}
          {activeTab === 'fixed' && <FixedView recurringTasks={recurringTasks} setRecurringTasks={setRecurringTasks} currentPeriod={currentPeriod} setPoints={setPoints} setShowRecurringForm={setShowRecurringForm}/>}
          {activeTab === 'dashboard' && <DashboardView tasks={tasks} habits={habits} points={points} achievements={achievements}/>}
          {activeTab === 'upgrades' && <UpgradesView upgrades={upgrades} points={points} setPoints={setPoints} setUpgrades={setUpgrades} playAudio={playAudio}/>}
        </div>
      </main>

      {/* TUTORIAL MODAL OVERLAY */}
      {tutorialStep !== null && TUTORIAL_DATA[activeTab] && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="w-full max-w-md bg-[#0a1128]/95 border-2 border-orange-500 shadow-glow-orange rounded-[40px] p-8 flex flex-col items-center text-center space-y-6 relative">
              <div className="w-16 h-16 bg-orange-600/10 rounded-full flex items-center justify-center border border-orange-500/30 text-orange-500 synapse-core">
                 <BrainIcon size={32}/>
              </div>
              <div className="space-y-2">
                 <h2 className="text-2xl font-black uppercase italic tracking-tighter text-orange-500">{TUTORIAL_DATA[activeTab].title}</h2>
                 <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Passo {tutorialStep + 1} de {TUTORIAL_DATA[activeTab].steps.length}</p>
              </div>
              <p className="text-xl font-bold leading-tight">{TUTORIAL_DATA[activeTab].steps[tutorialStep].text}</p>
              <div className="p-6 bg-slate-900/50 rounded-3xl border border-slate-800 w-full">
                 <div className="flex items-center gap-2 mb-2 text-orange-400">
                    <Lightbulb size={16}/>
                    <span className="text-[10px] font-black uppercase tracking-tighter">Conceito Neuro-Psicossocial</span>
                 </div>
                 <p className="text-[11px] text-slate-300 text-left leading-relaxed">{TUTORIAL_DATA[activeTab].steps[tutorialStep].concept}</p>
              </div>
              <div className="flex w-full gap-4 pt-4">
                 <button onClick={() => tutorialStep > 0 ? setTutorialStep(tutorialStep - 1) : setTutorialStep(null)} className="flex-1 py-4 rounded-2xl font-black uppercase text-[10px] border border-slate-800 hover:bg-slate-800 transition-all"> {tutorialStep === 0 ? "Fechar" : "Voltar"}</button>
                 <button onClick={() => tutorialStep < TUTORIAL_DATA[activeTab].steps.length - 1 ? setTutorialStep(tutorialStep + 1) : setTutorialStep(null)} className="flex-1 py-4 bg-orange-600 rounded-2xl font-black uppercase text-[10px] shadow-glow-orange hover:scale-105 active:scale-95 transition-all"> {tutorialStep < TUTORIAL_DATA[activeTab].steps.length - 1 ? "Próximo" : "Finalizar"}</button>
              </div>
           </div>
        </div>
      )}

      {/* TASK DETAIL EDITOR MODAL */}
      {editingTask && (
        <div className="fixed inset-0 z-[8000] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md">
           <div className="w-full max-w-2xl bg-[#0a1128] border border-slate-800 rounded-[48px] overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/30">
                 <div className="flex items-center gap-4 text-orange-600"><Edit3 size={24}/><h2 className="text-2xl font-black uppercase italic">Andaimação Neural</h2></div>
                 <button onClick={() => setEditingTaskId(null)} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={24}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500">Intenção da Tarefa</label>
                    <input className="w-full bg-slate-900/50 border border-slate-800 p-4 rounded-2xl text-xl font-bold focus:border-orange-600 outline-none" value={editingTask.text} onChange={e => updateTaskDetails(editingTask.id, { text: e.target.value })} />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-500">Demanda Energética</label>
                       <div className="flex gap-2">
                          {['Baixa', 'Média', 'Alta'].map(ev => (
                            <button key={ev} onClick={() => updateTaskDetails(editingTask.id, { energy: ev as any })} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${editingTask.energy === ev ? 'bg-orange-600 border-orange-500 text-white shadow-glow-orange' : 'border-slate-800 text-slate-500 hover:border-slate-700'}`}> {ev} </button>
                          ))}
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-500">Prioridade Eisenhower</label>
                       <div className="flex gap-2">
                          {Object.values(Priority).map(p => (
                            <button key={p} onClick={() => updateTaskDetails(editingTask.id, { priority: p })} className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${editingTask.priority === p ? 'bg-blue-600 border-blue-500 text-white shadow-glow-blue' : 'border-slate-800 text-slate-500 hover:border-slate-700'}`}> {p} </button>
                          ))}
                       </div>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500">Notas de Execução</label>
                    <textarea className="w-full bg-slate-900/50 border border-slate-800 p-4 rounded-2xl min-h-[100px] text-sm focus:border-orange-600 outline-none resize-none" placeholder="Adicione detalhes, links ou contexto..." value={editingTask.notes || ""} onChange={e => updateTaskDetails(editingTask.id, { notes: e.target.value })} />
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-500">Micro-passos (Subtarefas)</label>
                    <div className="space-y-2">
                       {editingTask.subtasks.map((st, i) => (
                         <div key={i} className="flex gap-2 items-center">
                            <input className="flex-1 bg-slate-900/50 border border-slate-800 p-3 rounded-xl text-xs focus:border-blue-500 outline-none" value={st} onChange={e => { const newSt = [...editingTask.subtasks]; newSt[i] = e.target.value; updateTaskDetails(editingTask.id, { subtasks: newSt }); }} />
                            <button onClick={() => { const newSt = editingTask.subtasks.filter((_, idx) => idx !== i); updateTaskDetails(editingTask.id, { subtasks: newSt }); }} className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"><Trash2 size={16}/></button>
                         </div>
                       ))}
                       <button onClick={() => updateTaskDetails(editingTask.id, { subtasks: [...editingTask.subtasks, ""] })} className="w-full py-3 border border-slate-800 border-dashed rounded-xl text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-2"><Plus size={14}/> Adicionar Passo</button>
                    </div>
                 </div>
              </div>
              <div className="p-8 border-t border-slate-800 flex gap-4 bg-slate-900/30">
                 <button onClick={() => completeTask(editingTask.id)} className="flex-1 py-4 bg-green-600 rounded-2xl font-black uppercase text-xs shadow-glow-green hover:scale-105 active:scale-95 transition-all">Completar Tarefa</button>
                 <button onClick={() => { setTasks(tasks.filter(t => t.id !== editingTask.id)); setEditingTaskId(null); }} className="px-6 py-4 bg-red-600/10 text-red-500 rounded-2xl font-black uppercase text-[10px] hover:bg-red-600 hover:text-white transition-all"><Trash2 size={20}/></button>
              </div>
           </div>
        </div>
      )}

      {/* MOBILE NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#0a1128]/95 backdrop-blur-xl border-t border-slate-800 z-50 flex overflow-x-auto no-scrollbar px-4 py-3 gap-6">
        <MobIcon icon={<ListTodo/>} active={activeTab === 'capture'} onClick={() => setActiveTab('capture')}/>
        <MobIcon icon={<Timer/>} active={activeTab === 'execute'} onClick={() => setActiveTab('execute')}/>
        <MobIcon icon={<LayoutGrid/>} active={activeTab === 'plan'} onClick={() => setActiveTab('plan')}/>
        <MobIcon icon={<CalendarRange/>} active={activeTab === 'fixed'} onClick={() => setActiveTab('fixed')}/>
        <MobIcon icon={<RefreshCw/>} active={activeTab === 'habits'} onClick={() => setActiveTab('habits')}/>
        <MobIcon icon={<TrendingUp/>} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}/>
        <MobIcon icon={<Binary/>} active={activeTab === 'upgrades'} onClick={() => setActiveTab('upgrades')}/>
      </nav>

      {showHabitForm && <HabitForm habits={habits} setHabits={setHabits} setShowForm={setShowHabitForm}/>}
      {showRecurringForm && <RecurringForm recurringTasks={recurringTasks} setRecurringTasks={setRecurringTasks} setShowForm={setShowRecurringForm}/>}
    </div>
  );
};

const HabitsView = ({ habits, setHabits, setPoints, playAudio, setShowHabitForm }: any) => (
  <div className="space-y-10 animate-in fade-in">
    <div className="flex justify-between items-end px-4">
      <div><h2 className="text-4xl font-black uppercase italic text-orange-600">Mielinização</h2><p className="text-[10px] font-black text-slate-500 uppercase">Repetição para automação neural.</p></div>
      <button onClick={() => setShowHabitForm(true)} className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center shadow-glow-orange"><Plus/></button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
      {habits.map((h: any) => {
        const today = new Date().toISOString().split('T')[0];
        const doneToday = h.lastCompleted === today;
        return (
          <div key={h.id} className="p-8 bg-slate-900 border border-slate-800 rounded-[48px] space-y-6">
            <div className="flex justify-between">
              <h4 className="text-xl font-black uppercase">{h.identity}</h4>
              <div className="flex gap-1">
                {Array.from({length: 3}).map((_, i) => (
                   <div key={i} className={`w-2 h-2 rounded-full ${h.streak > i ? 'bg-orange-500 shadow-glow-orange' : 'bg-slate-800'}`}/>
                ))}
              </div>
            </div>
            <p className="text-xs italic text-slate-400">"{h.text}"</p>
            <button onClick={() => { if (h.lastCompleted === today) return; setHabits(habits.map((item: any) => item.id === h.id ? {...item, streak: item.streak + 1, lastCompleted: today} : item)); setPoints((p: number) => p + 50); playAudio(SOUNDS.HABIT_COMPLETE); }} disabled={doneToday} className={`w-full py-4 rounded-2xl font-black uppercase text-xs transition-all ${doneToday ? 'bg-green-600/10 text-green-500 border border-green-500/20' : 'bg-orange-600 shadow-glow-orange hover:scale-105 active:scale-95'}`}> {doneToday ? 'Neuralizado Hoje' : 'Reforçar Identidade'} </button>
          </div>
        )
      })}
    </div>
  </div>
);

const FixedView = ({ recurringTasks, setRecurringTasks, currentPeriod, setPoints, setShowRecurringForm }: any) => {
  const currentDay = new Date().getDay(); // 0-6

  const isTaskForToday = (rt: RecurringTask) => {
    if (rt.frequency === Frequency.DAILY) return true;
    if (rt.frequency === Frequency.WEEKLY && rt.weekDays?.includes(currentDay)) return true;
    return false;
  };

  return (
    <div className="space-y-12 animate-in fade-in">
      <div className="flex justify-between items-end">
        <div><h2 className="text-4xl font-black uppercase italic text-purple-400">Bio-Ciclos</h2><p className="text-[10px] font-black text-slate-500 uppercase">Sincronia circadiana e estrutural.</p></div>
        <button onClick={() => setShowRecurringForm(true)} className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center shadow-glow-blue"><Plus/></button>
      </div>
      <div className="space-y-6">
        {(['Morning', 'Day', 'Evening', 'Night'] as DayPeriod[]).map(p => {
          const periodTasks = recurringTasks.filter((rt: any) => rt.period === p);
          if (periodTasks.length === 0 && currentPeriod !== p) return null;

          return (
            <div key={p} className={`p-6 rounded-3xl border transition-all duration-500 ${currentPeriod === p ? 'bg-slate-900 border-purple-500 shadow-glow-blue/20' : 'bg-slate-950 opacity-40'}`}>
              <div className="flex items-center gap-3 mb-4">
                 {p === 'Morning' && <Sunrise className="text-purple-400" size={18}/>}
                 {p === 'Day' && <Sun className="text-purple-400" size={18}/>}
                 {p === 'Evening' && <Sunset className="text-purple-400" size={18}/>}
                 {p === 'Night' && <MoonStar className="text-purple-400" size={18}/>}
                 <h3 className="font-black uppercase text-sm text-purple-400 tracking-tighter italic">{PERIOD_LABELS[p]}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {periodTasks.map((rt: any) => {
                   const todayStr = new Date().toISOString().split('T')[0];
                   const done = rt.completedDates.includes(todayStr);
                   const isToday = isTaskForToday(rt);

                   return (
                    <div 
                      key={rt.id} 
                      onClick={() => { 
                        setRecurringTasks(recurringTasks.map((item: any) => item.id === rt.id ? {...item, completedDates: done ? item.completedDates.filter((d: string) => d !== todayStr) : [...item.completedDates, todayStr]} : item)); 
                        if(!done) setPoints((pts: number) => pts + 25); 
                      }} 
                      className={`p-4 rounded-xl flex justify-between items-center cursor-pointer transition-all border ${done ? 'bg-slate-800/50 border-green-500/20 opacity-60' : 'bg-slate-800 border-slate-700 hover:border-purple-500'} ${isToday && !done ? 'border-purple-500/50 shadow-glow-blue/10 scale-[1.02]' : ''}`}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold uppercase ${done ? 'line-through text-slate-500' : ''}`}>{rt.text}</span>
                          {isToday && !done && <span className="text-[7px] font-black uppercase bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded animate-pulse">Hoje</span>}
                        </div>
                        <div className="flex gap-2">
                           <span className="text-[7px] font-black uppercase text-slate-500">{rt.frequency}</span>
                           {rt.weekDays && rt.weekDays.length > 0 && (
                             <div className="flex gap-0.5">
                               {WEEK_DAYS.map((d, idx) => (
                                 <span key={idx} className={`text-[6px] font-black ${rt.weekDays.includes(idx) ? 'text-purple-400' : 'text-slate-700'}`}>{d}</span>
                               ))}
                             </div>
                           )}
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${done ? 'bg-green-600 shadow-glow-green scale-110' : 'bg-slate-900 border border-slate-700'}`}>{done && <Check size={12}/>}</div>
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
  <div className="space-y-10 animate-in fade-in">
    <h2 className="text-4xl font-black uppercase italic">Dashboard Neural</h2>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatCard icon={<Target/>} val={tasks.filter((t: any) => t.completed).length} label="Concluídas"/>
      <StatCard icon={<Flame/>} val={Math.max(...habits.map((h: any) => h.streak), 0)} label="Melhor Streak"/>
      <StatCard icon={<Gem/>} val={points} label="Neuro-XP"/>
      <StatCard icon={<Award/>} val={achievements.filter((a: any) => a.unlockedAt).length} label="Conquistas"/>
    </div>
  </div>
);

const UpgradesView = ({ upgrades, points, setPoints, setUpgrades, playAudio }: any) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {upgrades.map((u: any) => (
      <div key={u.id} className={`p-8 rounded-[40px] border ${u.unlocked ? 'border-green-500/30 bg-green-500/5' : 'bg-slate-900 border-slate-800'}`}>
        <h4 className="font-black uppercase">{u.name}</h4>
        <p className="text-xs text-slate-500 my-4">{u.description}</p>
        <button disabled={u.unlocked || points < u.cost} onClick={() => { setPoints(points - u.cost); setUpgrades(upgrades.map((up: any) => up.id === u.id ? {...up, unlocked: true} : up)); playAudio(SOUNDS.UPGRADE); }} className="w-full py-4 bg-orange-600 rounded-2xl font-black uppercase text-[10px]"> {u.unlocked ? 'Integrado' : `${u.cost} XP - Sintetizar`} </button>
      </div>
    ))}
  </div>
);

const StatCard = ({ icon, val, label }: any) => (
  <div className="p-8 bg-slate-900 border border-slate-800 rounded-[40px] flex flex-col items-center gap-2">
    <div className="text-orange-500 mb-2">{icon}</div>
    <span className="text-3xl font-black italic">{val}</span>
    <span className="text-[10px] font-black uppercase text-slate-500">{label}</span>
  </div>
);

const HabitForm = ({ habits, setHabits, setShowForm }: any) => (
  <div className="fixed inset-0 z-[9000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl">
    <form className="w-full max-w-lg bg-[#0a1128] border border-slate-800 rounded-[40px] p-10 space-y-6" onSubmit={e => { e.preventDefault(); const target = e.target as any; const h: Habit = { id: crypto.randomUUID(), text: target.text.value, anchor: target.anchor.value, tinyAction: target.tinyAction.value, identity: target.identity.value, streak: 0, lastCompleted: null, completedDates: [] }; setHabits([h, ...habits]); setShowForm(false); }}>
      <h2 className="text-2xl font-black uppercase text-orange-600 italic">Novo Hábito</h2>
      <input name="identity" required className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 text-white" placeholder="Identidade (Ex: Atleta)"/>
      <input name="text" required className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 text-white" placeholder="Ação"/>
      <input name="anchor" required className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 text-white" placeholder="Âncora"/>
      <input name="tinyAction" required className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 text-white" placeholder="Micro-ação"/>
      <button type="submit" className="w-full py-5 bg-orange-600 rounded-2xl font-black">Salvar</button>
      <button type="button" onClick={() => setShowForm(false)} className="w-full text-xs uppercase font-black text-slate-500">Cancelar</button>
    </form>
  </div>
);

const RecurringForm = ({ recurringTasks, setRecurringTasks, setShowForm }: any) => {
  const [freq, setFreq] = useState<Frequency>(Frequency.DAILY);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const toggleDay = (idx: number) => {
    setSelectedDays(prev => prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]);
  };

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl">
      <form className="w-full max-w-lg bg-[#0a1128] border border-slate-800 rounded-[40px] p-10 space-y-6" onSubmit={e => { 
        e.preventDefault(); 
        const target = e.target as any; 
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
        setShowForm(false); 
      }}>
        <h2 className="text-2xl font-black uppercase text-purple-400 italic">Nova Rotina</h2>
        
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-500">O que se repete?</label>
          <input name="text" required className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 text-white focus:border-purple-500 outline-none" placeholder="Ex: Meditação matinal"/>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500">Frequência</label>
            <select value={freq} onChange={(e) => setFreq(e.target.value as Frequency)} className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 font-bold text-white outline-none">
              {Object.values(Frequency).map(f => ( <option key={f} value={f} className="bg-slate-900">{f}</option> ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-500">Bio-Período</label>
            <select name="period" className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 font-bold text-white outline-none">
              {Object.entries(PERIOD_LABELS).map(([val, label]) => ( <option key={val} value={val} className="bg-slate-900">{label}</option> ))}
            </select>
          </div>
        </div>

        {freq === Frequency.WEEKLY && (
          <div className="space-y-2 animate-in slide-in-from-top-2">
            <label className="text-[10px] font-black uppercase text-slate-500">Dias da Semana</label>
            <div className="flex justify-between gap-1">
              {WEEK_DAYS.map((d, idx) => (
                <button 
                  key={idx} 
                  type="button" 
                  onClick={() => toggleDay(idx)}
                  className={`flex-1 py-3 rounded-xl text-xs font-black transition-all border ${selectedDays.includes(idx) ? 'bg-purple-600 border-purple-500 shadow-glow-blue' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
           <label className="text-[10px] font-black uppercase text-slate-500">Energia Necessária</label>
           <select name="energy" className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 font-bold text-white outline-none">
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
           </select>
        </div>

        <button type="submit" className="w-full py-5 bg-purple-600 rounded-2xl font-black shadow-glow-blue hover:scale-105 active:scale-95 transition-all uppercase">Sintetizar Ciclo</button>
        <button type="button" onClick={() => setShowForm(false)} className="w-full text-xs uppercase font-black text-slate-500 hover:text-white transition-colors">Cancelar</button>
      </form>
    </div>
  );
};

const NavBtn: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase text-[11px] transition-all ${active ? 'bg-orange-600 text-white shadow-lg scale-105' : 'text-slate-500 hover:bg-slate-800/30'}`}>{icon} {label}</button>
);

const MobIcon: React.FC<{ icon: React.ReactNode, active: boolean, onClick: () => void }> = ({ icon, active, onClick }) => (
  <button onClick={onClick} className={`flex-shrink-0 p-4 rounded-2xl transition-all ${active ? 'bg-orange-600 text-white scale-110 shadow-lg' : 'text-slate-500'}`}>{icon}</button>
);

const SynapseLogo = () => (
  <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="14" fill="currentColor" fillOpacity="0.05" /><circle cx="16" cy="16" r="6" stroke="#f97316" strokeWidth="2"/><circle cx="16" cy="16" r="3" fill="#f97316"/><path d="M16 16L26 6" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round"/><circle cx="26" cy="6" r="2" fill="#ef4444"/>
  </svg>
);

export default App;
