
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Timer, LayoutGrid, RefreshCw, ListTodo, Zap, AlertTriangle, 
  Plus, X, Trophy, Play, Pause, RotateCcw, 
  BrainCircuit, Anchor, Target, Flame, Sparkles, 
  Repeat, Award, TrendingUp, Sun, Moon, CheckCircle2,
  Trash2, Star, CheckCircle, Info, Move,
  ChevronRight, Brain, Lightbulb, ZapOff, BarChart3,
  Coffee, Utensils, Waves, Users, Wind, Battery, BatteryLow, BatteryMedium, BatteryFull,
  Check, ArrowLeft, ArrowRight, GripVertical, Wand2, Calendar, HelpCircle, Volume2, VolumeX, Volume1, Loader2,
  Clock, CalendarRange, Binary, ShieldCheck, Palette, BookOpen, UtensilsCrossed, GraduationCap, Microscope,
  Cloud, CloudOff, CloudSync, Mail, Rocket, BrainCog, StickyNote, ListChecks, Music, Activity, Star as StarIcon, Cpu,
  ChefHat, IceCream, Pizza, Cookie, ShieldAlert, ZapOff as ZapIcon, FastForward, Filter, Settings, Fingerprint,
  Sunrise, Sunset, MoonStar, Briefcase, Heart, Edit3, Sparkle, Swords, Gem, Lock, Unlock, Zap as ZapBolt,
  Zap as SparkleIcon, History, Fingerprint as IdentityIcon, Send, Brain as BrainIcon, LifeBuoy, FileText, Layers,
  Loader, RefreshCcw, Info as InfoIcon, ArrowUpRight, BookOpenCheck, Menu, User, LogOut, MoreHorizontal, CheckSquare, ShieldCheck as Shield,
  Soup, Disc, Candy, CookingPot, Utensils as UtensilsIcon, Gift, Zap as ZapIconBolt, Zap as SparkleBolt, TrendingDown, Gauge, HelpCircle as HelpIcon
} from 'lucide-react';
import { Priority, Task, Habit, RecurringTask, Frequency, BrainCapacity, DopamenuItem, DayPeriod, Upgrade, Achievement, TimeboxEntry } from './types';
import { geminiService } from './services/geminiService';
import { syncService } from './services/syncService';
import { auth, googleProvider } from './services/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

const SOUNDS = {
  TASK_COMPLETE: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  HABIT_COMPLETE: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  UPGRADE: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  CAPTURE: 'https://assets.mixkit.co/active_storage/sfx/2015/2015-preview.mp3',
};

const TUTORIAL_CONTENT = {
  general: {
    title: "Bem-vindo ao NeuroExecutor",
    steps: [
      { icon: <BrainIcon className="text-orange-500"/>, title: "Funções Executivas", desc: "Este app não é uma lista de tarefas, é um andaimação para o seu córtex pré-frontal. Vamos gerenciar sua carga cognitiva." },
      { icon: <ZapIconBolt className="text-yellow-500"/>, title: "Ciclos Ultradianos", desc: "Trabalhe com a biologia, não contra ela. Use o timer de 90 min para respeitar os ritmos naturais do cérebro." },
      { icon: <Gem className="text-blue-500"/>, title: "Reforço Positivo", desc: "Cada pequena vitória gera XP. Use esse XP para 'comprar' recompensas neurais reais na aba de Upgrades." }
    ]
  },
  capture: {
    title: "A Ciência da Captura",
    steps: [
      { icon: <Layers className="text-orange-500"/>, title: "Mental RAM", desc: "Tirar pensamentos da cabeça e colocá-los no sistema reduz o efeito Zeigarnik (ansiedade por tarefas inacabadas)." },
      { icon: <Cpu className="text-blue-500"/>, title: "Refino por IA", desc: "Nossa IA analisa sua entrada e já quebra a paralisia inicial sugerindo passos e prioridade automática." }
    ]
  },
  execute: {
    title: "Modo de Fluxo",
    steps: [
      { icon: <Clock className="text-orange-500"/>, title: "Timeboxing", desc: "Dar um 'endereço no tempo' para a tarefa remove a fadiga de decisão sobre o que fazer agora." },
      { icon: <Waves className="text-cyan-500"/>, title: "Estado de Flow", desc: "90 minutos é o tempo ideal para o cérebro entrar e se manter em foco profundo antes da queda de performance." }
    ]
  },
  plan: {
    title: "Matriz Estratégica",
    steps: [
      { icon: <ShieldAlert className="text-red-500"/>, title: "Urgência vs Importância", desc: "Diferenciamos o que o seu cérebro 'sente' que é urgente do que realmente trará progresso a longo prazo." },
      { icon: <Target className="text-orange-500"/>, title: "Zona de Evolução", desc: "O Quadrante 2 (Estratégico) é onde você deve investir quando sua energia está alta." }
    ]
  },
  habits: {
    title: "Arquitetura Habitual",
    steps: [
      { icon: <Anchor className="text-blue-500"/>, title: "Âncoras Neurais", desc: "Hábitos não surgem do nada. Eles precisam de um gatilho ambiental estável para disparar a via dopaminérgica." },
      { icon: <Zap className="text-yellow-500"/>, title: "Micro-Ações", desc: "A resistência inicial é o maior obstáculo. Comece tão pequeno que o cérebro não consiga dizer não." }
    ]
  },
  fixed: {
    title: "Sincronia de Rotinas",
    steps: [
      { icon: <Repeat className="text-orange-500"/>, title: "Preditividade", desc: "O cérebro gasta menos energia quando sabe exatamente o que vem a seguir. Blocos fixos estabilizam o sistema." }
    ]
  },
  dopamenu: {
    title: "Regulação Química",
    steps: [
      { icon: <IceCream className="text-purple-500"/>, title: "Dopamina Limpa", desc: "Evite o 'lixo dopaminérgico' (redes sociais). Use o menu para escolher pausas que realmente restauram seu foco." }
    ]
  },
  upgrades: {
    title: "Neuroplasticidade",
    steps: [
      { icon: <Trophy className="text-orange-500"/>, title: "Recompensa Programada", desc: "Transformamos o esforço em algo tangível. Desbloquear melhorias reforça a identidade de alguém produtivo." }
    ]
  },
  dashboard: {
    title: "Auto-Monitoramento",
    steps: [
      { icon: <TrendingUp className="text-green-500"/>, title: "Meta-Cognição", desc: "Observar seus próprios padrões ajuda o cérebro a ajustar expectativas e comemorar a constância." }
    ]
  }
};

// Defined constants to fix errors about missing names used in the render methods and editors
const UPGRADE_ICONS: Record<string, React.ReactNode> = {
  Brain: <Brain size={24} />,
  Zap: <Zap size={24} />,
  Shield: <Shield size={24} />,
  Trophy: <Trophy size={24} />,
  Target: <Target size={24} />,
  Flame: <Flame size={24} />,
  Battery: <Battery size={24} />,
  Sparkles: <Sparkles size={24} />,
  Cpu: <Cpu size={24} />,
  ZapBolt: <ZapBolt size={24} />,
  Activity: <Activity size={24} />
};

const DOPA_CATEGORIES: Record<string, { label: string, color: string, bg: string, icon: React.ReactNode, neuro: string }> = {
  Starter: { label: 'Entradas', color: 'text-green-500', bg: 'bg-green-500/10', icon: <Coffee size={24} />, neuro: 'Micro-dose de dopamina rápida' },
  Main: { label: 'Pratos Principais', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: <Waves size={24} />, neuro: 'Estado de Flow sustentado' },
  Side: { label: 'Acompanhamentos', color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: <Wind size={24} />, neuro: 'Regulação sensorial passiva' },
  Dessert: { label: 'Sobremesas', color: 'text-purple-500', bg: 'bg-purple-500/10', icon: <IceCream size={24} />, neuro: 'Recompensa final de ciclo' }
};

const MATRIX_INSIGHTS: Record<Priority, { label: string, strategy: string, neuro: string }> = {
  [Priority.Q1]: { label: 'Crítico', strategy: 'Fazer Agora', neuro: 'Carga Cognitiva Máxima. Requer Foco Total.' },
  [Priority.Q2]: { label: 'Estratégico', strategy: 'Agendar', neuro: 'Zona de Flow. Onde a evolução real acontece.' },
  [Priority.Q3]: { label: 'Delegar', strategy: 'Minimizar', neuro: 'Ruído Executivo. Proteja sua atenção.' },
  [Priority.Q4]: { label: 'Eliminar', strategy: 'Descartar', neuro: 'Entropia Mental. Libere espaço na RAM.' }
};

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'none'>('none');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('neuro-dark-mode') !== 'false');
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => localStorage.getItem('neuro-sound-enabled') !== 'false');
  const [activeTab, setActiveTab] = useState<'execute' | 'plan' | 'habits' | 'capture' | 'fixed' | 'upgrades' | 'dopamenu' | 'dashboard'>('capture');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  const [points, setPoints] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [timeboxEntries, setTimeboxEntries] = useState<TimeboxEntry[]>([]);
  const [dopamenuItems, setDopamenuItems] = useState<DopamenuItem[]>([]);
  const [upgrades, setUpgrades] = useState<Upgrade[]>([]);
  
  const [userEnergy, setUserEnergy] = useState<'Baixa' | 'Média' | 'Alta'>('Média');
  const [brainCapacity, setBrainCapacity] = useState<BrainCapacity>('Neutro');
  const [newTaskText, setNewTaskText] = useState("");
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Modals & Tutorials
  const [activeTutorial, setActiveTutorial] = useState<keyof typeof TUTORIAL_CONTENT | null>(null);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(true); // Default true, will load from Firestore

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [editingTimeboxId, setEditingTimeboxId] = useState<string | null>(null);
  const [editingDopaId, setEditingDopaId] = useState<string | null>(null);
  const [editingUpgradeId, setEditingUpgradeId] = useState<string | null>(null);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [showTimeboxCreator, setShowTimeboxCreator] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);

  const timerRef = useRef<number | null>(null);
  const syncTimeoutRef = useRef<number | null>(null);
  const lastSyncHashRef = useRef<string>("");

  const playAudio = useCallback((url: string) => {
    if (!isSoundEnabled) return;
    new Audio(url).play().catch(() => {});
  }, [isSoundEnabled]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthChecking(false);
      if (!firebaseUser) {
        setIsDataLoaded(false);
        setPoints(0); setTasks([]); setHabits([]); setRecurringTasks([]); setTimeboxEntries([]); setDopamenuItems([]); setUpgrades([]);
        lastSyncHashRef.current = "";
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setAuthError(null);
    try { await signInWithPopup(auth, googleProvider); } catch (error: any) { setAuthError(`Erro: ${error.message}`); }
  };

  const handleLogout = async () => { try { await signOut(auth); setShowMobileDrawer(false); } catch (error) { console.error(error); } };

  useEffect(() => {
    if (!user) return;
    setSyncStatus('syncing');
    const unsubscribe = syncService.subscribeToUserData(user.uid, (data) => {
      if (data) {
        const dataHash = JSON.stringify({ t: data.tasks, h: data.habits, p: data.points, r: data.recurringTasks, tb: data.timeboxEntries, dm: data.dopamenuItems, up: data.upgrades, welcome: data.hasSeenWelcome });
        if (dataHash === lastSyncHashRef.current) { setSyncStatus('synced'); setIsDataLoaded(true); return; }
        lastSyncHashRef.current = dataHash;
        if (data.points !== undefined) setPoints(data.points);
        if (data.tasks) setTasks(data.tasks);
        if (data.recurringTasks) setRecurringTasks(data.recurringTasks);
        if (data.habits) setHabits(data.habits);
        if (data.timeboxEntries) setTimeboxEntries(data.timeboxEntries);
        if (data.dopamenuItems) setDopamenuItems(data.dopamenuItems);
        if (data.upgrades) setUpgrades(data.upgrades);
        if (data.hasSeenWelcome !== undefined) {
           setHasSeenWelcome(data.hasSeenWelcome);
           if (!data.hasSeenWelcome) setActiveTutorial('general');
        } else {
           // First time user logic
           setHasSeenWelcome(false);
           setActiveTutorial('general');
        }
      } else {
        // New user no data
        setHasSeenWelcome(false);
        setActiveTutorial('general');
      }
      setIsDataLoaded(true);
      setSyncStatus('synced');
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!isDataLoaded || !user) return;
    const currentHash = JSON.stringify({ t: tasks, h: habits, p: points, r: recurringTasks, tb: timeboxEntries, dm: dopamenuItems, up: upgrades, welcome: hasSeenWelcome });
    if (currentHash === lastSyncHashRef.current) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = window.setTimeout(async () => {
      setSyncStatus('syncing');
      const success = await syncService.pushData(user.uid, { tasks, habits, points, recurringTasks, timeboxEntries, dopamenuItems, upgrades, hasSeenWelcome });
      if (success) { lastSyncHashRef.current = currentHash; setSyncStatus('synced'); } else { setSyncStatus('error'); }
    }, 3000);
  }, [tasks, habits, points, recurringTasks, timeboxEntries, dopamenuItems, upgrades, user, isDataLoaded, hasSeenWelcome]);

  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (timeLeft === 0 && isTimerActive) { setPoints(p => p + 500); playAudio(SOUNDS.UPGRADE); setIsTimerActive(false); }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerActive, timeLeft]);

  const updateTaskDetails = (id: string, updates: Partial<Task>) => setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  const updateHabitDetails = (id: string, updates: Partial<Habit>) => setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  const updateRoutineDetails = (id: string, updates: Partial<RecurringTask>) => setRecurringTasks(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  const updateTimeboxDetails = (id: string, updates: Partial<TimeboxEntry>) => setTimeboxEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  const updateDopaDetails = (id: string, updates: Partial<DopamenuItem>) => setDopamenuItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  const updateUpgradeDetails = (id: string, updates: Partial<Upgrade>) => setUpgrades(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  const getWeekDays = () => {
    const days = []; const now = new Date(); const sunday = new Date(now); sunday.setDate(now.getDate() - now.getDay());
    for (let i = 0; i < 7; i++) { const d = new Date(sunday); d.setDate(sunday.getDate() + i); days.push(d); }
    return days;
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center gap-3"><SynapseLogo /><h1 className="text-2xl font-black italic text-orange-600 uppercase tracking-tighter">Neuro</h1></div>
      <div className="p-5 theme-bg-input border rounded-3xl space-y-4">
         <div className="flex justify-between items-center">
            <p className="text-[10px] font-black uppercase theme-text-muted tracking-widest">Neural Link</p>
            <div className="flex gap-2">
              <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-xl hover:bg-slate-800 transition-all text-slate-400">{isDarkMode ? <Sun size={16}/> : <Moon size={16}/>}</button>
              <button onClick={() => setIsSoundEnabled(!isSoundEnabled)} className="p-2 rounded-xl hover:bg-slate-800 transition-all text-slate-400">{isSoundEnabled ? <Volume2 size={16}/> : <VolumeX size={16}/>}</button>
            </div>
         </div>
         {user && (
           <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <img src={user.photoURL || ""} className="w-10 h-10 rounded-full border-2 border-orange-500/20 shadow-glow-orange" alt="U" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-black truncate theme-text-main uppercase">{user.displayName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-orange-500 uppercase tracking-tighter">XP: {points}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'synced' ? 'bg-green-500 shadow-glow-green' : syncStatus === 'syncing' ? 'bg-orange-500 animate-pulse' : 'bg-red-500 animate-bounce'}`}></div>
                  </div>
                </div>
              </div>
              <button onClick={handleLogout} className="w-full py-2.5 bg-red-600/10 hover:bg-red-600 hover:text-white rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 text-red-500"><LogOut size={12}/> Logout</button>
           </div>
         )}
      </div>
      <div className="p-4 theme-bg-input border rounded-3xl space-y-3">
        <p className="text-[9px] font-black uppercase theme-text-muted tracking-widest text-center">Neuro-Estado</p>
        <div className="grid grid-cols-2 gap-2">
          {['Baixa', 'Média', 'Alta'].map(ev => (
            <button key={ev} onClick={() => setUserEnergy(ev as any)} className={`flex flex-col items-center p-2 rounded-xl transition-all border ${userEnergy === ev ? 'bg-orange-600/10 border-orange-500/30 scale-105' : 'opacity-40 hover:opacity-100 theme-border'}`}>
              <div className={ev === 'Baixa' ? 'text-red-500' : ev === 'Média' ? 'text-yellow-500' : 'text-green-500'}>
                {ev === 'Baixa' ? <BatteryLow size={14}/> : ev === 'Média' ? <BatteryMedium size={14}/> : <BatteryFull size={14}/>}
              </div>
              <span className="text-[7px] font-black uppercase mt-1">{ev} Energia</span>
            </button>
          ))}
          {['Exausto', 'Neutro', 'Hiperfocado'].map(cap => (
            <button key={cap} onClick={() => setBrainCapacity(cap as any)} className={`flex flex-col items-center p-2 rounded-xl transition-all border ${brainCapacity === cap ? 'bg-blue-600/10 border-blue-500/30 scale-105' : 'opacity-40 hover:opacity-100 theme-border'}`}>
              <div className={cap === 'Exausto' ? 'text-red-400' : cap === 'Neutro' ? 'text-blue-400' : 'text-purple-400'}>
                <Brain size={14}/>
              </div>
              <span className="text-[7px] font-black uppercase mt-1">{cap}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const statsData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().split('T')[0];
    }).reverse();
    const taskCounts = last7Days.map(date => ({
      date, completed: tasks.filter(t => t.date === date && t.completed).length, total: tasks.filter(t => t.date === date).length
    }));
    const totalCompleted = tasks.filter(t => t.completed).length;
    const averageCompletion = tasks.length > 0 ? (totalCompleted / tasks.length) * 100 : 0;
    const topHabitStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
    const routineConsistency = recurringTasks.length > 0 ? (recurringTasks.reduce((acc, r) => acc + r.streak, 0) / recurringTasks.length) : 0;
    return { last7Days, taskCounts, totalCompleted, averageCompletion, topHabitStreak, routineConsistency, cognitiveLoad: tasks.filter(t => t.date === selectedDate && !t.completed).length * 20 };
  }, [tasks, habits, recurringTasks, selectedDate]);

  if (isAuthChecking) return <div className="min-h-screen theme-bg-body flex items-center justify-center"><div className="w-12 h-12 border-4 border-orange-600/20 border-t-orange-600 rounded-full animate-spin"></div></div>;

  if (!user) {
    return (
      <div className="min-h-screen theme-bg-body flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/5 to-blue-600/5 pointer-events-none"></div>
        <div className="max-w-md w-full theme-bg-card border-2 theme-border p-12 rounded-[56px] shadow-2xl z-10 text-center space-y-8">
           <div className="w-20 h-20 bg-orange-600/10 rounded-full flex items-center justify-center mx-auto border border-orange-600/20 shadow-glow-orange synapse-core"><Brain size={40} className="text-orange-600"/></div>
           <div className="space-y-2">
             <h1 className="text-4xl font-black italic uppercase text-orange-600 tracking-tighter">NeuroExecutor</h1>
             <p className="text-[10px] font-black theme-text-muted uppercase tracking-[0.3em]">Produtividade Cognitiva</p>
           </div>
           {authError && <div className="p-3 bg-red-600/10 text-red-500 rounded-2xl text-[10px] font-bold uppercase">{authError}</div>}
           <button onClick={handleLogin} className="w-full py-5 bg-orange-600 text-white rounded-3xl font-black uppercase shadow-glow-orange hover:scale-105 transition-all flex items-center justify-center gap-3 tracking-widest text-xs">
             <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/0/google.svg" className="w-5 h-5 bg-white p-1 rounded-full" alt="G" />
             Iniciar Sinapse
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col md:flex-row transition-all duration-300 pb-24 md:pb-0`}>
      <header className="md:hidden sticky top-0 left-0 w-full theme-bg-sidebar backdrop-blur-xl border-b z-[60] flex items-center justify-between px-6 py-4">
         <div className="flex items-center gap-2"><SynapseLogo /><h1 className="text-xl font-black italic text-orange-600 uppercase tracking-tighter">Neuro</h1></div>
         <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-green-500 shadow-glow-green' : 'bg-orange-500 animate-pulse'}`}></div>
            <button onClick={() => setShowMobileDrawer(true)} className="p-2.5 theme-bg-input border rounded-xl theme-text-main"><User size={20}/></button>
         </div>
      </header>

      {showMobileDrawer && (
        <div className="fixed inset-0 z-[100] md:hidden">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowMobileDrawer(false)}></div>
           <div className="absolute right-0 top-0 h-full w-[85%] theme-bg-sidebar border-l theme-border p-8 flex flex-col animate-in slide-in-from-right duration-300">
              <SidebarContent />
           </div>
        </div>
      )}

      <aside className="hidden md:flex flex-col w-72 h-screen theme-bg-sidebar border-r p-8 space-y-6 z-50 overflow-y-auto no-scrollbar">
        <SidebarContent />
        <nav className="flex-1 space-y-1">
          <NavBtn icon={<ListTodo/>} label="Captura" active={activeTab === 'capture'} onClick={() => setActiveTab('capture')}/>
          <NavBtn icon={<Timer/>} label="Executar" active={activeTab === 'execute'} onClick={() => setActiveTab('execute')}/>
          <NavBtn icon={<LayoutGrid/>} label="Matriz" active={activeTab === 'plan'} onClick={() => setActiveTab('plan')}/>
          <NavBtn icon={<RefreshCw/>} label="Hábitos" active={activeTab === 'habits'} onClick={() => setActiveTab('habits')}/>
          <NavBtn icon={<CalendarRange/>} label="Rotinas" active={activeTab === 'fixed'} onClick={() => setActiveTab('fixed')}/>
          <NavBtn icon={<UtensilsIcon/>} label="DopaMenu" active={activeTab === 'dopamenu'} onClick={() => setActiveTab('dopamenu')}/>
          <NavBtn icon={<Gift/>} label="Melhorias" active={activeTab === 'upgrades'} onClick={() => setActiveTab('upgrades')}/>
          <NavBtn icon={<TrendingUp/>} label="Stats" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}/>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-10">
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
          
          <div className="sticky top-0 z-40 py-2 theme-bg-body">
            <div className="flex items-center gap-2 p-1 bg-slate-900/50 backdrop-blur-xl rounded-[32px] border theme-border overflow-x-auto no-scrollbar shadow-xl">
              {getWeekDays().map((date, idx) => {
                const dateStr = date.toISOString().split('T')[0];
                const isSelected = selectedDate === dateStr;
                return (
                  <button key={idx} onClick={() => setSelectedDate(dateStr)} className={`flex flex-col items-center justify-center min-w-[50px] md:min-w-[64px] py-2.5 px-1 rounded-2xl transition-all ${isSelected ? 'bg-orange-600 text-white shadow-glow-orange scale-105' : 'theme-text-muted hover:bg-white/5'}`}>
                    <span className="text-[7px] md:text-[8px] font-black uppercase tracking-tighter opacity-70 mb-0.5">{date.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                    <span className="text-sm md:text-lg font-black italic">{date.getDate()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab === 'dashboard' && (
             <div className="animate-in fade-in space-y-10 px-2 pb-24">
                <div className="flex justify-between items-center">
                   <div className="space-y-1">
                      <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">Status da Sinapse</h2>
                      <p className="text-[10px] md:text-[12px] font-black theme-text-muted uppercase tracking-[0.3em]">Relatório de Performance Executiva</p>
                   </div>
                   <button onClick={() => setActiveTutorial('dashboard')} className="p-3 theme-bg-card border theme-border rounded-2xl theme-text-muted hover:text-orange-500 transition-all"><HelpIcon size={20}/></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <StatBox label="Nível Neural" value={`LVL ${Math.floor(points / 5000) + 1}`} icon={<Cpu size={20}/>} color="text-orange-500" subValue={`${points % 5000} / 5000 XP`}/>
                   <StatBox label="Carga Cognitiva" value={`${statsData.cognitiveLoad}%`} icon={<Brain size={20}/>} color={statsData.cognitiveLoad > 80 ? "text-red-500" : "text-green-500"} subValue={statsData.cognitiveLoad > 80 ? "Risco de Burnout" : "Estado Saudável"}/>
                   <StatBox label="Consistência Habitual" value={`${statsData.topHabitStreak} d`} icon={<Flame size={20}/>} color="text-orange-600" subValue="Maior sequência atual"/>
                </div>
                <div className="p-8 md:p-12 theme-bg-card border-2 theme-border rounded-[48px] md:rounded-[64px] space-y-8 shadow-2xl relative overflow-hidden group">
                   <div className="flex justify-between items-end">
                      <div className="space-y-1">
                         <h3 className="text-2xl font-black italic uppercase theme-text-main flex items-center gap-3"><BarChart3 className="text-orange-500" size={24}/> Fluxo Semanal</h3>
                         <p className="text-[10px] font-black theme-text-muted uppercase tracking-widest">Atividades concluídas nos últimos 7 dias</p>
                      </div>
                      <div className="flex items-center gap-2 text-green-500"><TrendingUp size={16}/><span className="text-xl font-black italic">+{statsData.totalCompleted}</span></div>
                   </div>
                   <div className="h-64 md:h-80 w-full relative flex items-end justify-between px-4 pb-8 pt-4">
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5 px-4 pb-8 pt-4">{[1,2,3,4].map(l => <div key={l} className="w-full border-t border-white"></div>)}</div>
                      {statsData.taskCounts.map((day, idx) => {
                        const maxVal = Math.max(...statsData.taskCounts.map(d => d.completed), 1);
                        const height = (day.completed / maxVal) * 100;
                        const isToday = day.date === new Date().toISOString().split('T')[0];
                        return (
                          <div key={idx} className="flex flex-col items-center gap-4 group/bar relative flex-1">
                             <div className="relative w-full flex justify-center items-end h-48 md:h-64"><div className={`w-4 md:w-8 rounded-t-full transition-all duration-700 shadow-glow-orange relative ${isToday ? 'bg-orange-600' : 'bg-slate-700/50 group-hover/bar:bg-orange-500'}`} style={{ height: `${Math.max(height, 5)}%` }}><div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-xl opacity-0 group-hover/bar:opacity-100 transition-all scale-75 group-hover/bar:scale-100 whitespace-nowrap shadow-2xl border theme-border">{day.completed} Sinapses</div></div></div>
                             <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-tighter ${isToday ? 'text-orange-500' : 'theme-text-muted'}`}>{new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                          </div>
                        );
                      })}
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'upgrades' && (
             <div className="animate-in fade-in space-y-10 px-2 pb-24">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                   <div className="space-y-1"><h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">Melhorias Neurais</h2><p className="text-[10px] md:text-[12px] font-black theme-text-muted uppercase tracking-[0.3em]">Investindo XP em Funções Executivas</p></div>
                   <div className="flex items-center gap-4">
                      <button onClick={() => setActiveTutorial('upgrades')} className="p-3 theme-bg-card border theme-border rounded-2xl theme-text-muted hover:text-orange-500 transition-all"><HelpIcon size={20}/></button>
                      <div className="px-6 py-4 theme-bg-card border-2 border-orange-500/30 rounded-[32px] shadow-glow-orange flex items-center gap-3"><Gem className="text-orange-500" size={24}/><div className="flex flex-col"><span className="text-2xl font-black theme-text-main italic leading-none">{points}</span><span className="text-[8px] font-black uppercase theme-text-muted">XP Disponível</span></div></div>
                      <button onClick={() => { const nu: Upgrade = { id: crypto.randomUUID(), name: "Nova Melhoria", cost: 1000, unlocked: false, description: "O que este upgrade melhora no seu cérebro?", icon: 'Brain', category: 'Foco' }; setUpgrades([nu, ...upgrades]); setEditingUpgradeId(nu.id); }} className="p-4 bg-orange-600 text-white rounded-3xl shadow-glow-orange hover:scale-110 active:scale-90 transition-all"><Plus size={28}/></button>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                   {upgrades.map(upgrade => (
                     <div key={upgrade.id} className={`p-6 md:p-10 theme-bg-card border-2 rounded-[48px] space-y-6 group relative overflow-hidden transition-all shadow-xl flex flex-col ${upgrade.unlocked ? 'border-green-500/40' : 'theme-border hover:border-orange-500/40 cursor-pointer'}`} onClick={() => !upgrade.unlocked && setEditingUpgradeId(upgrade.id)}>
                        {upgrade.unlocked && <div className="absolute top-0 right-0 p-6 opacity-40"><ShieldCheck className="text-green-500" size={32}/></div>}
                        <div className="flex justify-between items-start"><div className={`p-4 rounded-2xl ${upgrade.unlocked ? 'bg-green-600/10 text-green-500' : 'bg-orange-600/10 text-orange-500 shadow-glow-orange'}`}>{UPGRADE_ICONS[upgrade.icon] || <Brain size={24}/>}</div><div className="flex flex-col items-end gap-1"><span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg ${upgrade.category === 'Foco' ? 'bg-red-500/10 text-red-500' : upgrade.category === 'Energia' ? 'bg-yellow-500/10 text-yellow-500' : upgrade.category === 'Dopamina' ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'}`}>{upgrade.category}</span>{!upgrade.unlocked && <button onClick={e => { e.stopPropagation(); setEditingUpgradeId(upgrade.id); }} className="p-2 theme-text-muted hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-all"><Edit3 size={16}/></button>}</div></div>
                        <div className="space-y-2 flex-1"><h3 className="text-xl md:text-2xl font-black uppercase italic theme-text-main tracking-tighter leading-tight">{upgrade.name}</h3><p className="text-[10px] md:text-[11px] font-bold theme-text-muted leading-relaxed uppercase tracking-tight">{upgrade.description}</p></div>
                        <button onClick={(e) => { e.stopPropagation(); if (!upgrade.unlocked && points >= upgrade.cost) { setPoints(p => p - upgrade.cost); updateUpgradeDetails(upgrade.id, { unlocked: true }); playAudio(SOUNDS.UPGRADE); } }} disabled={upgrade.unlocked || points < upgrade.cost} className={`w-full py-5 rounded-3xl font-black uppercase text-[11px] tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 ${upgrade.unlocked ? 'bg-green-600/10 text-green-500 border border-green-600/30' : points >= upgrade.cost ? 'bg-orange-600 text-white shadow-glow-orange hover:scale-105' : 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed'}`}>{upgrade.unlocked ? <><CheckCircle size={18}/> Ativado</> : <><ZapIcon size={18}/> Desbloquear ({upgrade.cost} XP)</>}</button>
                     </div>
                   ))}
                </div>
             </div>
          )}

          {activeTab === 'dopamenu' && (
             <div className="animate-in fade-in space-y-10 px-2 pb-24">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                   <div className="space-y-1"><h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">DopaMenu</h2><p className="text-[10px] md:text-[12px] font-black theme-text-muted uppercase tracking-[0.3em]">Cardápio de Regulação Neuroquímica</p></div>
                   <div className="flex gap-4 w-full md:w-auto">
                      <button onClick={() => setActiveTutorial('dopamenu')} className="p-3 theme-bg-card border theme-border rounded-2xl theme-text-muted hover:text-orange-500 transition-all"><HelpIcon size={20}/></button>
                      <button onClick={async () => { setIsAILoading(true); try { const result = await geminiService.suggestDopaMenuItem(brainCapacity, dopamenuItems); if (result.item) { const newItem: DopamenuItem = { id: crypto.randomUUID(), label: result.item.label || "Sugestão de IA", category: result.item.category as any || 'Starter', description: result.item.description || result.recommendation, effort: result.item.effort as any || 'Médio' }; setDopamenuItems([newItem, ...dopamenuItems]); setEditingDopaId(newItem.id); } } catch (e) { console.error(e); } setIsAILoading(false); }} disabled={isAILoading} className="flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-purple-600 text-white rounded-3xl font-black uppercase text-xs shadow-glow-purple transition-all hover:scale-105 active:scale-95 disabled:opacity-50">{isAILoading ? <Loader2 className="animate-spin" size={18}/> : <ChefHat size={18}/>} Suggestion de IA</button>
                      <button onClick={() => { const ni: DopamenuItem = { id: crypto.randomUUID(), label: "Nova Atividade", category: 'Starter', description: "O que te dá prazer sustentável?", effort: 'Baixo' }; setDopamenuItems([ni, ...dopamenuItems]); setEditingDopaId(ni.id); }} className="p-4 bg-orange-600 text-white rounded-3xl shadow-glow-orange hover:scale-110 active:scale-90 transition-all"><Plus size={28}/></button>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   {Object.entries(DOPA_CATEGORIES).map(([catKey, info]) => {
                     const items = dopamenuItems.filter(i => i.category === catKey);
                     return (
                       <div key={catKey} className={`p-6 md:p-8 theme-bg-card border-2 theme-border rounded-[48px] flex flex-col space-y-6 transition-all hover:shadow-2xl ${info.bg} group`}>
                          <div className="flex flex-col gap-2"><div className={`p-3 w-fit rounded-2xl ${info.bg} ${info.color}`}>{info.icon}</div><h3 className={`text-xl font-black uppercase italic tracking-tighter ${info.color}`}>{info.label}</h3><p className="text-[9px] font-bold theme-text-muted uppercase leading-relaxed tracking-tight">{info.neuro}</p></div>
                          <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar max-h-[400px]">
                             {items.length === 0 ? ( <div className="py-12 border-2 border-dashed theme-border rounded-3xl flex flex-col items-center justify-center opacity-20 text-center px-4"><ZapOff size={24}/></div> ) : items.map(item => ( <div key={item.id} onClick={() => setEditingDopaId(item.id)} className="p-4 theme-bg-input rounded-2xl border theme-border hover:border-orange-500/50 cursor-pointer group/item transition-all active:scale-95 flex flex-col gap-2 shadow-md"><div className="flex justify-between items-start"><h4 className="text-[10px] md:text-[11px] font-black uppercase theme-text-main leading-tight truncate pr-2">{item.label}</h4><span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-md ${item.effort === 'Baixo' ? 'bg-green-500/20 text-green-500' : item.effort === 'Médio' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'}`}>{item.effort} Esforço</span></div><p className="text-[9px] theme-text-muted line-clamp-2 italic leading-tight">{item.description}</p><div className="pt-2 opacity-0 group-hover/item:opacity-100 transition-all"><button onClick={(e) => { e.stopPropagation(); setPoints(p => p + 50); playAudio(SOUNDS.HABIT_COMPLETE); }} className="w-full py-2 bg-orange-600/10 text-orange-500 text-[8px] font-black uppercase rounded-xl border border-orange-500/20 hover:bg-orange-600 hover:text-white transition-all">Consumir</button></div></div> ))}
                          </div>
                       </div>
                     );
                   })}
                </div>
             </div>
          )}

          {activeTab === 'plan' && (
             <div className="animate-in fade-in space-y-8 md:space-y-12 px-2 pb-24">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                   <div className="space-y-1"><h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">Matriz de Eisenhower</h2><p className="text-[10px] md:text-[12px] font-black theme-text-muted uppercase tracking-[0.3em]">Otimização de Funções Executivas</p></div>
                   <div className="flex items-center gap-4">
                      <button onClick={() => setActiveTutorial('plan')} className="p-3 theme-bg-card border theme-border rounded-2xl theme-text-muted hover:text-orange-500 transition-all"><HelpIcon size={20}/></button>
                      <div className="flex items-center gap-4 p-4 theme-bg-card border theme-border rounded-[32px] shadow-lg"><Brain size={24} className="text-orange-500 animate-pulse"/><p className="text-[10px] font-bold theme-text-muted max-w-[200px] leading-tight uppercase">Separe Urgência de Importância para evitar a Paralisia Neural.</p></div>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 min-h-[700px]">
                   {[Priority.Q1, Priority.Q2, Priority.Q3, Priority.Q4].map(prio => {
                     const insight = MATRIX_INSIGHTS[prio];
                     const quadrantTasks = tasks.filter(t => t.priority === prio && !t.completed && t.date === selectedDate);
                     return (
                       <div key={prio} className={`relative p-6 md:p-10 rounded-[56px] border-2 theme-bg-card flex flex-col space-y-6 transition-all hover:shadow-2xl overflow-hidden group ${prio === Priority.Q1 ? 'border-red-500/20 shadow-red-500/5' : prio === Priority.Q2 ? 'border-orange-500/20 shadow-orange-500/5' : prio === Priority.Q3 ? 'border-blue-500/20 shadow-blue-500/5' : 'border-slate-500/20 opacity-70 grayscale hover:grayscale-0'}`}><div className={`absolute -top-10 -right-10 w-40 h-40 blur-[80px] rounded-full opacity-10 pointer-events-none ${prio === Priority.Q1 ? 'bg-red-500' : prio === Priority.Q2 ? 'bg-orange-500' : prio === Priority.Q3 ? 'bg-blue-500' : 'bg-slate-500'}`}></div><div className="flex justify-between items-start z-10"><div className="space-y-1"><span className={`text-[11px] font-black uppercase px-4 py-1.5 rounded-full shadow-lg inline-block tracking-widest ${prio === Priority.Q1 ? 'bg-red-600 text-white' : prio === Priority.Q2 ? 'bg-orange-600 text-white' : prio === Priority.Q3 ? 'bg-blue-600 text-white' : 'bg-slate-600 text-white'}`}>{insight.label}</span><p className={`text-[18px] md:text-[22px] font-black italic uppercase tracking-tighter leading-none mt-2 ${prio === Priority.Q1 ? 'text-red-500' : prio === Priority.Q2 ? 'text-orange-500' : prio === Priority.Q3 ? 'text-blue-500' : 'theme-text-muted'}`}>{insight.strategy}</p></div><button onClick={() => { const nt: Task = { id: crypto.randomUUID(), text: "", priority: prio, energy: 'Média', capacityNeeded: 'Neutro', completed: false, subtasks: [], date: selectedDate, createdAt: Date.now() }; setTasks([nt, ...tasks]); setEditingTaskId(nt.id); }} className="p-4 theme-bg-input rounded-3xl hover:bg-orange-600 hover:text-white transition-all active:scale-90 border theme-border shadow-md"><Plus size={24}/></button></div><div className="p-4 theme-bg-input/30 rounded-3xl border border-dashed theme-border"><p className="text-[10px] font-bold theme-text-muted uppercase leading-relaxed tracking-tight"><InfoIcon size={12} className="inline mr-1 mb-0.5 opacity-50"/> {insight.neuro}</p></div><div className="flex-1 space-y-4 overflow-y-auto no-scrollbar pr-1 max-h-[500px]">{quadrantTasks.length === 0 ? ( <div className="h-full flex flex-col items-center justify-center py-20 opacity-20 border-2 border-dashed theme-border rounded-[40px] text-center px-6"><Target size={32}/><p className="text-[9px] font-black uppercase mt-4 tracking-widest leading-relaxed">Nenhum alvo neste quadrante</p></div> ) : quadrantTasks.map(task => ( <TaskCard key={task.id} task={task} compact onComplete={(id: string) => { updateTaskDetails(id, {completed: true}); setPoints(p => p + 100); playAudio(SOUNDS.TASK_COMPLETE); }} onEdit={() => setEditingTaskId(task.id)} /> ))}</div></div>
                     );
                   })}
                </div>
             </div>
          )}

          {activeTab === 'fixed' && (
             <div className="animate-in fade-in space-y-10 px-2 pb-20">
                <div className="flex justify-between items-center"><div className="space-y-1"><h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">Blocos de Rotina</h2><p className="text-[10px] md:text-[12px] font-black theme-text-muted uppercase tracking-[0.3em]">Andaimação Neural de Tarefas Fixas</p></div><div className="flex gap-4">
                   <button onClick={() => setActiveTutorial('fixed')} className="p-3 theme-bg-card border theme-border rounded-2xl theme-text-muted hover:text-orange-500 transition-all"><HelpIcon size={20}/></button>
                   <button onClick={() => { const nr: RecurringTask = { id: crypto.randomUUID(), text: "Nova Rotina", frequency: Frequency.DAILY, energy: 'Média', identity: "Eu sou alguém que...", anchor: "Quando X acontecer...", subtasks: ["Passo 1", "Passo 2"], streak: 0, lastCompleted: null, completedDates: [] }; setRecurringTasks([nr, ...recurringTasks]); setEditingRoutineId(nr.id); }} className="p-4 md:p-5 bg-orange-600 text-white rounded-[24px] shadow-glow-orange hover:scale-110 active:scale-95 transition-all"><Plus size={28}/></button>
                </div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">{recurringTasks.map(routine => ( <div key={routine.id} className="p-6 md:p-10 theme-bg-card border-2 theme-border rounded-[48px] space-y-6 group relative overflow-hidden transition-all hover:border-orange-500/40 cursor-pointer shadow-xl flex flex-col" onClick={() => setEditingRoutineId(routine.id)}><div className="flex justify-between items-start"><div className="space-y-1.5 flex-1 pr-4"><span className="text-[9px] font-black uppercase text-orange-500 bg-orange-500/10 px-3 py-1 rounded-lg tracking-widest">{routine.identity || 'Sem Identidade'}</span><h3 className="text-xl md:text-2xl font-black uppercase theme-text-main tracking-tighter leading-tight truncate">{routine.text}</h3><div className="flex items-center gap-3"><span className="text-[9px] font-bold theme-text-muted uppercase flex items-center gap-1"><History size={10}/> {routine.frequency}</span><span className={`text-[9px] font-bold uppercase flex items-center gap-1 ${routine.energy === 'Baixa' ? 'text-green-500' : routine.energy === 'Média' ? 'text-yellow-500' : 'text-red-500'}`}><Battery size={10}/> {routine.energy}</span></div></div><div className="flex flex-col items-end gap-2"><div className="flex items-center gap-1 text-orange-600"><Flame size={14}/><span className="text-lg font-black italic">{routine.streak}</span></div><button onClick={e => { e.stopPropagation(); setEditingRoutineId(routine.id); }} className="p-2.5 theme-bg-input border theme-border rounded-xl theme-text-muted hover:text-orange-500 transition-all active:scale-90"><Edit3 size={16}/></button></div></div><div className="p-5 theme-bg-input rounded-3xl border theme-border space-y-3"><div className="flex items-center gap-2 opacity-60"><Anchor size={14} className="text-orange-500"/><span className="text-[10px] font-black uppercase tracking-widest leading-none">Gatilho: {routine.anchor}</span></div><div className="space-y-2 pt-1">{routine.subtasks.map((step, idx) => ( <div key={idx} className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-orange-600/40"></div><span className="text-[11px] md:text-[12px] font-bold theme-text-muted tracking-tight leading-tight">{step}</span></div> ))}</div></div><button onClick={(e) => { e.stopPropagation(); if (routine.lastCompleted !== selectedDate) { updateRoutineDetails(routine.id, { lastCompleted: selectedDate, streak: routine.streak + 1, completedDates: [...routine.completedDates, selectedDate] }); setPoints(p => p + 200); playAudio(SOUNDS.HABIT_COMPLETE); } }} disabled={routine.lastCompleted === selectedDate} className={`w-full py-5 rounded-3xl font-black uppercase text-[11px] tracking-widest transition-all active:scale-95 ${routine.lastCompleted === selectedDate ? 'bg-green-600/10 text-green-500 border border-green-600/30' : 'bg-orange-600 text-white shadow-glow-orange hover:scale-105'}`}>{routine.lastCompleted === selectedDate ? <div className="flex items-center justify-center gap-2"><CheckCircle size={18}/> Executado Hoje</div> : 'Iniciar Ritual'}</button></div> ))}</div>
             </div>
          )}

          {activeTab === 'habits' && (
             <div className="animate-in fade-in space-y-10 px-2 pb-20">
                <div className="flex justify-between items-center"><div className="space-y-1"><h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">Arquitetura de Hábitos</h2><p className="text-[10px] md:text-[12px] font-black theme-text-muted uppercase tracking-[0.3em]">Reprogramando a Gânglia Basal</p></div><div className="flex gap-4">
                   <button onClick={() => setActiveTutorial('habits')} className="p-3 theme-bg-card border theme-border rounded-2xl theme-text-muted hover:text-orange-500 transition-all"><HelpIcon size={20}/></button>
                   <button onClick={() => { const nh: Habit = { id: crypto.randomUUID(), text: "Novo Hábito", anchor: "Gatilho Visual", tinyAction: "Ação de 2 min", identity: "Eu sou alguém que...", streak: 0, lastCompleted: null, completedDates: [] }; setHabits([nh, ...habits]); setEditingHabitId(nh.id); }} className="p-4 md:p-5 bg-orange-600 text-white rounded-[24px] shadow-glow-orange hover:scale-110 active:scale-95 transition-all"><Plus size={28}/></button>
                </div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {habits.map(h => (
                     <div key={h.id} className="p-6 md:p-8 theme-bg-card border-2 theme-border rounded-[40px] space-y-6 group relative overflow-hidden transition-all hover:border-orange-500/40 cursor-pointer shadow-xl" onClick={() => setEditingHabitId(h.id)}><div className="absolute top-0 left-0 h-1 bg-orange-600/10 w-full"><div className="h-full bg-orange-600 shadow-glow-orange transition-all duration-1000" style={{width: `${Math.min(h.streak * 10, 100)}%`}}></div></div><div className="flex justify-between items-start" onClick={e => e.stopPropagation()}><div className="space-y-1 max-w-[80%]"><span className="text-[8px] font-black uppercase text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-md tracking-widest">{h.identity || 'Identidade'}</span><h3 className="text-lg md:text-xl font-black uppercase theme-text-main leading-tight truncate">{h.text}</h3></div><button onClick={() => setEditingHabitId(h.id)} className="p-2 theme-text-muted hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-all"><Edit3 size={18}/></button></div><div className="space-y-4"><div className="p-4 theme-bg-input rounded-3xl border theme-border space-y-2"><div className="flex items-center gap-2 opacity-50"><Anchor size={12}/><span className="text-[8px] font-black uppercase">Se {h.anchor}...</span></div><div className="flex items-center gap-2 text-orange-600"><Zap size={12}/><span className="text-[10px] md:text-[11px] font-black uppercase">Então {h.tinyAction}.</span></div></div><div className="flex items-center justify-between pt-2"><div className="flex items-center gap-2"><div className={`p-2 rounded-xl ${h.streak > 0 ? 'bg-orange-600 text-white animate-pulse shadow-glow-orange' : 'bg-slate-800 text-slate-500'}`}><Flame size={16}/></div><div className="flex flex-col"><span className="text-xl font-black theme-text-main leading-none">{h.streak}</span><span className="text-[8px] font-bold theme-text-muted uppercase">Dias</span></div></div><button onClick={(e) => { e.stopPropagation(); if (h.lastCompleted !== selectedDate) { updateHabitDetails(h.id, { lastCompleted: selectedDate, streak: h.streak + 1, completedDates: [...h.completedDates, selectedDate] }); setPoints(p => p + 150); playAudio(SOUNDS.HABIT_COMPLETE); } }} disabled={h.lastCompleted === selectedDate} className={`px-6 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 ${h.lastCompleted === selectedDate ? 'bg-green-600/10 text-green-500 border border-green-600/30' : 'bg-orange-600 text-white shadow-glow-orange hover:scale-105'}`}>{h.lastCompleted === selectedDate ? <Check size={14}/> : 'Registrar'}</button></div></div></div>
                   ))}
                </div>
             </div>
          )}

          {activeTab === 'capture' && (
            <div className="min-h-[70vh] flex flex-col justify-center animate-in fade-in zoom-in-95">
              <div className="text-center space-y-4 mb-12">
                 <div className="w-16 h-16 bg-orange-600/10 rounded-full flex items-center justify-center mx-auto border border-orange-600/20 shadow-glow-orange synapse-core"><BrainIcon className="text-orange-500" size={32}/></div>
                 <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">Captura Neural</h2>
                 <button onClick={() => setActiveTutorial('capture')} className="mx-auto flex items-center gap-2 text-[10px] font-black uppercase theme-text-muted hover:text-orange-500 transition-all tracking-widest"><HelpIcon size={14}/> Como funciona?</button>
              </div>
              <form onSubmit={async (e) => { e.preventDefault(); const taskInput = newTaskText.trim(); if (!taskInput || !user) return; const tempId = crypto.randomUUID(); const tempTask: Task = { id: tempId, text: taskInput, priority: Priority.Q2, energy: 'Média', capacityNeeded: 'Neutro', completed: false, subtasks: [], date: selectedDate, createdAt: Date.now(), isRefining: true }; setTasks(prev => [tempTask, ...prev]); setNewTaskText(""); setPoints(p => p + 20); playAudio(SOUNDS.CAPTURE); try { const parsed = await geminiService.parseNaturalTask(taskInput); updateTaskDetails(tempId, { priority: (parsed.priority as Priority) || Priority.Q2, energy: (parsed.energy as any) || 'Média', subtasks: parsed.subtasks || [], isRefining: false }); } catch { updateTaskDetails(tempId, { isRefining: false }); } }} className="relative max-w-2xl mx-auto w-full px-2">
                <div className="p-6 md:p-10 rounded-[40px] border-2 theme-bg-card theme-border focus-within:border-orange-600 shadow-glow-orange/10 transition-all"><div className="flex items-center gap-4"><input autoFocus value={newTaskText} onChange={e => setNewTaskText(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-xl md:text-3xl font-black theme-text-main placeholder:opacity-20" placeholder="Nova sinapse..." /><button type="submit" className="w-14 h-14 bg-orange-600 rounded-3xl flex items-center justify-center shadow-glow-orange text-white hover:scale-110 active:scale-90 transition-all"><Plus size={32}/></button></div></div>
              </form>
            </div>
          )}

          {activeTab === 'execute' && (
            <div className="animate-in fade-in space-y-6 md:space-y-12 pb-20">
               <div className="flex justify-between items-center">
                  <div className="space-y-1">
                     <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">Modo Executivo</h2>
                     <p className="text-[10px] md:text-[12px] font-black theme-text-muted uppercase tracking-[0.3em]">Engajando Córtex Pré-Frontal</p>
                  </div>
                  <button onClick={() => setActiveTutorial('execute')} className="p-3 theme-bg-card border theme-border rounded-2xl theme-text-muted hover:text-orange-500 transition-all"><HelpIcon size={20}/></button>
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-6 flex flex-col">
                    <div className="p-8 md:p-12 theme-bg-card rounded-[48px] md:rounded-[64px] border theme-border flex flex-col items-center justify-center space-y-6 md:space-y-10 shadow-2xl relative overflow-hidden order-1 group">
                        <div className="absolute inset-0 opacity-10 pointer-events-none"><svg className="w-full h-full transform -rotate-90"><circle cx="50%" cy="50%" r="48%" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-800"/><circle cx="50%" cy="50%" r="48%" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="1000" strokeDashoffset={1000 - (timeLeft / (90*60) * 1000)} className="text-orange-600 transition-all duration-1000"/></svg></div>
                        <div className={`text-6xl md:text-9xl font-black italic tracking-tighter tabular-nums theme-text-main drop-shadow-2xl transition-transform duration-500 ${isTimerActive ? 'scale-110' : ''}`}>{formatTime(timeLeft)}</div>
                        <div className="flex gap-4 md:gap-6 z-10"><button onClick={() => setIsTimerActive(!isTimerActive)} className="px-8 md:px-12 py-4 md:py-5 bg-orange-600 text-white rounded-[24px] md:rounded-[32px] font-black uppercase flex items-center gap-3 shadow-glow-orange transition-all hover:scale-105 active:scale-95 text-base md:text-lg">{isTimerActive ? <Pause size={24}/> : <Play size={24}/>} {isTimerActive ? 'Pausa' : 'Entrar no Fluxo'}</button><button onClick={() => { setTimeLeft(90*60); setIsTimerActive(false); }} className="p-4 md:p-5 theme-bg-input border theme-border rounded-[24px] md:rounded-[32px] theme-text-main hover:bg-orange-600/10 active:scale-90 transition-all"><RotateCcw size={24}/></button></div>
                    </div>
                    <div className="space-y-4 order-2 flex-1">
                       <div className="flex justify-between items-center px-4"><h3 className="text-[10px] md:text-[12px] font-black uppercase theme-text-muted tracking-[0.2em] flex items-center gap-2"><Target size={14} className="text-orange-500"/> Foco Crítico</h3><span className="text-[9px] font-black text-white bg-orange-600 px-2.5 py-1 rounded-lg uppercase shadow-glow-orange">{tasks.filter(t => t.date === selectedDate && !t.completed).length} Ativas</span></div>
                       <div className="space-y-3 px-1 max-h-[400px] overflow-y-auto no-scrollbar">{tasks.filter(t => t.date === selectedDate && !t.completed).map(tk => ( <TaskCard key={tk.id} task={tk} compact onComplete={(id: string) => { updateTaskDetails(id, {completed: true}); setPoints(p => p + 100); playAudio(SOUNDS.TASK_COMPLETE); }} onEdit={() => setEditingTaskId(tk.id)} /> ))}</div>
                    </div>
                  </div>
                  <div className="theme-bg-card border theme-border rounded-[48px] md:rounded-[64px] p-8 md:p-12 space-y-8 flex flex-col shadow-2xl">
                    <div className="flex justify-between items-center"><h3 className="text-xl md:text-2xl font-black uppercase italic theme-text-main flex items-center gap-3"><Clock className="text-orange-500" size={24}/> Timebox</h3><button onClick={() => setShowTimeboxCreator(true)} className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-glow-orange active:scale-90 transition-all"><Plus size={24}/></button></div>
                    <div className="space-y-4 overflow-y-auto no-scrollbar flex-1 min-h-[400px] pr-2">{timeboxEntries.sort((a,b) => a.start.localeCompare(b.start)).map(entry => ( <div key={entry.id} className={`p-5 md:p-6 rounded-[32px] border-2 transition-all flex items-center gap-4 group cursor-pointer ${entry.completed ? 'bg-green-600/5 border-green-600/20 opacity-60 scale-95' : 'theme-bg-input border-transparent hover:border-orange-500/40 shadow-lg'}`} onClick={() => setEditingTimeboxId(entry.id)}><div className="flex flex-col items-center min-w-[55px] md:min-w-[65px] border-r theme-border pr-4"><span className="text-[10px] md:text-[12px] font-black theme-text-main">{entry.start}</span><span className="text-[8px] md:text-[9px] font-bold theme-text-muted">{entry.end}</span></div><div className="flex-1"><h4 className={`text-[12px] md:text-sm font-black uppercase tracking-tighter leading-tight ${entry.completed ? 'line-through theme-text-muted' : 'theme-text-main'}`}>{entry.activity}</h4></div><div className="flex gap-2" onClick={e => e.stopPropagation()}><button onClick={() => { const updated = timeboxEntries.map(e => e.id === entry.id ? {...e, completed: !e.completed} : e); setTimeboxEntries(updated); if (!entry.completed) { setPoints(p => p + 250); playAudio(SOUNDS.TASK_COMPLETE); } }} className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all active:scale-90 ${entry.completed ? 'bg-green-600 text-white shadow-glow-green' : 'theme-bg-body border theme-border hover:border-orange-500 text-orange-500'}`}><Check size={20}/></button></div></div> ))}</div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 w-full theme-bg-sidebar backdrop-blur-2xl border-t theme-border z-[60] flex overflow-x-auto no-scrollbar px-3 py-3 justify-between items-center shadow-2xl">
        <MobIcon icon={<ListTodo size={20}/>} label="Captura" active={activeTab === 'capture'} onClick={() => setActiveTab('capture')}/>
        <MobIcon icon={<Timer size={20}/>} label="Executar" active={activeTab === 'execute'} onClick={() => setActiveTab('execute')}/>
        <MobIcon icon={<LayoutGrid size={20}/>} label="Matriz" active={activeTab === 'plan'} onClick={() => setActiveTab('plan')}/>
        <MobIcon icon={<RefreshCw size={20}/>} label="Hábitos" active={activeTab === 'habits'} onClick={() => setActiveTab('habits')}/>
        <MobIcon icon={<Gift size={20}/>} label="Melhorias" active={activeTab === 'upgrades'} onClick={() => setActiveTab('upgrades')}/>
        <MobIcon icon={<TrendingUp size={20}/>} label="Status" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}/>
      </nav>

      {/* MODALS */}
      {activeTutorial && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-xl animate-in fade-in">
           <div className="w-full max-w-2xl theme-bg-card border-2 theme-border rounded-[48px] md:rounded-[64px] p-8 md:p-16 shadow-2xl space-y-10 relative overflow-hidden animate-in zoom-in-95 duration-500">
              <div className="absolute top-0 right-0 p-8"><button onClick={() => { setActiveTutorial(null); setHasSeenWelcome(true); }} className="p-3 theme-bg-input rounded-2xl theme-text-muted hover:text-white transition-all"><X size={24}/></button></div>
              <div className="space-y-2">
                 <h2 className="text-3xl md:text-5xl font-black uppercase italic text-orange-600 tracking-tighter leading-none">{TUTORIAL_CONTENT[activeTutorial].title}</h2>
                 <p className="text-[10px] font-black theme-text-muted uppercase tracking-[0.3em]">Fundamentos de Neuroprodutividade</p>
              </div>
              <div className="space-y-8">
                 {TUTORIAL_CONTENT[activeTutorial].steps.map((s, i) => (
                   <div key={i} className="flex gap-6 items-start group">
                      <div className="p-4 rounded-2xl theme-bg-input border theme-border group-hover:scale-110 transition-all">{s.icon}</div>
                      <div className="space-y-1">
                         <h3 className="text-lg md:text-xl font-black uppercase italic theme-text-main tracking-tight">{s.title}</h3>
                         <p className="text-sm md:text-base font-bold theme-text-muted tracking-tight leading-relaxed">{s.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
              <button onClick={() => { setActiveTutorial(null); setHasSeenWelcome(true); }} className="w-full py-6 bg-orange-600 text-white rounded-[32px] font-black uppercase text-xs shadow-glow-orange hover:scale-105 active:scale-95 transition-all">Continuar Sinapse</button>
           </div>
        </div>
      )}

      {editingTaskId && <TaskEditor task={tasks.find(t => t.id === editingTaskId)} onClose={() => setEditingTaskId(null)} onUpdate={updateTaskDetails} onDelete={(id: string) => setTasks(prev => prev.filter(t => t.id !== id))} />}
      {editingHabitId && <HabitEditor habit={habits.find(h => h.id === editingHabitId)} onClose={() => setEditingHabitId(null)} onUpdate={updateHabitDetails} onDelete={(id: string) => setHabits(habits.filter(x => x.id !== id))} />}
      {editingRoutineId && <RoutineEditor routine={recurringTasks.find(r => r.id === editingRoutineId)} onClose={() => setEditingRoutineId(null)} onUpdate={updateRoutineDetails} onDelete={(id: string) => setRecurringTasks(prev => prev.filter(x => x.id !== id))} />}
      {editingTimeboxId && <TimeboxEditor entry={timeboxEntries.find(e => e.id === editingTimeboxId)} onClose={() => setEditingTimeboxId(null)} onUpdate={updateTimeboxDetails} onDelete={(id: string) => setTimeboxEntries(prev => prev.filter(x => x.id !== id))} />}
      {showTimeboxCreator && <TimeboxCreator onClose={() => setShowTimeboxCreator(false)} onAdd={(entry: TimeboxEntry) => setTimeboxEntries([...timeboxEntries, entry])} />}
      {editingDopaId && <DopamenuEditor item={dopamenuItems.find(i => i.id === editingDopaId)} onClose={() => setEditingDopaId(null)} onUpdate={updateDopaDetails} onDelete={(id: string) => setDopamenuItems(dopamenuItems.filter(x => x.id !== id))} />}
      {editingUpgradeId && <UpgradeEditor upgrade={upgrades.find(u => u.id === editingUpgradeId)} onClose={() => setEditingUpgradeId(null)} onUpdate={updateUpgradeDetails} onDelete={(id: string) => setUpgrades(upgrades.filter(x => x.id !== id))} />}
    </div>
  );
};

// HELPER COMPONENTS
const StatBox = ({ label, value, icon, color, subValue }: any) => (
  <div className="p-6 md:p-8 theme-bg-card border-2 theme-border rounded-[40px] space-y-2 shadow-xl flex flex-col items-center text-center transition-all hover:border-orange-500/30 group">
     <div className={`p-3 rounded-2xl bg-slate-800/50 mb-2 group-hover:scale-110 transition-all ${color}`}>{icon}</div>
     <h4 className="text-[10px] font-black uppercase theme-text-muted tracking-widest">{label}</h4>
     <span className={`text-2xl md:text-3xl font-black italic tracking-tighter ${color}`}>{value}</span>
     <p className="text-[8px] font-bold uppercase theme-text-muted opacity-60">{subValue}</p>
  </div>
);

const MetricRow = ({ label, value, icon }: any) => (
  <div className="flex items-center justify-between p-4 theme-bg-input/50 rounded-2xl border theme-border">
     <div className="flex items-center gap-3">
        <div className="text-orange-500 opacity-60">{icon}</div>
        <span className="text-[10px] font-black uppercase theme-text-main tracking-tight">{label}</span>
     </div>
     <span className="text-sm font-black italic text-orange-600">{value}</span>
  </div>
);

// EDITOR COMPONENTS
const UpgradeEditor = ({ upgrade, onClose, onUpdate, onDelete }: any) => (
  <div className="fixed inset-0 z-[8000] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
    <div className="w-full max-w-xl theme-bg-card border-t md:border-2 theme-border rounded-t-[48px] md:rounded-[64px] p-8 md:p-14 space-y-8 shadow-2xl border-orange-500/20 animate-in slide-in-from-bottom duration-500 overflow-y-auto max-h-[90vh] no-scrollbar">
       <div className="flex justify-between items-center">
          <div className="space-y-1"><h2 className="text-2xl md:text-3xl font-black italic uppercase text-orange-600 tracking-tighter">Bio Upgrade</h2><p className="text-[9px] font-black theme-text-muted uppercase tracking-[0.2em]">Configurando Melhorias Neurais</p></div>
          <button onClick={onClose} className="p-3 theme-bg-input rounded-2xl theme-text-muted hover:text-white active:scale-90"><X size={28}/></button>
       </div>
       <div className="space-y-6">
          <div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Nome da Melhoria</label><input className="w-full theme-bg-input p-5 rounded-3xl font-black theme-text-main border-2 theme-border focus:border-orange-500 outline-none text-base" value={upgrade.name} onChange={e => onUpdate(upgrade.id, {name: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Categoria</label><select className="w-full theme-bg-input p-4 md:p-5 rounded-2xl font-black theme-text-main border theme-border uppercase text-[10px]" value={upgrade.category} onChange={e => onUpdate(upgrade.id, {category: e.target.value as any})}><option value="Foco">Foco</option><option value="Energia">Energia</option><option value="Dopamina">Dopamina</option><option value="Recuperação">Recuperação</option></select></div><div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Custo em XP</label><input type="number" className="w-full theme-bg-input p-4 md:p-5 rounded-2xl font-black theme-text-main border theme-border text-xl" value={upgrade.cost} onChange={e => onUpdate(upgrade.id, {cost: parseInt(e.target.value) || 0})} /></div></div>
          <div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Ícone Neural</label><div className="grid grid-cols-5 gap-2">{Object.keys(UPGRADE_ICONS).map(iconName => ( <button key={iconName} onClick={() => onUpdate(upgrade.id, {icon: iconName})} className={`p-3 rounded-xl border transition-all ${upgrade.icon === iconName ? 'bg-orange-600 text-white border-orange-500' : 'theme-bg-input border-transparent hover:theme-border'}`}>{UPGRADE_ICONS[iconName]}</button> ))}</div></div>
          <div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Descrição do Efeito</label><textarea rows={3} className="w-full theme-bg-input p-5 rounded-3xl font-bold theme-text-main border-2 theme-border focus:border-orange-500 outline-none text-sm resize-none" value={upgrade.description} onChange={e => onUpdate(upgrade.id, {description: e.target.value})} placeholder="Descreva o benefício psicológico deste upgrade..." /></div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4"><button onClick={onClose} className="py-5 bg-orange-600 text-white font-black uppercase rounded-[28px] shadow-glow-orange text-xs active:scale-95 transition-all">Salvar Melhoria</button><button onClick={() => { if(confirm("Remover esta melhoria?")) { onDelete(upgrade.id); onClose(); } }} className="py-5 bg-red-600/10 text-red-500 font-black uppercase rounded-[28px] border border-red-500/20 text-xs active:scale-95 transition-all">Deletar</button></div>
    </div>
  </div>
);

const DopamenuEditor = ({ item, onClose, onUpdate, onDelete }: any) => (
  <div className="fixed inset-0 z-[8000] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
    <div className="w-full max-w-xl theme-bg-card border-t md:border-2 theme-border rounded-t-[48px] md:rounded-[64px] p-8 md:p-14 space-y-8 shadow-2xl border-orange-500/20 animate-in slide-in-from-bottom duration-500 overflow-y-auto max-h-[90vh] no-scrollbar">
       <div className="flex justify-between items-center"><div className="space-y-1"><h2 className="text-2xl md:text-3xl font-black italic uppercase text-purple-600 tracking-tighter">Bio Refeição</h2><p className="text-[9px] font-black theme-text-muted uppercase tracking-[0.2em]">Configurando Gatilhos Dopaminérgicos</p></div><button onClick={onClose} className="p-3 theme-bg-input rounded-2xl theme-text-muted hover:text-white active:scale-90"><X size={28}/></button></div>
       <div className="space-y-6">
          <div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Nome da Atividade</label><input className="w-full theme-bg-input p-5 rounded-3xl font-black theme-text-main border-2 theme-border focus:border-purple-500 outline-none text-base" value={item.label} onChange={e => onUpdate(item.id, {label: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Categoria</label><select className="w-full theme-bg-input p-4 md:p-5 rounded-2xl font-black theme-text-main border theme-border uppercase text-[10px]" value={item.category} onChange={e => onUpdate(item.id, {category: e.target.value as any})}><option value="Starter">Entrada (Rápido)</option><option value="Main">Prato Principal (Flow)</option><option value="Side">Acompanhamento (Background)</option><option value="Dessert">Sobremesa (Recompensa)</option></select></div><div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Esforço Exigido</label><select className="w-full theme-bg-input p-4 md:p-5 rounded-2xl font-black theme-text-main border theme-border uppercase text-[10px]" value={item.effort} onChange={e => onUpdate(item.id, {effort: e.target.value as any})}><option value="Baixo">Baixo</option><option value="Médio">Médio</option><option value="Alto">Alto</option></select></div></div>
          <div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Descrição Neural</label><textarea rows={3} className="w-full theme-bg-input p-5 rounded-3xl font-bold theme-text-main border-2 theme-border focus:border-purple-500 outline-none text-sm resize-none" value={item.description} onChange={e => onUpdate(item.id, {description: e.target.value})} placeholder="Por que isso te ajuda a regular?" /></div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4"><button onClick={onClose} className="py-5 bg-purple-600 text-white font-black uppercase rounded-[28px] shadow-glow-purple text-xs active:scale-95 transition-all">Salvar Cardápio</button><button onClick={() => { if(confirm("Remover do menu?")) { onDelete(item.id); onClose(); } }} className="py-5 bg-red-600/10 text-red-500 font-black uppercase rounded-[28px] border border-red-500/20 text-xs active:scale-95 transition-all">Deletar</button></div>
    </div>
  </div>
);

const RoutineEditor = ({ routine, onClose, onUpdate, onDelete }: any) => {
  const [subText, setSubText] = useState("");
  return (
    <div className="fixed inset-0 z-[8000] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-xl theme-bg-card border-t md:border-2 theme-border rounded-t-[48px] md:rounded-[64px] p-8 md:p-14 space-y-8 shadow-2xl border-orange-500/20 animate-in slide-in-from-bottom duration-500 overflow-y-auto max-h-[90vh] no-scrollbar">
         <div className="flex justify-between items-center"><div className="space-y-1"><h2 className="text-2xl md:text-3xl font-black italic uppercase text-orange-600 tracking-tighter">Neuro Ritual</h2><p className="text-[9px] font-black theme-text-muted uppercase tracking-[0.2em]">Sincronizando Funções Executivas</p></div><button onClick={onClose} className="p-3 theme-bg-input rounded-2xl theme-text-muted hover:text-white active:scale-90"><X size={28}/></button></div>
         <div className="space-y-6">
            <div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Identidade em Foco</label><input className="w-full theme-bg-input p-5 rounded-3xl font-black theme-text-main border-2 theme-border focus:border-orange-500 outline-none text-base" placeholder="Ex: Eu sou um profissional focado" value={routine.identity} onChange={e => onUpdate(routine.id, {identity: e.target.value})} /></div>
            <div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Título da Rotina</label><input className="w-full theme-bg-input p-5 rounded-3xl font-black theme-text-main border-2 theme-border focus:border-orange-500 outline-none text-base" value={routine.text} onChange={e => onUpdate(routine.id, {text: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Frequência</label><select className="w-full theme-bg-input p-4 md:p-5 rounded-2xl font-black theme-text-main border theme-border uppercase text-[10px]" value={routine.frequency} onChange={e => onUpdate(routine.id, {frequency: e.target.value as Frequency})}>{Object.values(Frequency).map(f => <option key={f} value={f}>{f}</option>)}</select></div><div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Energia</label><select className="w-full theme-bg-input p-4 md:p-5 rounded-2xl font-black theme-text-main border theme-border uppercase text-[10px]" value={routine.energy} onChange={e => onUpdate(routine.id, {energy: e.target.value as any})}><option value="Baixa">Baixa</option><option value="Média">Média</option><option value="Alta">Alta</option></select></div></div>
            <div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest flex items-center gap-1"><Anchor size={12}/> Gatilho Visual/Contextual (Âncora)</label><input className="w-full theme-bg-input p-5 rounded-3xl font-black theme-text-main border-2 theme-border focus:border-orange-500 outline-none text-base" placeholder="Ex: Após fechar o notebook..." value={routine.anchor} onChange={e => onUpdate(routine.id, {anchor: e.target.value})} /></div>
            <div className="space-y-3"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Rituais (Micro-passos)</label><div className="flex gap-2"><input className="flex-1 theme-bg-input p-4 rounded-2xl font-bold theme-text-main border theme-border text-xs" placeholder="Adicionar passo..." value={subText} onChange={e => setSubText(e.target.value)} onKeyDown={e => { if(e.key === 'Enter' && subText) { onUpdate(routine.id, { subtasks: [...routine.subtasks, subText] }); setSubText(""); } }} /><button onClick={() => { if(subText) { onUpdate(routine.id, { subtasks: [...routine.subtasks, subText] }); setSubText(""); } }} className="p-4 bg-orange-600 text-white rounded-2xl active:scale-90 transition-all"><Plus size={16}/></button></div><div className="space-y-2">{routine.subtasks.map((st: string, i: number) => ( <div key={i} className="flex justify-between items-center p-4 theme-bg-input/50 border theme-border rounded-2xl group"><span className="text-[11px] font-bold theme-text-main">{st}</span><button onClick={() => onUpdate(routine.id, { subtasks: routine.subtasks.filter((_: any, idx: number) => idx !== i) })} className="text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button></div> ))}</div></div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4"><button onClick={onClose} className="py-5 bg-orange-600 text-white font-black uppercase rounded-[28px] shadow-glow-orange text-xs active:scale-95 transition-all">Sincronizar Ritual</button><button onClick={() => { if(confirm("Remover esta rotina fixa?")) { onDelete(routine.id); onClose(); } }} className="py-5 bg-red-600/10 text-red-500 font-black uppercase rounded-[28px] border border-red-500/20 text-xs active:scale-95 transition-all">Deletar</button></div>
      </div>
    </div>
  );
};

const HabitEditor = ({ habit, onClose, onUpdate, onDelete }: any) => (
  <div className="fixed inset-0 z-[8000] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
    <div className="w-full max-w-xl theme-bg-card border-t md:border-2 theme-border rounded-t-[48px] md:rounded-[64px] p-8 md:p-14 space-y-8 shadow-2xl border-orange-500/20 animate-in slide-in-from-bottom duration-500">
       <div className="flex justify-between items-center"><div className="space-y-1"><h2 className="text-2xl md:text-3xl font-black italic uppercase text-orange-600 tracking-tighter">Bio Arquiteto</h2><p className="text-[9px] font-black theme-text-muted uppercase tracking-[0.2em]">Configurando Automação Neural</p></div><button onClick={onClose} className="p-3 theme-bg-input rounded-2xl theme-text-muted hover:text-white active:scale-90"><X size={28}/></button></div>
       <div className="space-y-6">
          <div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Identidade Desejada</label><input className="w-full theme-bg-input p-5 rounded-3xl font-black theme-text-main border-2 theme-border focus:border-orange-500 outline-none text-base" placeholder="Ex: Eu sou um leitor voraz" value={habit.identity} onChange={e => onUpdate(habit.id, {identity: e.target.value})} /></div>
          <div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Ação Central</label><input className="w-full theme-bg-input p-5 rounded-3xl font-black theme-text-main border-2 theme-border focus:border-orange-500 outline-none text-base" value={habit.text} onChange={e => onUpdate(habit.id, {text: e.target.value})} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest flex items-center gap-1"><Anchor size={10}/> Gatilho (Âncora)</label><input className="w-full theme-bg-input p-4 md:p-5 rounded-2xl font-black theme-text-main border theme-border uppercase text-[10px]" placeholder="Ex: Ao acordar..." value={habit.anchor} onChange={e => onUpdate(habit.id, {anchor: e.target.value})} /></div><div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest flex items-center gap-1"><Zap size={10}/> Micro Ação (Tiny Habit)</label><input className="w-full theme-bg-input p-4 md:p-5 rounded-2xl font-black theme-text-main border theme-border uppercase text-[10px]" placeholder="Ex: Ler 1 página" value={habit.tinyAction} onChange={e => onUpdate(habit.id, {tinyAction: e.target.value})} /></div></div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4"><button onClick={onClose} className="py-5 bg-orange-600 text-white font-black uppercase rounded-[28px] shadow-glow-orange text-xs active:scale-95 transition-all">Sincronizar Arquitetura</button><button onClick={() => { if(confirm("Deseja realmente deletar este hábito?")) { onDelete(habit.id); onClose(); } }} className="py-5 bg-red-600/10 text-red-500 font-black uppercase rounded-[28px] border border-red-500/20 text-xs active:scale-95 transition-all">Abortar Hábito</button></div>
    </div>
  </div>
);

const TaskEditor = ({ task, onClose, onUpdate, onDelete }: any) => (
  <div className="fixed inset-0 z-[8000] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
    <div className="w-full max-w-xl theme-bg-card border-t md:border-2 theme-border rounded-t-[40px] md:rounded-[56px] p-8 md:p-12 space-y-8 shadow-2xl border-orange-500/20 animate-in slide-in-from-bottom duration-500">
       <div className="flex justify-between items-center"><h2 className="text-2xl md:text-3xl font-black italic uppercase text-orange-600 tracking-tighter">Neuro Ajuste</h2><button onClick={onClose} className="p-3 theme-bg-input rounded-2xl theme-text-muted hover:text-white active:scale-90"><X size={28}/></button></div>
       <div className="space-y-6">
          <div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Descrição da Sinapse</label><textarea rows={2} className="w-full theme-bg-input p-5 rounded-3xl font-bold theme-text-main border-2 theme-border focus:border-orange-500 outline-none text-lg resize-none" value={task.text} onChange={e => onUpdate(task.id, {text: e.target.value})} placeholder="O que seu cérebro está processando?" /></div>
          <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Matriz</label><select className="w-full theme-bg-input p-4 md:p-5 rounded-2xl font-black theme-text-main border theme-border uppercase text-[10px]" value={task.priority} onChange={e => onUpdate(task.id, {priority: e.target.value as Priority})}><option value={Priority.Q1}>Q1 - Crítico</option><option value={Priority.Q2}>Q2 - Estratégico</option><option value={Priority.Q3}>Q3 - Delegar</option><option value={Priority.Q4}>Q4 - Eliminar</option></select></div><div className="space-y-2"><label className="text-[10px] font-black uppercase theme-text-muted ml-1 tracking-widest">Energia</label><select className="w-full theme-bg-input p-4 md:p-5 rounded-2xl font-black theme-text-main border theme-border uppercase text-[10px]" value={task.energy} onChange={e => onUpdate(task.id, {energy: e.target.value as any})}><option value="Baixa">Baixa</option><option value="Média">Média</option><option value="Alta">Alta</option></select></div></div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4"><button onClick={onClose} className="py-5 bg-orange-600 text-white font-black uppercase rounded-[28px] shadow-glow-orange text-xs active:scale-95 transition-all">Salvar Neurônios</button><button onClick={() => { onDelete(task.id); onClose(); }} className="py-5 bg-red-600/10 text-red-500 font-black uppercase rounded-[28px] border border-red-500/20 text-xs hover:bg-red-600 hover:text-white active:scale-95 transition-all">Excluir Sinapse</button></div>
    </div>
  </div>
);

const TimeboxCreator = ({ onClose, onAdd }: any) => {
  const [act, setAct] = useState(""); const [st, setSt] = useState("09:00"); const [et, setEt] = useState("10:00");
  return (
    <div className="fixed inset-0 z-[8000] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg theme-bg-card border-t md:border-2 theme-border rounded-t-[40px] md:rounded-[48px] p-8 md:p-12 space-y-8 shadow-2xl border-orange-500/20 animate-in slide-in-from-bottom"><h2 className="text-2xl font-black uppercase italic theme-text-main tracking-tighter">Bloquear Agenda</h2><div className="space-y-5"><input autoFocus className="w-full theme-bg-input p-5 rounded-3xl font-black theme-text-main text-lg border-2 theme-border focus:border-orange-500 outline-none" placeholder="O que será focado?" value={act} onChange={e => setAct(e.target.value)} /><div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] font-black uppercase theme-text-muted mb-2 block tracking-widest">Início</label><input type="time" className="w-full theme-bg-input p-5 rounded-2xl font-black theme-text-main text-xl" value={st} onChange={e => setSt(e.target.value)} /></div><div><label className="text-[10px] font-black uppercase theme-text-muted mb-2 block tracking-widest">Fim</label><input type="time" className="w-full theme-bg-input p-5 rounded-2xl font-black theme-text-main text-xl" value={et} onChange={e => setEt(e.target.value)} /></div></div></div><div className="flex flex-col gap-3"><button onClick={() => { onAdd({id: crypto.randomUUID(), activity: act, start: st, end: et, completed: false}); onClose(); }} className="w-full py-5 bg-orange-600 text-white font-black uppercase rounded-[28px] text-xs active:scale-95 shadow-glow-orange">Selar Bloco de Tempo</button><button onClick={onClose} className="w-full py-3 text-[10px] theme-text-muted uppercase font-black hover:theme-text-main transition-all">Cancelar</button></div></div>
    </div>
  );
};

const TimeboxEditor = ({ entry, onClose, onUpdate, onDelete }: any) => (
  <div className="fixed inset-0 z-[8000] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
    <div className="w-full max-w-lg theme-bg-card border-t md:border-2 theme-border rounded-t-[40px] md:rounded-[48px] p-8 md:p-12 space-y-8 shadow-2xl border-orange-500/20 animate-in slide-in-from-bottom"><h2 className="text-2xl font-black uppercase italic theme-text-main tracking-tighter">Re-arquitetar Bloco</h2><div className="space-y-5"><input className="w-full theme-bg-input p-5 rounded-3xl font-black theme-text-main text-lg" value={entry.activity} onChange={e => onUpdate(entry.id, {activity: e.target.value})} /><div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] font-black uppercase theme-text-muted mb-2 block">Início</label><input type="time" className="w-full theme-bg-input p-5 rounded-2xl font-black theme-text-main text-xl" value={entry.start} onChange={e => onUpdate(entry.id, {start: e.target.value})} /></div><div><label className="text-[10px] font-black uppercase theme-text-muted mb-2 block">Fim</label><input type="time" className="w-full theme-bg-input p-5 rounded-2xl font-black theme-text-main text-xl" value={entry.end} onChange={e => onUpdate(entry.id, {end: e.target.value})} /></div></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><button onClick={onClose} className="py-5 bg-orange-600 text-white font-black uppercase rounded-[28px] text-xs active:scale-95 transition-all">Confirmar Ajuste</button><button onClick={() => { onDelete(entry.id); onClose(); }} className="py-5 bg-red-600/10 text-red-500 font-black uppercase rounded-[28px] border border-red-500/20 text-xs active:scale-95 transition-all">Remover Bloco</button></div></div>
  </div>
);

const TaskCard = ({ task, onComplete, onEdit, onDecompose, compact = false }: any) => (
  <div className={`p-5 rounded-[32px] theme-bg-card border theme-border flex flex-col gap-3 transition-all active:scale-[0.97] md:hover:scale-[1.02] group relative ${task.completed ? 'opacity-50' : 'shadow-lg'}`}><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3 overflow-hidden flex-1"><button onClick={(e) => { e.stopPropagation(); onComplete(task.id); }} className={`w-7 h-7 md:w-8 md:h-8 rounded-xl border-2 theme-border flex items-center justify-center transition-all active:scale-75 ${task.completed ? 'bg-green-600 border-green-600 text-white shadow-glow-green' : 'hover:border-orange-500 bg-black/20'}`}>{task.completed && <Check size={16}/>}</button><div className="flex flex-col cursor-pointer flex-1" onClick={onEdit}><span className={`text-[12px] md:text-sm font-black uppercase theme-text-main truncate tracking-tighter ${task.completed ? 'line-through' : ''}`}>{task.text || "Sem título"}</span>{!compact && <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] ${task.energy === 'Baixa' ? 'text-green-500' : task.energy === 'Média' ? 'text-yellow-500' : 'text-red-500'}`}>{task.energy} Bateria</span>}</div></div>{!task.completed && ( <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all" onClick={e => e.stopPropagation()}>{task.isRefining ? <Loader2 size={16} className="animate-spin text-orange-500"/> : ( <> {onDecompose && <button onClick={onDecompose} className="p-2.5 theme-bg-input border theme-border rounded-xl theme-text-muted hover:text-orange-500 active:scale-90"><BrainCircuit size={16}/></button>} <button onClick={onEdit} className="p-2.5 theme-bg-input border theme-border rounded-xl theme-text-muted hover:text-orange-500 active:scale-90"><Edit3 size={16}/></button> </> )}</div> )}</div>{task.subtasks?.length > 0 && !task.completed && ( <div className="pl-10 space-y-2 border-l-2 theme-border border-dashed ml-3.5 py-1 animate-in slide-in-from-left-2 duration-500">{task.subtasks.map((st: string, i: number) => ( <div key={i} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-orange-600/40"></div><span className="text-[10px] md:text-[11px] theme-text-muted font-bold truncate tracking-tight">{st}</span></div> ))}</div> )}</div>
);

const NavBtn = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all ${active ? 'bg-orange-600 text-white shadow-glow-orange scale-[1.02]' : 'theme-text-muted hover:bg-white/5'}`}>{icon} {label}</button>
);

const MobIcon = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${active ? 'theme-text-main' : 'theme-text-muted'}`}><div className={`p-2.5 rounded-2xl transition-all ${active ? 'bg-orange-600 text-white shadow-glow-orange scale-110 -translate-y-1' : 'theme-bg-input/20'}`}>{icon}</div><span className={`text-[8px] font-black uppercase mt-1 tracking-tighter ${active ? 'opacity-100' : 'opacity-40'}`}>{label}</span></button>
);

const SynapseLogo = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="14" fill="currentColor" fillOpacity="0.05" /><circle cx="16" cy="16" r="6" stroke="#f97316" strokeWidth="2.5"/><circle cx="16" cy="16" r="3" fill="#f97316"/><path d="M16 16L26 6" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round"/><circle cx="26" cy="6" r="2.5" fill="#ef4444"/></svg>
);

export default App;
